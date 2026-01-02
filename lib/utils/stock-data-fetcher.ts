import fs from "fs";
import path from "path";
import { getScraperClass } from "../scrapping/scraper-registry";
import { Finnhub } from "./finnhub";

/**
 * Ticker configuration interface
 */
interface TickerConfig {
  source: string;
  url: string;
  dataType?: string;
}

/**
 * Load ticker sources configuration
 * Format: { "TICKER": { "source": "fidelity", "url": "..." }, ... }
 */
function loadTickerSources(): Record<string, TickerConfig> {
  try {
    // Try multiple paths to handle both development and production (Docker) environments
    const possiblePaths = [
      path.join(
        process.cwd(),
        "lib",
        "scrapping",
        "data",
        "scrappedTickers.json"
      ),
      path.join(__dirname, "..", "scrapping", "data", "scrappedTickers.json"),
      path.join(
        process.cwd(),
        "lib",
        "scrapping",
        "data",
        "scrappedTickers.json"
      ),
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(configData) as Record<string, TickerConfig>;
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
 * Get source that should be used for a ticker (single source only)
 * @param ticker - Stock ticker symbol
 * @returns Source name (e.g., "finnhub" or "fidelity")
 *          Returns "finnhub" as default if ticker not in config
 */
function getSourceForTicker(ticker: string): string {
  const config = loadTickerSources();
  const tickerConfig = config[ticker.toUpperCase()];

  // If ticker is configured, use the source from config
  if (tickerConfig && tickerConfig.source) {
    return tickerConfig.source;
  }

  // Default: use finnhub
  return "finnhub";
}

/**
 * Get URL for a ticker if configured
 * @param ticker - Stock ticker symbol
 * @returns URL string or null if not configured
 */
function getUrlForTicker(ticker: string): string | null {
  const config = loadTickerSources();
  const tickerConfig = config[ticker.toUpperCase()];

  if (tickerConfig && tickerConfig.url) {
    return tickerConfig.url;
  }

  return null;
}

/**
 * Get dataType for a ticker
 * @param ticker - Stock ticker symbol
 * @returns "scrapped" if ticker is in config, otherwise "finnhub"
 */
function getDataTypeForTicker(ticker: string): string {
  const config = loadTickerSources();
  const tickerConfig = config[ticker.toUpperCase()];

  if (tickerConfig && tickerConfig.dataType) {
    return tickerConfig.dataType;
  }

  // Default: finnhub
  return "finnhub";
}

/**
 * Fetch stock data from Finnhub
 * @param ticker - Stock ticker symbol
 * @returns Data object with finnhub key
 */
async function fetchFromFinnhub(
  ticker: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    const error = new Error("FINNHUB_API_KEY environment variable is required");
    console.error(`[Finnhub] ${error.message}`);
    throw error;
  }

  console.log(`[Finnhub] Fetching stock data for ${ticker}...`);
  const finnhub = new Finnhub(apiKey);

  try {
    const quoteData = await finnhub.getQuote(ticker);
    console.log(`[Finnhub] Successfully fetched data for ${ticker}:`, {
      currentPrice: quoteData.currentPrice,
      change: quoteData.change,
      percentChange: quoteData.percentChange,
    });
    return {
      finnhub: quoteData,
    };
  } catch (error) {
    console.error(`[Finnhub] Error fetching quote for ${ticker}:`, error);
    if (error instanceof Error) {
      console.error(`[Finnhub] Error message: ${error.message}`);
      console.error(`[Finnhub] Error stack:`, error.stack);
    }
    throw error;
  }
}

/**
 * Fetch stock data from scraper
 * @param ticker - Stock ticker symbol
 * @param scraperName - Name of the scraper (e.g., "Fidelity")
 * @param url - Optional URL to use for scraping (from config)
 * @returns Data object with scraper source key
 */
async function fetchFromScraper(
  ticker: string,
  scraperName: string,
  url?: string | null
): Promise<Record<string, unknown> | null> {
  console.log(`[Scraper] Fetching ${ticker} from ${scraperName}...`);
  if (url) {
    console.log(`[Scraper] Using configured URL: ${url}`);
  }
  const ScraperClass = getScraperClass(scraperName);
  if (!ScraperClass) {
    console.error(`[Scraper] Scraper "${scraperName}" not found in registry`);
    return null;
  }

  try {
    const scraper = new ScraperClass();
    // Create URL map if URL is provided
    const urlMap = url ? new Map([[ticker.toUpperCase(), url]]) : undefined;
    const results = await scraper.execute([ticker], urlMap);

    if (results.length === 0) {
      console.warn(
        `[Scraper] ${scraperName} returned no results for ${ticker}`
      );
      return null;
    }

    const result = results[0];
    console.log(
      `[Scraper] Successfully fetched ${ticker} from ${scraperName}:`,
      {
        price: result.price,
        source: result.source,
      }
    );

    // Normalize the result using the scraper's normalizeResult method
    const normalizedData = scraper.normalizeResult(result);
    console.log(`[Scraper] Normalized data for ${ticker}:`, normalizedData);

    return {
      [result.source]: normalizedData,
    };
  } catch (error) {
    console.error(
      `[Scraper] Error fetching ${ticker} from ${scraperName}:`,
      error
    );
    if (error instanceof Error) {
      console.error(`[Scraper] Error message: ${error.message}`);
      console.error(`[Scraper] Error stack:`, error.stack);
    }
    throw error;
  }
}

/**
 * Fetch stock data for a ticker from a single source
 * Checks scrappedTickers.json - if ticker is configured, use that scraper
 * Otherwise, use Finnhub
 * @param ticker - Stock ticker symbol
 * @returns Object with data and source name, or null if fetch failed
 */
export async function fetchStockData(
  ticker: string
): Promise<{
  data: Record<string, unknown>;
  source: string;
  dataType: string;
} | null> {
  // Get single source for this ticker
  const source = getSourceForTicker(ticker);
  const dataType = getDataTypeForTicker(ticker);
  console.log(
    `[fetchStockData] Using source "${source}" and dataType "${dataType}" for ticker ${ticker}`
  );

  try {
    let data: Record<string, unknown> | null = null;

    if (source === "finnhub") {
      console.log(`[fetchStockData] Fetching ${ticker} from Finnhub...`);
      const finnhubData = await fetchFromFinnhub(ticker);
      // Extract the actual data from finnhub key
      data = finnhubData.finnhub as Record<string, unknown>;
      if (!data) {
        console.error(
          `[fetchStockData] Finnhub data is null or missing 'finnhub' key for ${ticker}`
        );
        console.error(
          `[fetchStockData] Finnhub response structure:`,
          Object.keys(finnhubData)
        );
      }
    } else {
      // It's a scraper
      console.log(
        `[fetchStockData] Fetching ${ticker} from scraper ${source}...`
      );
      const url = getUrlForTicker(ticker);
      const scraperData = await fetchFromScraper(ticker, source, url);
      if (scraperData) {
        // Extract the actual data from scraper key
        data = scraperData[source] as Record<string, unknown>;
        if (!data) {
          console.error(
            `[fetchStockData] Scraper data is null or missing '${source}' key for ${ticker}`
          );
          console.error(
            `[fetchStockData] Scraper response structure:`,
            Object.keys(scraperData)
          );
        }
      } else {
        console.error(
          `[fetchStockData] Scraper ${source} returned null for ${ticker}`
        );
      }
    }

    if (!data) {
      console.error(
        `[fetchStockData] Failed to fetch data for ${ticker} from ${source} - data is null`
      );
      return null;
    }

    console.log(
      `[fetchStockData] Successfully fetched ${ticker} from ${source} with ${Object.keys(data).length} fields`
    );
    return { data, source, dataType };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      `[fetchStockData] Exception fetching ${ticker} from ${source}:`,
      errorMsg
    );
    if (errorStack) {
      console.error(`[fetchStockData] Error stack:`, errorStack);
    }
    // Log full error object for additional context
    console.error(`[fetchStockData] Full error object:`, error);
    return null;
  }
}
