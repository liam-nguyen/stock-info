import {
  getCachedStock,
  isCacheStale,
  queueRefresh,
  setCachedStock,
} from "../db/redis";
import { fetchStockData } from "../utils/stock-data-fetcher";

/**
 * Resolve a single stock
 */
async function resolveStock(ticker: string) {
  const upperTicker = ticker.toUpperCase();
  console.log(`[Resolver] Resolving stock: ${upperTicker}`);

  // Check cache first
  let cachedData = await getCachedStock(upperTicker);

  if (cachedData) {
    console.log(`[Resolver] Cache hit for ${upperTicker}`);
    // Extract dataType from metadata for stale check
    const metadata = cachedData._metadata as
      | { fetchedAt: number; source: string; dataType?: string }
      | undefined;
    const dataType = metadata?.dataType;

    // If cached but stale, queue for refresh (non-blocking)
    const stale = await isCacheStale(upperTicker, dataType);
    if (stale) {
      console.log(
        `[Resolver] Cache is stale for ${upperTicker} (dataType: ${dataType}), queueing refresh`
      );
      queueRefresh(upperTicker).catch((error) => {
        console.error(
          `[Resolver] Error queueing refresh for ${upperTicker}:`,
          error
        );
      });
    }
  } else {
    // If not cached, fetch immediately
    console.log(
      `[Resolver] Cache miss for ${upperTicker}, fetching from source...`
    );
    try {
      const result = await fetchStockData(upperTicker);
      if (result) {
        console.log(
          `[Resolver] Successfully fetched ${upperTicker} from ${result.source} (dataType: ${result.dataType}), caching...`
        );
        await setCachedStock(
          upperTicker,
          result.data,
          result.source,
          result.dataType
        );
        cachedData = await getCachedStock(upperTicker);
        if (!cachedData) {
          console.error(
            `[Resolver] Failed to retrieve cached data after setting for ${upperTicker}`
          );
          return null;
        }
        console.log(`[Resolver] Successfully cached ${upperTicker}`);
      } else {
        console.error(
          `[Resolver] fetchStockData returned null for ${upperTicker} - check logs above for details`
        );
        return null;
      }
    } catch (error) {
      console.error(
        `[Resolver] Exception in resolveStock for ${upperTicker}:`,
        error
      );
      if (error instanceof Error) {
        console.error(`[Resolver] Error stack:`, error.stack);
      }
      return null;
    }
  }

  if (!cachedData) {
    console.error(
      `[Resolver] No cached data available for ${upperTicker} after fetch attempt`
    );
    return null;
  }

  // Extract metadata
  const metadata = cachedData._metadata as
    | { fetchedAt: number; source: string; dataType?: string }
    | undefined;

  if (!metadata) {
    console.warn(
      `[Resolver] No metadata found in cached data for ${upperTicker}`
    );
  }

  const data = { ...cachedData };
  delete data._metadata;

  // Normalize data format: map Finnhub's currentPrice to price
  if (data.currentPrice !== undefined && data.price === undefined) {
    data.price = data.currentPrice as number;
    console.log(
      `[Resolver] Mapped currentPrice to price for ${upperTicker} (Finnhub data)`
    );
  }

  console.log(
    `[Resolver] Successfully resolved ${upperTicker} with ${Object.keys(data).length} fields`
  );
  return {
    ticker: upperTicker,
    ...data,
    metadata: metadata
      ? {
          fetchedAt: metadata.fetchedAt,
          source: metadata.source,
        }
      : null,
  };
}

/**
 * GraphQL resolvers
 */
export const resolvers = {
  Query: {
    stock: async (_parent: unknown, args: { ticker: string }) => {
      console.log(`[GraphQL Resolver] stock() called with args:`, args);
      try {
        const result = await resolveStock(args.ticker);
        console.log(
          `[GraphQL Resolver] stock() returning:`,
          result ? "data" : "null"
        );
        return result;
      } catch (error) {
        console.error(`[GraphQL Resolver] stock() threw exception:`, error);
        throw error;
      }
    },
    stocks: async (_parent: unknown, args: { tickers: string[] }) => {
      console.log(`[GraphQL Resolver] stocks() called with args:`, args);
      try {
        const results = await Promise.all(
          args.tickers.map((ticker) => resolveStock(ticker))
        );
        const filtered = results.filter((result) => result !== null);
        console.log(
          `[GraphQL Resolver] stocks() returning ${filtered.length} results`
        );
        return filtered;
      } catch (error) {
        console.error(`[GraphQL Resolver] stocks() threw exception:`, error);
        throw error;
      }
    },
  },
};
