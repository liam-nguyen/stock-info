// Endpoint to get only current prices from cache
// Auto-fetches and caches missing symbols from Yahoo Finance
// Tries sources in priority order until a price is found

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import { getCachedStockData } from "@/lib/utils/stock-data-retriever";
import { extractPriceFromSource } from "@/lib/utils/price-extractors";
import { getSourceModel, batchWriteToCollection } from "@/lib/db/cache-helpers";

const RequestBodySchema = z.object({
  symbols: z.array(z.string()).describe("Array of stock ticker symbols"),
});

// Priority order for sources (tried in this order)
const SOURCE_PRIORITY = ["yf", "scraper"]; // Add more sources as they're added

export const { POST } = defineRoute({
  operationId: "getStockPrices",
  method: "POST",
  summary: "Get current stock prices from cache",
  description:
    "Retrieve current prices for multiple symbols. Automatically fetches and caches missing symbols from Yahoo Finance. Tries sources in priority order until a price is found. Returns cached data even if expired (worker handles refresh).",
  tags: ["Stocks"],
  requestBody: RequestBodySchema,
  action: async ({ body }, request) => {
    const { symbols } = body;

    if (!symbols || symbols.length === 0) {
      return Response.json(
        {
          error: "Symbols array is required and cannot be empty",
        },
        { status: 400 }
      );
    }

    try {
      // Get cached data with priceOnly option (only fetches quoteSummary)
      const cachedData = await getCachedStockData(symbols, { priceOnly: true });

      const results: Record<
        string,
        { price: number; source: string; queryTime: string }
      > = {};
      const errors: Record<string, { error: string }> = {};
      const missingSymbols: string[] = [];

      // For each symbol, try sources in priority order
      for (const symbol of symbols) {
        let priceFound = false;

        // Try each source in priority order
        for (const source of SOURCE_PRIORITY) {
          if (cachedData[symbol] && cachedData[symbol][source]) {
            const sourceData = cachedData[symbol][source];
            const priceResult = extractPriceFromSource(source, sourceData);

            if (priceResult) {
              // Get queryTime from the cached document
              try {
                const Model = getSourceModel(source);
                const cachedDoc = await Model.findOne({ symbol }).lean();
                const queryTime = cachedDoc?.queryTime
                  ? new Date(cachedDoc.queryTime).toISOString()
                  : new Date().toISOString();

                results[symbol] = {
                  price: priceResult.price,
                  source: priceResult.source,
                  queryTime,
                };
                priceFound = true;
                break; // Found price, move to next symbol
              } catch (error) {
                console.error(
                  `Error getting queryTime for ${symbol} from ${source}:`,
                  error
                );
                // Still use the price even if we can't get queryTime
                results[symbol] = {
                  price: priceResult.price,
                  source: priceResult.source,
                  queryTime: new Date().toISOString(),
                };
                priceFound = true;
                break;
              }
            }
          }
        }

        // If no price found for this symbol, mark as missing
        if (!priceFound) {
          missingSymbols.push(symbol);
        }
      }

      // If there are missing symbols, fetch them from Yahoo Finance and cache them
      if (missingSymbols.length > 0) {
        try {
          // Get base URL from request
          const baseUrl = new URL(request.url).origin;

          // Fetch missing symbols from Yahoo Finance (parallelized in the endpoint)
          const fetchResponse = await fetch(`${baseUrl}/api/stocks/yf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ symbols: missingSymbols }),
          });

          if (fetchResponse.ok) {
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
                    if (missingSymbols.includes(symbol)) {
                      sourceResults[symbol] = data;
                    }
                  }
                }
              }

              // Write all fetched data to cache (parallelized internally)
              // Write full data even though we only need price
              if (Object.keys(sourceResults).length > 0) {
                try {
                  await batchWriteToCollection("yf", sourceResults);
                } catch (writeError) {
                  console.error(
                    "Error writing fetched data to cache:",
                    writeError
                  );
                  // Continue even if write fails - we can still extract prices
                }

                // Extract prices from fetched data and add to results
                for (const [symbol, data] of Object.entries(sourceResults)) {
                  const yfData = data as {
                    quoteSummary?: unknown;
                    insights?: unknown;
                    chart?: unknown;
                    fundamentalsTimeSeries?: unknown;
                  };

                  // Extract price from yf source data
                  const priceResult = extractPriceFromSource("yf", {
                    quoteSummary: yfData.quoteSummary,
                  });

                  if (priceResult) {
                    const queryTime = new Date().toISOString();
                    results[symbol] = {
                      price: priceResult.price,
                      source: priceResult.source,
                      queryTime,
                    };

                    // Remove from missingSymbols since we found the price
                    const index = missingSymbols.indexOf(symbol);
                    if (index > -1) {
                      missingSymbols.splice(index, 1);
                    }
                  }
                }
              }
            }

            // Handle failed symbols from fetch
            if (
              fetchData.failedToFetchSymbols &&
              fetchData.failedToFetchSymbols.length > 0
            ) {
              // Add failed fetch symbols to errors
              for (const failedSymbol of fetchData.failedToFetchSymbols) {
                if (missingSymbols.includes(failedSymbol)) {
                  errors[failedSymbol] = {
                    error: `No price data found for ${failedSymbol} in any source and failed to fetch from Yahoo Finance`,
                  };
                  // Remove from missingSymbols since we're handling it in errors
                  const index = missingSymbols.indexOf(failedSymbol);
                  if (index > -1) {
                    missingSymbols.splice(index, 1);
                  }
                }
              }
            }
          } else {
            console.error(
              `Failed to fetch from Yahoo Finance: ${fetchResponse.status}`
            );
          }
        } catch (fetchError) {
          console.error(
            "Error fetching missing symbols from Yahoo Finance:",
            fetchError
          );
        }
      }

      // Add any remaining missing symbols to errors
      for (const symbol of missingSymbols) {
        errors[symbol] = {
          error: `No price data found for ${symbol} in any source and failed to fetch from Yahoo Finance`,
        };
      }

      // Build response
      const response: Record<string, unknown> = { ...results };
      if (Object.keys(errors).length > 0) {
        response._errors = errors;
      }

      return Response.json(response);
    } catch (error) {
      console.error("Error getting stock prices:", error);
      return Response.json(
        {
          error: "Failed to get stock prices",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: "Stock prices retrieved successfully",
      content: z
        .object({
          // Dynamic record: symbol -> { price, source, queryTime }
          // Example: { "AAPL": { price: 150.25, source: "yf", queryTime: "2024-01-01T00:00:00.000Z" } }
        })
        .passthrough()
        .describe(
          "Stock prices organized by symbol. Each symbol contains price, source, and queryTime."
        ),
    },
    400: {
      description: "Bad request",
      content: z.object({
        error: z.string().describe("Error message"),
      }),
    },
    500: {
      description: "Error retrieving stock prices",
      content: z.object({
        error: z.string().describe("Error type"),
        message: z.string().optional().describe("Error message"),
      }),
    },
  },
});
