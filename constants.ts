/**
 * Application-wide constants
 * Consolidates all configuration constants from various modules
 */

// Rate Limiting Constants
export const CALL_INTERVAL_MS = parseInt(
  process.env.REFRESH_WORKER_INTERVAL_MS || "2000",
  10
);
export const BACKOFF_INITIAL_SECONDS = parseInt(
  process.env.BACKOFF_INITIAL_SECONDS || "2",
  10
);
export const BACKOFF_MAX_SECONDS = parseInt(
  process.env.BACKOFF_MAX_SECONDS || "60",
  10
);

// Cache TTL Constants (in seconds)
export const FINNHUB_CACHE_TTL_SECONDS = 300; // 5 minutes for Finnhub tickers
// Alpha Vantage: 20 requests/day / 2 tickers = 10 requests per ticker per day
// During market hours (6.5 hours = 23400 seconds): 23400 / 10 = 2340 seconds (~39 minutes)
export const ALPHA_VANTAGE_CACHE_TTL_SECONDS = 2340; // ~39 minutes for Alpha Vantage tickers
export const CACHE_TTL_SECONDS = FINNHUB_CACHE_TTL_SECONDS; // Default (backward compatibility)

// Cache Stale Threshold Constants (in seconds)
export const FINNHUB_STALE_THRESHOLD_SECONDS = 300; // 5 minutes for Finnhub tickers
export const ALPHA_VANTAGE_STALE_THRESHOLD_SECONDS = 2340; // ~39 minutes for Alpha Vantage tickers
export const CACHE_STALE_THRESHOLD_SECONDS = parseInt(
  process.env.CACHE_STALE_THRESHOLD_SECONDS || "300",
  10
); // Default (backward compatibility)

// Redis Keys
export const REFRESH_QUEUE_KEY = "stock-api:refresh-queue";

// Worker Interval
export const WORKER_INTERVAL_MS = parseInt(
  process.env.REFRESH_WORKER_INTERVAL_MS || "2000",
  10
);
