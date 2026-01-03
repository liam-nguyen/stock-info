/**
 * Alpha Vantage API client
 * Fetches stock quotes using the GLOBAL_QUOTE endpoint
 */
import { NormalizedStockData } from "./normalized-stock-data";

interface AlphaVantageQuoteResponse {
  "Global Quote": {
    "01. symbol": string;
    "02. open": string;
    "03. high": string;
    "04. low": string;
    "05. price": string;
    "06. volume": string;
    "07. latest trading day": string;
    "08. previous close": string;
    "09. change": string;
    "10. change percent": string;
  };
}

export class AlphaVantage {
  private apiKey: string;
  private baseUrl = "https://www.alphavantage.co/query";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get quote for a symbol
   * @param symbol - Stock symbol
   * @returns Normalized stock data
   */
  async getQuote(symbol: string): Promise<NormalizedStockData> {
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
    console.log(
      `[AlphaVantage.getQuote] Fetching quote for ${symbol} from URL: ${url.replace(/apikey=[^&]+/, "apikey=****")}`
    );

    try {
      const response = await fetch(url);
      console.log(
        `[AlphaVantage.getQuote] Response status for ${symbol}: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[AlphaVantage.getQuote] API error response for ${symbol}: ${errorText}`
        );
        throw new Error(
          `Alpha Vantage API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as
        | AlphaVantageQuoteResponse
        | { "Error Message"?: string; Note?: string; Information?: string };
      console.log(
        `[AlphaVantage.getQuote] Raw response data for ${symbol}:`,
        data
      );

      // Check for API errors in response
      if ("Error Message" in data) {
        console.error(
          `[AlphaVantage.getQuote] API returned error message for ${symbol}:`,
          data["Error Message"]
        );
        throw new Error(`Alpha Vantage API error: ${data["Error Message"]}`);
      }

      if ("Note" in data) {
        console.error(
          `[AlphaVantage.getQuote] API returned note (rate limit?) for ${symbol}:`,
          data.Note
        );
        throw new Error(`Alpha Vantage API rate limit: ${data.Note}`);
      }

      if ("Information" in data) {
        console.error(
          `[AlphaVantage.getQuote] API returned information message for ${symbol}:`,
          data.Information
        );
        throw new Error(`Alpha Vantage API: ${data.Information}`);
      }

      if (!("Global Quote" in data)) {
        console.error(
          `[AlphaVantage.getQuote] Unexpected response format for ${symbol}:`,
          data
        );
        throw new Error(`No quote data found for symbol: ${symbol}`);
      }

      const quote = data["Global Quote"];

      // Check if quote data is empty
      if (!quote["05. price"] || quote["05. price"] === "0.0000") {
        console.warn(
          `[AlphaVantage.getQuote] Alpha Vantage returned no data (price is 0 or empty) for symbol: ${symbol}`
        );
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      return this.transformQuote(quote);
    } catch (error) {
      console.error(
        `[AlphaVantage.getQuote] Exception fetching quote for ${symbol}:`,
        error
      );
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch quote for ${symbol}: ${String(error)}`);
    }
  }

  /**
   * Transform Alpha Vantage response to normalized structure
   */
  private transformQuote(
    quote: AlphaVantageQuoteResponse["Global Quote"]
  ): NormalizedStockData {
    const price = parseFloat(quote["05. price"]);
    const change = parseFloat(quote["09. change"]);
    const percentChangeStr = quote["10. change percent"].replace("%", "");
    const percentChange = parseFloat(percentChangeStr);

    return {
      price,
      change,
      percentChange,
      highPrice: parseFloat(quote["03. high"]),
      lowPrice: parseFloat(quote["04. low"]),
      openPrice: parseFloat(quote["02. open"]),
      previousClose: parseFloat(quote["08. previous close"]),
      apiMetadata: {
        source: "alpha-vantage",
        volume: quote["06. volume"],
        latestTradingDay: quote["07. latest trading day"],
        symbol: quote["01. symbol"],
      },
    };
  }
}
