/**
 * Background refresh worker for scraper tickers
 * Reads scrappedTickers.json and processes all configured scrapers
 */

import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db/mongodb";
import { getScraperClass } from "@/lib/utils/scraper-registry";
import { ScraperResult } from "@/lib/utils/scraper";
import { getSourceModel } from "@/lib/db/cache-helpers";

export interface ScraperRefreshResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ symbol: string; error: string; stack?: string }>;
}

/**
 * Refresh scraper tickers from scrappedTickers.json
 * Reads the JSON file, instantiates scrapers, and caches results
 * @returns ScraperRefreshResult with statistics
 */
export async function refreshScraperTickers(): Promise<ScraperRefreshResult> {
  await dbConnect();

  const result: ScraperRefreshResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Read scrappedTickers.json from lib/data
    const jsonPath = path.join(
      process.cwd(),
      "lib",
      "data",
      "scrappedTickers.json"
    );
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const scraperConfig: Record<string, string[]> = JSON.parse(jsonContent);

    if (!scraperConfig || Object.keys(scraperConfig).length === 0) {
      console.log("No scrapers configured in scrappedTickers.json");
      return result;
    }

    // Process each scraper in the JSON
    for (const [scraperName, tickers] of Object.entries(scraperConfig)) {
      if (!tickers || tickers.length === 0) {
        console.log(`No tickers configured for scraper ${scraperName}`);
        continue;
      }

      try {
        // Get scraper class from registry
        const ScraperClass = getScraperClass(scraperName);
        if (!ScraperClass) {
          const errorMessage = `Scraper class not found for: ${scraperName}`;
          console.error(errorMessage);
          // Log error for all tickers in this scraper
          for (const ticker of tickers) {
            result.processed++;
            result.failed++;
            result.errors.push({
              symbol: ticker,
              error: errorMessage,
            });
          }
          continue;
        }

        // Instantiate scraper
        const scraper = new ScraperClass();

        console.log(
          `Processing ${tickers.length} tickers for scraper ${scraperName}: ${tickers.join(", ")}`
        );

        // Execute scraper
        const scraperResults = await scraper.execute(tickers);

        if (scraperResults.length === 0) {
          console.warn(
            `No results returned from scraper ${scraperName} for tickers: ${tickers.join(", ")}`
          );
          // Mark all as failed
          for (const ticker of tickers) {
            result.processed++;
            result.failed++;
            result.errors.push({
              symbol: ticker,
              error: `No results returned from scraper ${scraperName}`,
            });
          }
          continue;
        }

        // Write to cache using compound key (symbol + source)
        try {
          const Model = getSourceModel("scraper");
          const writePromises = scraperResults.map(
            (scraperResult: ScraperResult) => {
              const updateData = {
                symbol: scraperResult.symbol,
                price: scraperResult.price,
                source: scraperResult.source,
                queryTime: scraperResult.queryTime,
              };
              // Use compound key (symbol + source) for upsert
              return Model.findOneAndUpdate(
                { symbol: scraperResult.symbol, source: scraperResult.source },
                updateData,
                {
                  upsert: true,
                  new: true,
                }
              );
            }
          );
          await Promise.all(writePromises);

          // Count successes
          for (const scraperResult of scraperResults) {
            result.processed++;
            result.succeeded++;
            console.log(
              `Successfully scraped and cached ${scraperResult.symbol} from ${scraperResult.source}`
            );
          }
        } catch (writeError) {
          const errorMessage =
            writeError instanceof Error
              ? writeError.message
              : String(writeError);
          const errorStack =
            writeError instanceof Error ? writeError.stack : undefined;
          console.error(
            `Error writing scraper data to cache for ${scraperName}:`,
            errorMessage,
            errorStack
          );

          // Log error for each symbol that was supposed to be written
          for (const scraperResult of scraperResults) {
            result.failed++;
            result.errors.push({
              symbol: scraperResult.symbol,
              error: `Failed to write to cache: ${errorMessage}`,
              stack: errorStack,
            });
          }
        }

        // Check for failed tickers (tickers that were requested but not returned)
        const successfulSymbols = new Set(
          scraperResults.map((r: ScraperResult) => r.symbol.toUpperCase())
        );
        for (const ticker of tickers) {
          if (!successfulSymbols.has(ticker.toUpperCase())) {
            result.processed++;
            result.failed++;
            result.errors.push({
              symbol: ticker,
              error: `Failed to scrape ${ticker} from ${scraperName}`,
            });
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error(
          `Error processing scraper ${scraperName}:`,
          errorMessage,
          errorStack
        );

        // Log error for all tickers in this scraper
        for (const ticker of tickers) {
          result.processed++;
          result.failed++;
          result.errors.push({
            symbol: ticker,
            error: `Scraper ${scraperName} failed: ${errorMessage}`,
            stack: errorStack,
          });
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error in refreshScraperTickers:", errorMessage, errorStack);
    result.errors.push({
      symbol: "worker",
      error: `Worker error: ${errorMessage}`,
      stack: errorStack,
    });
  }

  console.log(
    `Scraper refresh completed: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.processed} processed`
  );
  return result;
}
