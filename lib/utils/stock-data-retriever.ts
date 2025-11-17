/**
 * Stock data retriever - only reads from DB, no fetching
 * Worker handles data refresh separately
 */

import dbConnect from "@/lib/db/mongodb";
import {
  discoverCachedCollections,
  getSourceModel,
} from "@/lib/db/cache-helpers";

export interface GetCachedStockDataOptions {
  priceOnly?: boolean;
}

/**
 * Get cached stock data from database
 * Only reads from DB - returns cached data even if expired
 * Worker handles refreshing expired data
 * @param symbols - Array of stock symbols to retrieve
 * @param options - Options for data retrieval
 * @returns Record of symbol -> source -> data
 */
export async function getCachedStockData(
  symbols: string[],
  options: GetCachedStockDataOptions = {}
): Promise<Record<string, Record<string, unknown>>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  await dbConnect();

  // Discover all cached collections
  const discoveredSources = await discoverCachedCollections();

  // Always include known sources, even if collection doesn't exist yet
  const knownSources = ["yf"]; // Add other sources here as they're added
  const sources = Array.from(new Set([...knownSources, ...discoveredSources]));

  const results: Record<string, Record<string, unknown>> = {};

  // Process each source
  for (const source of sources) {
    try {
      const Model = getSourceModel(source);

      // Query cached data for all requested symbols
      const cachedDataArray = await Promise.all(
        symbols.map((symbol) => Model.findOne({ symbol }))
      );

      // Build results for this source
      const sourceResults: Record<string, unknown> = {};

      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const cachedData = cachedDataArray[i];

        if (cachedData) {
          if (options.priceOnly) {
            // Only return quoteSummary for price endpoint
            sourceResults[symbol] = {
              quoteSummary: cachedData.quoteSummary,
            };
          } else {
            // Return all data
            sourceResults[symbol] = {
              quoteSummary: cachedData.quoteSummary,
              insights: cachedData.insights,
              chart: cachedData.chart,
              fundamentalsTimeSeries: cachedData.fundamentalsTimeSeries,
            };
          }
        }
      }

      // Add source results to main results, organized by symbol
      if (Object.keys(sourceResults).length > 0) {
        for (const [symbol, data] of Object.entries(sourceResults)) {
          if (!results[symbol]) {
            results[symbol] = {};
          }
          results[symbol][source] = data;
        }
      }
    } catch (error) {
      console.error(`Error getting cached data from source ${source}:`, error);
      // Continue processing other sources even if one fails
    }
  }

  return results;
}
