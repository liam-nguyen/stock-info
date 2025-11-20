// This route is a wrapper around the scraper system used to get stock data from scrapers

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import { runScrapers } from "@/lib/utils/scraper-helper";
import { getSourceModel } from "@/lib/db/cache-helpers";
import { BaseScraper } from "@/lib/utils/scraper";

export const { POST } = defineRoute({
  operationId: "getStocksDataFromScrapers",
  method: "POST",
  summary: "Get stocks' data from scrapers",
  description: "Get stocks data from registered scrapers",
  tags: ["Stocks", "Scraper"],
  requestBody: z.object({
    symbols: z
      .array(z.string())
      .describe("Symbols of the stocks to get data for"),
  }),
  action: async ({ body }) => {
    const symbols = body.symbols;

    if (!symbols || symbols.length === 0) {
      return Response.json(
        {
          error: "Symbols array is required and cannot be empty",
        },
        { status: 400 }
      );
    }

    // Get registered scrapers
    // TODO: User will add child scraper instances here
    const scrapers: BaseScraper[] = [];

    if (scrapers.length === 0) {
      return Response.json({
        stocksData: [],
        failedToFetchSymbols: symbols,
      });
    }

    try {
      // Run all scrapers
      const results = await runScrapers(symbols, scrapers);

      // Flatten results for DB storage (each source stored separately)
      // Format: { "AAPL-site1": { symbol: "AAPL", price, source, queryTime }, ... }
      const dbData: Record<
        string,
        { price: number; source: string; queryTime: Date; symbol: string }
      > = {};
      const responseData: Record<
        string,
        Record<string, { price: number; source: string; queryTime: Date }>
      > = {};

      for (const [symbol, sources] of Object.entries(results)) {
        responseData[symbol] = {};
        for (const [source, data] of Object.entries(sources)) {
          // Store in DB with compound key (will be handled by unique index)
          const dbKey = `${symbol}-${source}`;
          dbData[dbKey] = {
            symbol: data.symbol,
            price: data.price,
            source: data.source,
            queryTime: data.queryTime,
          };
          // Add to response data organized by symbol => source
          responseData[symbol][source] = {
            price: data.price,
            source: data.source,
            queryTime: data.queryTime,
          };
        }
      }

      // Write to database (each source stored separately with compound key)
      if (Object.keys(dbData).length > 0) {
        try {
          const Model = getSourceModel("scraper");
          const writePromises = Object.values(dbData).map((data) => {
            const updateData = {
              symbol: data.symbol,
              price: data.price,
              source: data.source,
              queryTime: data.queryTime,
            };
            // Use compound key (symbol + source) for upsert
            return Model.findOneAndUpdate(
              { symbol: data.symbol, source: data.source },
              updateData,
              {
                upsert: true,
                new: true,
              }
            );
          });
          await Promise.all(writePromises);
        } catch (writeError) {
          console.error("Error writing scraper data to cache:", writeError);
          // Continue even if write fails
        }
      }

      // Format response to match expected structure
      // Response format: { stocksData: [{ AAPL: { site1: {...}, site2: {...} } }, ...], failedToFetchSymbols: [] }
      const stocksData = Object.entries(responseData).map(
        ([symbol, sources]) => ({
          [symbol]: sources,
        })
      );

      // Determine failed symbols
      const successfulSymbols = new Set(Object.keys(responseData));
      const failedToFetchSymbols = symbols.filter(
        (symbol) => !successfulSymbols.has(symbol)
      );

      return Response.json({
        stocksData,
        failedToFetchSymbols,
      });
    } catch (error) {
      console.error("Error fetching scraper data:", error);
      return Response.json(
        {
          error: "Failed to fetch scraper data",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: "Stock data retrieved successfully",
      content: z.object({
        stocksData: z
          .array(
            z.record(
              z.string(),
              z.record(
                z.string(),
                z.object({
                  price: z.number().describe("Stock price"),
                  source: z.string().describe("Scraper source identifier"),
                  queryTime: z.date().describe("Time when data was queried"),
                })
              )
            )
          )
          .describe(
            "Array of stock data objects, each keyed by symbol, then by source (url_id)"
          ),
        failedToFetchSymbols: z
          .array(z.string())
          .describe("Array of symbols that failed to fetch"),
      }),
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
