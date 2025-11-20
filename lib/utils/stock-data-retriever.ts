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
  const knownSources = ["yf", "scraper"]; // Add other sources here as they're added
  const sources = Array.from(new Set([...knownSources, ...discoveredSources]));

  const results: Record<string, Record<string, unknown>> = {};

  // Process each source
  for (const source of sources) {
    try {
      const Model = getSourceModel(source);

      // Build results for this source
      const sourceResults: Record<string, unknown> = {};

      if (source === "scraper") {
        // For scraper, we need to get all sources for each symbol
        // Query all scraper documents for the requested symbols
        const allScraperData = await Model.find({
          symbol: { $in: symbols },
        }).lean();

        // Group by symbol
        const scraperDataBySymbol: Record<
          string,
          Array<{ price: number; source: string; queryTime: Date }>
        > = {};

        for (const data of allScraperData) {
          const symbol = data.symbol as string;
          if (!scraperDataBySymbol[symbol]) {
            scraperDataBySymbol[symbol] = [];
          }
          scraperDataBySymbol[symbol].push({
            price: data.price as number,
            source: data.source as string,
            queryTime: data.queryTime as Date,
          });
        }

        // Convert to the expected format: symbol => source => data
        for (const symbol of symbols) {
          const sources = scraperDataBySymbol[symbol];
          if (sources && sources.length > 0) {
            const symbolSources: Record<
              string,
              { price: number; source: string; queryTime: Date }
            > = {};
            for (const sourceData of sources) {
              symbolSources[sourceData.source] = sourceData;
            }
            sourceResults[symbol] = symbolSources;
          }
        }
      } else {
        // YF data structure - query cached data for all requested symbols
        const cachedDataArray = await Promise.all(
          symbols.map((symbol) => Model.findOne({ symbol }))
        );

        for (let i = 0; i < symbols.length; i++) {
          const symbol = symbols[i];
          const cachedData = cachedDataArray[i];

          if (cachedData) {
            // YF data structure
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
      }

      // Add source results to main results, organized by symbol
      if (Object.keys(sourceResults).length > 0) {
        for (const [symbol, data] of Object.entries(sourceResults)) {
          if (!results[symbol]) {
            results[symbol] = {};
          }
          if (source === "scraper") {
            // For scraper, merge sources directly (data is already { site1: {...}, site2: {...} })
            Object.assign(results[symbol], data);
          } else {
            // For other sources, nest under source key
            results[symbol][source] = data;
          }
        }
      }
    } catch (error) {
      console.error(`Error getting cached data from source ${source}:`, error);
      // Continue processing other sources even if one fails
    }
  }

  return results;
}
