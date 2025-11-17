// Endpoint to get all cached stock data from all sources
// Auto-fetches and caches missing symbols from Yahoo Finance

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import { getCachedStockData } from "@/lib/utils/stock-data-retriever";
import { batchWriteToCollection } from "@/lib/db/cache-helpers";
// Schema imports removed - not used in this route

const RequestBodySchema = z.object({
  symbols: z.array(z.string()).describe("Array of stock ticker symbols"),
});

export const { POST } = defineRoute({
  operationId: "getFullStockData",
  method: "POST",
  summary: "Get all cached stock data from all sources",
  description:
    "Retrieve all cached stock data from all sources for multiple symbols. Automatically fetches and caches missing symbols from Yahoo Finance. Returns cached data even if expired (worker handles refresh).",
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
      const results = await getCachedStockData(symbols, { priceOnly: false });

      // Check for missing symbols
      const missingSymbols: string[] = [];
      for (const symbol of symbols) {
        if (!results[symbol] || Object.keys(results[symbol]).length === 0) {
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
              if (Object.keys(sourceResults).length > 0) {
                try {
                  await batchWriteToCollection("yf", sourceResults);

                  // Add fetched data to results
                  for (const [symbol, data] of Object.entries(sourceResults)) {
                    if (!results[symbol]) {
                      results[symbol] = {};
                    }
                    results[symbol].yf = data;
                  }
                } catch (writeError) {
                  console.error(
                    "Error writing fetched data to cache:",
                    writeError
                  );
                  // Continue even if write fails - we still have the fetched data
                  // Add fetched data to results even if cache write failed
                  for (const [symbol, data] of Object.entries(sourceResults)) {
                    if (!results[symbol]) {
                      results[symbol] = {};
                    }
                    results[symbol].yf = data;
                  }
                }
              }
            }

            // Handle failed symbols from fetch
            if (
              fetchData.failedToFetchSymbols &&
              fetchData.failedToFetchSymbols.length > 0
            ) {
              // These will be added to _errors below
              // Remove successfully fetched symbols from missingSymbols
              for (const symbol of Object.keys(sourceResults)) {
                const index = missingSymbols.indexOf(symbol);
                if (index > -1) {
                  missingSymbols.splice(index, 1);
                }
              }
              // Add failed fetch symbols back to missingSymbols if not already there
              for (const failedSymbol of fetchData.failedToFetchSymbols) {
                if (!missingSymbols.includes(failedSymbol)) {
                  missingSymbols.push(failedSymbol);
                }
              }
            } else {
              // All symbols were fetched successfully, clear missingSymbols
              missingSymbols.length = 0;
            }
          } else {
            console.error(
              `Failed to fetch from Yahoo Finance: ${fetchResponse.status}`
            );
            // Keep missingSymbols as is for error reporting
          }
        } catch (fetchError) {
          console.error(
            "Error fetching missing symbols from Yahoo Finance:",
            fetchError
          );
          // Keep missingSymbols as is for error reporting
        }
      }

      // Build response with errors for any remaining missing symbols
      const response: Record<string, unknown> & {
        _errors?: Record<string, { error: string }>;
      } = { ...results };
      if (missingSymbols.length > 0) {
        response._errors = {};
        for (const symbol of missingSymbols) {
          if (response._errors) {
            response._errors[symbol] = {
              error: `No cached data found for ${symbol} and failed to fetch from Yahoo Finance`,
            };
          }
        }
      }

      return Response.json(response);
    } catch (error) {
      console.error("Error getting stock data:", error);
      return Response.json(
        {
          error: "Failed to get stock data",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: "Stock data retrieved successfully",
      content: z
        .object({
          // Dynamic record: symbol -> source -> data
          // Example: { "AAPL": { yf: {...} }, "MSFT": { yf: {...} } }
        })
        .passthrough()
        .describe(
          "Stock data organized by symbol, then by source. Each symbol contains all available sources as separate keys."
        ),
    },
    400: {
      description: "Bad request",
      content: z.object({
        error: z.string().describe("Error message"),
      }),
    },
    500: {
      description: "Error retrieving stock data",
      content: z.object({
        error: z.string().describe("Error type"),
        message: z.string().optional().describe("Error message"),
      }),
    },
  },
});
