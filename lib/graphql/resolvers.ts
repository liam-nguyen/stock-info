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
async function resolveStock(
  ticker: string
): Promise<Record<string, unknown> | null> {
  const upperTicker = ticker.toUpperCase();
  console.log(`[Resolver] Resolving stock: ${upperTicker}`);

  // Special handling for NHFSMKX98: calculate from FXAIX price
  if (upperTicker === "NHFSMKX98") {
    console.log(
      `[Resolver] NHFSMKX98 is calculated from FXAIX, fetching FXAIX...`
    );
    const fxaiData: Record<string, unknown> | null =
      await resolveStock("FXAIX");
    if (!fxaiData || typeof fxaiData.price !== "number") {
      console.error(
        `[Resolver] Failed to get FXAIX price for NHFSMKX98 calculation`
      );
      return null;
    }

    const calculatedPrice: number = fxaiData.price / 3.43;
    console.log(
      `[Resolver] Calculated NHFSMKX98 price: ${calculatedPrice} (FXAIX: ${fxaiData.price} / 3.43)`
    );

    // Return calculated data with FXAIX metadata
    return {
      ticker: "NHFSMKX98",
      price: calculatedPrice,
      change:
        typeof fxaiData.change === "number" ? fxaiData.change / 3.43 : null,
      percentChange:
        typeof fxaiData.percentChange === "number"
          ? fxaiData.percentChange
          : null, // Same percentage change
      highPrice:
        typeof fxaiData.highPrice === "number"
          ? fxaiData.highPrice / 3.43
          : null,
      lowPrice:
        typeof fxaiData.lowPrice === "number" ? fxaiData.lowPrice / 3.43 : null,
      openPrice:
        typeof fxaiData.openPrice === "number"
          ? fxaiData.openPrice / 3.43
          : null,
      previousClose:
        typeof fxaiData.previousClose === "number"
          ? fxaiData.previousClose / 3.43
          : null,
      timestamp: fxaiData.timestamp,
      queryTime: fxaiData.queryTime,
      metadata: fxaiData.metadata,
      apiMetadata: fxaiData.apiMetadata || null,
    };
  }

  // Check cache first
  let cachedData = await getCachedStock(upperTicker);

  if (cachedData) {
    console.log(`[Resolver] Cache hit for ${upperTicker}`);
    // Extract source from metadata for stale check
    const metadata = cachedData._metadata as
      | { fetchedAt: number; source: string }
      | undefined;
    const source = metadata?.source;

    // If cached but stale, queue for refresh (non-blocking)
    const stale = await isCacheStale(upperTicker, source);
    if (stale) {
      console.log(
        `[Resolver] Cache is stale for ${upperTicker} (source: ${source}), queueing refresh`
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
          `[Resolver] Successfully fetched ${upperTicker} from ${result.source}, caching...`
        );
        await setCachedStock(
          upperTicker,
          result.data as unknown as Record<string, unknown>,
          result.source
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
    | { fetchedAt: number; source: string }
    | undefined;

  if (!metadata) {
    console.warn(
      `[Resolver] No metadata found in cached data for ${upperTicker}`
    );
  }

  const data = { ...cachedData };
  delete data._metadata;

  // Extract apiMetadata if present (from normalized structure)
  const apiMetadata =
    (data.apiMetadata as
      | {
          source: string;
          timestamp?: number;
          volume?: string;
          latestTradingDay?: string;
          symbol?: string;
        }
      | undefined) || null;
  delete data.apiMetadata;

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
    apiMetadata: apiMetadata,
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
          args.tickers.map(async (ticker) => {
            const result = await resolveStock(ticker);
            return { ticker: ticker.toUpperCase(), result };
          })
        );

        const successful: Record<string, unknown>[] = [];

        results.forEach(({ result }) => {
          if (result !== null) {
            successful.push(result);
          }
        });

        console.log(
          `[GraphQL Resolver] stocks() returning ${successful.length} successful results`
        );
        return successful;
      } catch (error) {
        console.error(`[GraphQL Resolver] stocks() threw exception:`, error);
        throw error;
      }
    },
    failed: async (_parent: unknown, args: { tickers: string[] }) => {
      console.log(`[GraphQL Resolver] failed() called with args:`, args);
      try {
        const results = await Promise.all(
          args.tickers.map(async (ticker) => {
            const result = await resolveStock(ticker);
            return { ticker: ticker.toUpperCase(), result };
          })
        );

        const failed: string[] = [];

        results.forEach(({ ticker, result }) => {
          if (result === null) {
            failed.push(ticker);
          }
        });

        console.log(
          `[GraphQL Resolver] failed() returning ${failed.length} failed tickers`
        );
        return failed;
      } catch (error) {
        console.error(`[GraphQL Resolver] failed() threw exception:`, error);
        throw error;
      }
    },
  },
};
