/**
 * Rate limiter for Finnhub API calls
 * Enforces 1 call per 2 seconds (30/min, well under 60/min limit)
 * Implements exponential backoff on rate limit errors
 */

import {
  CALL_INTERVAL_MS,
  BACKOFF_INITIAL_SECONDS,
  BACKOFF_MAX_SECONDS,
} from "../../constants";

let lastCallTime = 0;
const backoffState = new Map<
  string,
  { backoffUntil: number; attempts: number }
>();

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
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
 * Wait for rate limit interval
 */
export async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < CALL_INTERVAL_MS) {
    const waitTime = CALL_INTERVAL_MS - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastCallTime = Date.now();
}

/**
 * Calculate exponential backoff time
 * @param attempts - Number of attempts (starts at 1)
 * @returns Backoff time in milliseconds
 */
function calculateBackoff(attempts: number): number {
  const backoffSeconds = Math.min(
    BACKOFF_INITIAL_SECONDS * Math.pow(2, attempts - 1),
    BACKOFF_MAX_SECONDS
  );
  return backoffSeconds * 1000;
}

/**
 * Record a rate limit error and return backoff time
 * @param ticker - Ticker symbol that hit rate limit
 * @returns Backoff time in milliseconds
 */
export function recordRateLimitError(ticker: string): number {
  const state = backoffState.get(ticker) || { backoffUntil: 0, attempts: 0 };
  state.attempts += 1;
  const backoffMs = calculateBackoff(state.attempts);
  state.backoffUntil = Date.now() + backoffMs;

  backoffState.set(ticker, state);

  console.log(
    `Rate limit error for ${ticker}, backing off for ${backoffMs / 1000}s (attempt ${state.attempts})`
  );

  return backoffMs;
}

/**
 * Check if ticker is in backoff period
 * @param ticker - Ticker symbol
 * @returns true if still in backoff, false otherwise
 */
export function isInBackoff(ticker: string): boolean {
  const state = backoffState.get(ticker);
  if (!state) {
    return false;
  }

  if (Date.now() < state.backoffUntil) {
    return true;
  }

  // Backoff period expired, clear state
  backoffState.delete(ticker);
  return false;
}

/**
 * Get remaining backoff time for a ticker
 * @param ticker - Ticker symbol
 * @returns Remaining backoff time in milliseconds, or 0 if not in backoff
 */
export function getRemainingBackoff(ticker: string): number {
  const state = backoffState.get(ticker);
  if (!state) {
    return 0;
  }

  const remaining = state.backoffUntil - Date.now();
  return Math.max(0, remaining);
}

/**
 * Clear backoff state for a ticker (on successful call)
 * @param ticker - Ticker symbol
 */
export function clearBackoff(ticker: string): void {
  backoffState.delete(ticker);
}

/**
 * Wait for backoff period if ticker is in backoff
 * @param ticker - Ticker symbol
 */
export async function waitForBackoff(ticker: string): Promise<void> {
  if (isInBackoff(ticker)) {
    const remaining = getRemainingBackoff(ticker);
    if (remaining > 0) {
      console.log(
        `Waiting ${remaining / 1000}s for backoff period to expire for ${ticker}`
      );
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
