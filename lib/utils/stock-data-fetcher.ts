import { Finnhub } from "./finnhub";
import { AlphaVantage } from "./alpha-vantage";
import { getSourceForTicker } from "./ticker-source-map";
import { NormalizedStockData } from "./normalized-stock-data";

/**
 * Fetch stock data from Finnhub
 * @param ticker - Stock ticker symbol
 * @returns Normalized stock data
 */
async function fetchFromFinnhub(ticker: string): Promise<NormalizedStockData> {
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
    console.log(
      `[Finnhub] Successfully fetched normalized data for ${ticker}:`,
      {
        price: quoteData.price,
        change: quoteData.change,
        percentChange: quoteData.percentChange,
        source: quoteData.apiMetadata.source,
      }
    );
    return quoteData;
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
 * Fetch stock data from Alpha Vantage
 * @param ticker - Stock ticker symbol
 * @returns Normalized stock data
 */
async function fetchFromAlphaVantage(
  ticker: string
): Promise<NormalizedStockData> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    const error = new Error(
      "ALPHA_VANTAGE_API_KEY environment variable is required"
    );
    console.error(`[AlphaVantage] ${error.message}`);
    throw error;
  }

  console.log(`[AlphaVantage] Fetching stock data for ${ticker}...`);
  const alphaVantage = new AlphaVantage(apiKey);

  try {
    const quoteData = await alphaVantage.getQuote(ticker);
    console.log(
      `[AlphaVantage] Successfully fetched normalized data for ${ticker}:`,
      {
        price: quoteData.price,
        change: quoteData.change,
        percentChange: quoteData.percentChange,
        source: quoteData.apiMetadata.source,
      }
    );
    return quoteData;
  } catch (error) {
    console.error(`[AlphaVantage] Error fetching quote for ${ticker}:`, error);
    if (error instanceof Error) {
      console.error(`[AlphaVantage] Error message: ${error.message}`);
      console.error(`[AlphaVantage] Error stack:`, error.stack);
    }
    throw error;
  }
}

/**
 * Fetch stock data for a ticker from the appropriate source
 * @param ticker - Stock ticker symbol
 * @returns Object with data and source name, or null if fetch failed
 */
export async function fetchStockData(ticker: string): Promise<{
  data: NormalizedStockData;
  source: string;
} | null> {
  // Get source for this ticker from mapping
  const source = getSourceForTicker(ticker);
  console.log(`[fetchStockData] Using source "${source}" for ticker ${ticker}`);

  try {
    let data: NormalizedStockData | null = null;

    if (source === "finnhub") {
      console.log(`[fetchStockData] Fetching ${ticker} from Finnhub...`);
      data = await fetchFromFinnhub(ticker);
    } else if (source === "alpha-vantage") {
      console.log(`[fetchStockData] Fetching ${ticker} from Alpha Vantage...`);
      data = await fetchFromAlphaVantage(ticker);
    } else {
      console.error(
        `[fetchStockData] Unknown source "${source}" for ticker ${ticker}`
      );
      return null;
    }

    if (!data) {
      console.error(
        `[fetchStockData] Failed to fetch data for ${ticker} from ${source} - data is null`
      );
      return null;
    }

    console.log(
      `[fetchStockData] Successfully fetched normalized data for ${ticker} from ${source}`
    );
    return { data, source };
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
