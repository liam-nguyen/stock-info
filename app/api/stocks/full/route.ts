// Endpoint to get all cached stock data from all sources
// Only returns cached data - no auto-refresh (worker handles that)

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import { getCachedStockData } from "@/lib/utils/stock-data-retriever";
// Schema imports removed - not used in this route

const RequestBodySchema = z.object({
  symbols: z.array(z.string()).describe("Array of stock ticker symbols"),
});

export const { POST } = defineRoute({
  operationId: "getFullStockData",
  method: "POST",
  summary: "Get all cached stock data from all sources",
  description:
    "Retrieve all cached stock data from all sources for multiple symbols. Returns cached data even if expired (worker handles refresh).",
  tags: ["Stocks"],
  requestBody: RequestBodySchema,
  action: async ({ body }) => {
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

      // Build response with errors for missing symbols
      const response: Record<string, unknown> & {
        _errors?: Record<string, { error: string }>;
      } = { ...results };
      if (missingSymbols.length > 0) {
        response._errors = {};
        for (const symbol of missingSymbols) {
          if (response._errors) {
            response._errors[symbol] = {
              error: `No cached data found for ${symbol}`,
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
