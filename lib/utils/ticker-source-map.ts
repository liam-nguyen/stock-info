/**
 * Ticker to source mapping
 * Maps tickers to their data source (finnhub or alpha-vantage)
 * Defaults to finnhub for unmapped tickers
 */

type Source = "finnhub" | "alpha-vantage";

/**
 * Mapping of tickers to their data sources
 * Add new mappings here as needed
 */
const TICKER_SOURCE_MAP: Record<string, Source> = {
  FXAIX: "alpha-vantage",
  VFIAX: "alpha-vantage",
};

/**
 * Get the data source for a ticker
 * @param ticker - Stock ticker symbol
 * @returns Source name ("finnhub" or "alpha-vantage")
 */
export function getSourceForTicker(ticker: string): Source {
  const upperTicker = ticker.toUpperCase();
  return TICKER_SOURCE_MAP[upperTicker] || "finnhub";
}
