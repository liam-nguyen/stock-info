import {
  getNextRefreshTicker,
  removeFromRefreshQueue,
  isCacheStale,
  setCachedStock,
} from "../db/redis";
import { fetchStockData } from "../utils/stock-data-fetcher";
import {
  waitForRateLimit,
  isRateLimitError,
  recordRateLimitError,
  waitForBackoff,
  clearBackoff,
} from "../utils/rate-limiter";

const WORKER_INTERVAL_MS = parseInt(
  process.env.REFRESH_WORKER_INTERVAL_MS || "2000",
  10
);

let isRunning = false;
let workerInterval: NodeJS.Timeout | null = null;

/**
 * Process one ticker from the refresh queue
 */
async function processRefreshQueue(): Promise<void> {
  try {
    // Get next ticker to refresh (oldest first)
    const ticker = await getNextRefreshTicker();

    if (!ticker) {
      // Queue is empty, nothing to do
      return;
    }

    // Check if ticker is still stale (might have been refreshed by another request)
    const stale = await isCacheStale(ticker);
    if (!stale) {
      // Cache is fresh, remove from queue
      await removeFromRefreshQueue(ticker);
      return;
    }

    // Wait for backoff period if ticker is in backoff
    await waitForBackoff(ticker);

    // Wait for rate limit interval (1 call per 2 seconds)
    await waitForRateLimit();

    console.log(`Refreshing cache for ${ticker}`);

    try {
      // Fetch fresh data
      const result = await fetchStockData(ticker);

      if (result) {
        // Cache the fresh data
        await setCachedStock(ticker, result.data, result.source);
        clearBackoff(ticker); // Clear backoff on success
        console.log(
          `Successfully refreshed cache for ${ticker} from ${result.source}`
        );
      } else {
        console.warn(`Failed to fetch data for ${ticker}, will retry later`);
        // Keep in queue for retry
      }
    } catch (error) {
      // Handle rate limit errors
      if (isRateLimitError(error)) {
        const backoffMs = recordRateLimitError(ticker);
        console.log(
          `Rate limit error for ${ticker}, will retry after ${backoffMs / 1000}s`
        );
        // Keep in queue, will be retried after backoff
      } else {
        // Other errors - log and remove from queue to avoid infinite retries
        console.error(`Error refreshing ${ticker}:`, error);
        await removeFromRefreshQueue(ticker);
      }
    }
  } catch (error) {
    console.error("Error in refresh worker:", error);
  }
}

/**
 * Start the background refresh worker
 */
export function startRefreshWorker(): void {
  if (isRunning) {
    console.warn("Refresh worker is already running");
    return;
  }

  isRunning = true;
  console.log(
    `Starting cache refresh worker (interval: ${WORKER_INTERVAL_MS}ms)`
  );

  // Process queue immediately, then on interval
  processRefreshQueue();

  workerInterval = setInterval(() => {
    processRefreshQueue().catch((error) => {
      console.error("Error in refresh worker interval:", error);
    });
  }, WORKER_INTERVAL_MS);
}

/**
 * Stop the background refresh worker
 */
export function stopRefreshWorker(): void {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }

  console.log("Cache refresh worker stopped");
}
