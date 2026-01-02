/**
 * Finnhub API client for fetching stock quote data
 */
export interface FinnhubQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t?: number; // Timestamp (optional)
}

export interface TransformedQuote {
  currentPrice: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp?: number;
}

export class Finnhub {
  private apiKey: string;
  private baseUrl = "https://finnhub.io/api/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Finnhub API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch quote data for a symbol
   * @param symbol - Stock ticker symbol
   * @returns Transformed quote data with descriptive field names
   */
  async getQuote(symbol: string): Promise<TransformedQuote> {
    const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(symbol)}&token=${this.apiKey}`;
    console.log(
      `[Finnhub.getQuote] Fetching quote for ${symbol} from: ${this.baseUrl}/quote`
    );

    try {
      const response = await fetch(url);
      console.log(
        `[Finnhub.getQuote] Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Unable to read error response");
        console.error(`[Finnhub.getQuote] API error response body:`, errorText);
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(
          `Finnhub API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as FinnhubQuoteResponse;
      console.log(`[Finnhub.getQuote] Raw response data for ${symbol}:`, {
        c: data.c,
        d: data.d,
        dp: data.dp,
        h: data.h,
        l: data.l,
        o: data.o,
        pc: data.pc,
        t: data.t,
      });

      // Check if we got an error response
      if (data.c === 0 && data.d === 0 && data.dp === 0) {
        console.error(
          `[Finnhub.getQuote] No data found for symbol: ${symbol} (all values are 0)`
        );
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      const transformed = this.transformQuote(data);
      console.log(
        `[Finnhub.getQuote] Successfully transformed quote for ${symbol}`
      );
      return transformed;
    } catch (error) {
      console.error(
        `[Finnhub.getQuote] Exception fetching quote for ${symbol}:`,
        error
      );
      if (error instanceof Error) {
        console.error(`[Finnhub.getQuote] Error message: ${error.message}`);
        console.error(`[Finnhub.getQuote] Error stack:`, error.stack);
        throw error;
      }
      throw new Error(`Failed to fetch quote for ${symbol}: ${String(error)}`);
    }
  }

  /**
   * Transform Finnhub response to use descriptive field names
   * @param data - Raw Finnhub quote response
   * @returns Transformed quote with descriptive field names
   */
  private transformQuote(data: FinnhubQuoteResponse): TransformedQuote {
    return {
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      highPrice: data.h,
      lowPrice: data.l,
      openPrice: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    };
  }
}
