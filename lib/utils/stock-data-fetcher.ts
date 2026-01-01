import fs from "fs";
import path from "path";
import { getScraperClass } from "./scraper-registry";
import { Finnhub } from "./finnhub";

/**
 * Load ticker sources configuration
 * Format: { "TICKER": ["source1", "source2"], ... }
 */
function loadTickerSources(): Record<string, string[]> {
  try {
    // Try multiple paths to handle both development and production (Docker) environments
    const possiblePaths = [
      path.join(process.cwd(), "lib", "data", "scrappedTickers.json"),
      path.join(__dirname, "..", "data", "scrappedTickers.json"),
      path.join(process.cwd(), "lib", "data", "scrappedTickers.json"),
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(configData) as Record<string, string[]>;
      }
    }

    console.warn("scrappedTickers.json not found, using empty config");
    return {};
  } catch (error) {
    console.error("Error loading scrappedTickers.json:", error);
    return {};
  }
}

/**
 * Get sources that should be used for a ticker
 * @param ticker - Stock ticker symbol
 * @returns Array of source names (e.g., ["finnhub", "fidelity"])
 *          Returns ["finnhub"] as default if ticker not in config
 */
function getSourcesForTicker(ticker: string): string[] {
  const config = loadTickerSources();
  const sources = config[ticker.toUpperCase()];

  // If ticker is configured, use those sources
  if (sources && sources.length > 0) {
    return sources;
  }

  // Default: use finnhub only
  return ["finnhub"];
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("Too Many Requests") ||
      error.message.includes("429") ||
      error.message.includes("rate limit") ||
      error.message.includes("Rate limit") ||
      error.message.includes("Rate limit exceeded")
    );
  }
  return false;
}

/**
 * Fetch stock data from Finnhub with retry logic
 * @param ticker - Stock ticker symbol
 * @param retries - Number of retries remaining (default: 3)
 * @returns Data object with finnhub key
 */
async function fetchFromFinnhub(
  ticker: string,
  retries: number = 3
): Promise<Record<string, unknown>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY environment variable is required");
  }

  const finnhub = new Finnhub(apiKey);

  try {
    // Add a small delay before making the request to avoid hitting rate limits
    if (retries < 3) {
      await sleep(1000); // 1 second delay on retries
    }

    console.log(`Fetching stock data from Finnhub for ${ticker}`);
    const quoteData = await finnhub.getQuote(ticker);

    return {
      finnhub: quoteData,
    };
  } catch (error) {
    // Handle rate limit errors with retry and exponential backoff
    if (isRateLimitError(error) && retries > 0) {
      const waitTime = Math.pow(2, 4 - retries) * 2000; // Exponential backoff: 4s, 8s, 16s
      console.log(
        `Rate limit hit for ${ticker}, retrying in ${waitTime}ms (${retries} retries left)`
      );
      await sleep(waitTime);
      return fetchFromFinnhub(ticker, retries - 1);
    }
    // Re-throw if not rate limit or out of retries
    throw error;
  }
}

/**
 * Fetch stock data from scraper
 * @param ticker - Stock ticker symbol
 * @param scraperName - Name of the scraper (e.g., "Fidelity")
 * @returns Data object with scraper source key
 */
async function fetchFromScraper(
  ticker: string,
  scraperName: string
): Promise<Record<string, unknown> | null> {
  const ScraperClass = getScraperClass(scraperName);
  if (!ScraperClass) {
    console.error(`Scraper "${scraperName}" not found in registry`);
    return null;
  }

  const scraper = new ScraperClass();
  const results = await scraper.execute([ticker]);

  if (results.length === 0) {
    return null;
  }

  const result = results[0];
  // Use the scraper's source property as the key (e.g., "fidelity")
  return {
    [result.source]: {
      price: result.price,
      source: result.source,
      queryTime: result.queryTime,
    },
  };
}

/**
 * Fetch stock data for a ticker from configured sources
 * Only tries sources specified in scrappedTickers.json for that ticker
 * Defaults to finnhub if ticker is not in config
 * @param ticker - Stock ticker symbol
 * @returns Data object with source key(s) from successful sources, or null if all sources failed
 */
export async function fetchStockData(
  ticker: string
): Promise<Record<string, unknown> | null> {
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Get sources configured for this ticker (defaults to ["finnhub"])
  const sources = getSourcesForTicker(ticker);

  // Create promises for all configured sources
  const promises: Array<Promise<void>> = [];

  for (const source of sources) {
    if (source === "finnhub") {
      promises.push(
        fetchFromFinnhub(ticker)
          .then((data) => {
            Object.assign(results, data);
          })
          .catch((error) => {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            errors.push(`Finnhub: ${errorMsg}`);
            console.log(`Finnhub failed for ${ticker}:`, errorMsg);
          })
      );
    } else {
      // It's a scraper
      promises.push(
        fetchFromScraper(ticker, source)
          .then((data) => {
            if (data) {
              Object.assign(results, data);
            } else {
              errors.push(`${source}: No data returned`);
              console.log(`Scraper ${source} returned no data for ${ticker}`);
            }
          })
          .catch((error) => {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            errors.push(`${source}: ${errorMsg}`);
            console.log(`Scraper ${source} failed for ${ticker}:`, errorMsg);
          })
      );
    }
  }

  // Wait for all sources to complete
  await Promise.allSettled(promises);

  // If at least one source succeeded, return the results
  if (Object.keys(results).length > 0) {
    return results;
  }

  // All sources failed
  console.error(
    `All sources failed for ${ticker}. Errors: ${errors.join("; ")}`
  );
  return null;
}
