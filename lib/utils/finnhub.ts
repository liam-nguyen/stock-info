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

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(
          `Finnhub API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as FinnhubQuoteResponse;

      // Check if we got an error response
      if (data.c === 0 && data.d === 0 && data.dp === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      return this.transformQuote(data);
    } catch (error) {
      if (error instanceof Error) {
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
