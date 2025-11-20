import { BaseScraper, ScraperResult } from "./scraper";

/**
 * Helper function to run all registered scrapers for given symbols
 * @param symbols - Array of stock symbols to scrape
 * @param scrapers - Array of scraper instances to run
 * @returns Map of symbol to scraper results, organized by source
 */
export async function runScrapers(
  symbols: string[],
  scrapers: BaseScraper[]
): Promise<Record<string, Record<string, ScraperResult>>> {
  if (!symbols || symbols.length === 0) {
    return {};
  }

  if (!scrapers || scrapers.length === 0) {
    return {};
  }

  // Run all scrapers in parallel
  const scraperResults = await Promise.allSettled(
    scrapers.map((scraper) => scraper.execute(symbols))
  );

  // Aggregate results by symbol and source
  const results: Record<string, Record<string, ScraperResult>> = {};

  for (let i = 0; i < scrapers.length; i++) {
    const scraper = scrapers[i];
    const result = scraperResults[i];

    if (result.status === "fulfilled") {
      const scraperData = result.value;
      for (const data of scraperData) {
        if (!results[data.symbol]) {
          results[data.symbol] = {};
        }
        results[data.symbol][data.source] = data;
      }
    } else {
      console.error(`Scraper ${scraper.source} failed:`, result.reason);
    }
  }

  return results;
}

/**
 * Format scraper results for API response
 * Converts from { symbol: { source: ScraperResult } } to { symbol: { price, source, queryTime } }
 * @param results - Results from runScrapers
 * @returns Formatted results for API response
 */
export function formatScraperResults(
  results: Record<string, Record<string, ScraperResult>>
): Record<string, { price: number; source: string; queryTime: Date }> {
  const formatted: Record<
    string,
    { price: number; source: string; queryTime: Date }
  > = {};

  for (const [symbol, sources] of Object.entries(results)) {
    // For now, we'll take the first available source's data
    // In the future, this could be extended to merge multiple sources
    const firstSource = Object.values(sources)[0];
    if (firstSource) {
      formatted[symbol] = {
        price: firstSource.price,
        source: firstSource.source,
        queryTime: firstSource.queryTime,
      };
    }
  }

  return formatted;
}
