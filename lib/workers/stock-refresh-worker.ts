/**
 * Background refresh worker for stock data
 * Queries oldest stocks and refreshes them
 */

import dbConnect from "@/lib/db/mongodb";
import { getSourceModel, batchWriteToCollection } from "@/lib/db/cache-helpers";

export interface RefreshResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ symbol: string; error: string; stack?: string }>;
}

/**
 * Refresh the oldest stocks in the database
 * @param limit - Number of stocks to refresh (default: 10)
 * @param baseUrl - Base URL for API calls (e.g., "http://localhost:3000")
 * @returns RefreshResult with statistics
 */
export async function refreshOldestStocks(
  limit: number = 10,
  baseUrl: string
): Promise<RefreshResult> {
  await dbConnect();

  const result: RefreshResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all available sources
    const knownSources = ["yf"]; // Add other sources here as they're added

    // For each source, get the oldest stocks
    for (const source of knownSources) {
      try {
        const Model = getSourceModel(source);

        // Query the oldest stocks (sorted by queryTime ascending, limit)
        const oldestStocks = await Model.find()
          .sort({ queryTime: 1 }) // Ascending (oldest first)
          .limit(limit)
          .select("symbol")
          .lean();

        if (oldestStocks.length === 0) {
          console.log(`No stocks found in source ${source} to refresh`);
          continue;
        }

        const symbols = oldestStocks.map(
          (stock: { symbol: string }) => stock.symbol
        );
        console.log(
          `Refreshing ${symbols.length} oldest stocks from ${source}: ${symbols.join(", ")}`
        );

        // Fetch fresh data from source endpoint
        const sourceEndpoint = `/api/stocks/${source}`;
        const fetchResponse = await fetch(`${baseUrl}${sourceEndpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ symbols }),
        });

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          const errorMessage = `Failed to fetch data from ${source}: ${fetchResponse.status} ${JSON.stringify(errorData)}`;
          console.error(errorMessage);

          // Log error for each symbol
          for (const symbol of symbols) {
            result.processed++;
            result.failed++;
            result.errors.push({
              symbol,
              error: errorMessage,
            });
          }
          continue;
        }

        const fetchData = (await fetchResponse.json()) as {
          stocksData?: Array<Record<string, unknown>>;
          failedToFetchSymbols?: string[];
        };

        // Process response from /api/stocks/yf
        // Response format: { stocksData: [{ AAPL: {...} }, { MSFT: {...} }], failedToFetchSymbols: [] }
        const sourceResults: Record<string, unknown> = {};

        if (fetchData.stocksData) {
          // Process stocksData array
          for (const stockDataObj of fetchData.stocksData) {
            if (stockDataObj && typeof stockDataObj === "object") {
              for (const [symbol, data] of Object.entries(stockDataObj)) {
                if (symbols.includes(symbol)) {
                  sourceResults[symbol] = data;
                }
              }
            }
          }

          // Write all refreshed data to collection (each stock gets its own queryTime)
          if (Object.keys(sourceResults).length > 0) {
            try {
              await batchWriteToCollection(source, sourceResults);

              // Count successes
              for (const symbol of Object.keys(sourceResults)) {
                result.processed++;
                result.succeeded++;
                console.log(`Successfully refreshed ${symbol} from ${source}`);
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              const errorStack =
                error instanceof Error ? error.stack : undefined;
              console.error(
                `Error writing refreshed data to DB for source ${source}:`,
                errorMessage,
                errorStack
              );

              // Log error for each symbol that was supposed to be written
              for (const symbol of Object.keys(sourceResults)) {
                result.failed++;
                result.errors.push({
                  symbol,
                  error: `Failed to write to DB: ${errorMessage}`,
                  stack: errorStack,
                });
              }
            }
          }
        }

        // Handle failed symbols
        if (
          fetchData.failedToFetchSymbols &&
          fetchData.failedToFetchSymbols.length > 0
        ) {
          for (const failedSymbol of fetchData.failedToFetchSymbols) {
            result.processed++;
            result.failed++;
            const errorMessage = `Failed to fetch data for ${failedSymbol} from ${source}`;
            console.error(errorMessage);
            result.errors.push({
              symbol: failedSymbol,
              error: errorMessage,
            });
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(
          `Error processing source ${source}:`,
          errorMessage,
          errorStack
        );

        // Log error for the source
        result.errors.push({
          symbol: `source:${source}`,
          error: `Failed to process source: ${errorMessage}`,
          stack: errorStack,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error in refreshOldestStocks:", errorMessage, errorStack);
    result.errors.push({
      symbol: "worker",
      error: `Worker error: ${errorMessage}`,
      stack: errorStack,
    });
  }

  console.log(
    `Refresh completed: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.processed} processed`
  );
  return result;
}
