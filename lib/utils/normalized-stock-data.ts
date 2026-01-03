/**
 * Normalized stock data structure
 * Common fields at top level, source-specific fields in apiMetadata
 */

export interface NormalizedStockData {
  price: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  apiMetadata: {
    source: string;
    timestamp?: number; // Finnhub only
    volume?: string; // Alpha Vantage only
    latestTradingDay?: string; // Alpha Vantage only
    symbol?: string; // Alpha Vantage only
  };
}
