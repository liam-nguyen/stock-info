import { createClient } from "redis";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_URL = process.env.REDIS_URL;

// Debug: Log which Redis configuration is being used
if (REDIS_URL) {
  console.log(
    `Redis URL configured: ${REDIS_URL.replace(/:[^:@]+@/, ":****@")}`
  );
} else {
  console.log(`Redis Host/Port configured: ${REDIS_HOST}:${REDIS_PORT}`);
}

const CACHE_TTL_SECONDS = 300; // 5 minutes
const REFRESH_QUEUE_KEY = "stock-api:refresh-queue";
const CACHE_STALE_THRESHOLD_SECONDS = parseInt(
  process.env.CACHE_STALE_THRESHOLD_SECONDS || "300",
  10
);

let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnectionStatus: "connected" | "disconnected" | "error" =
  "disconnected";

/**
 * Check if Redis connection is healthy
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient) {
      console.warn("Redis client not initialized");
      return false;
    }

    // Try to ping Redis
    const result = await redisClient.ping();
    if (result === "PONG") {
      redisConnectionStatus = "connected";
      return true;
    }
    redisConnectionStatus = "error";
    return false;
  } catch (error) {
    redisConnectionStatus = "error";
    console.error("Redis health check failed:", error);
    return false;
  }
}

/**
 * Get or create Redis client
 */
export async function getRedisClient() {
  if (redisClient && redisConnectionStatus === "connected") {
    // Verify connection is still good
    const isHealthy = await checkRedisHealth();
    if (isHealthy) {
      return redisClient;
    }
    // Connection lost, reset client
    redisClient = null;
    redisConnectionStatus = "disconnected";
  }

  try {
    if (REDIS_URL) {
      // Ensure REDIS_URL has the redis:// protocol prefix
      const redisUrl = REDIS_URL.startsWith("redis://")
        ? REDIS_URL
        : `redis://${REDIS_URL}`;
      console.log(
        `Connecting to Redis at: ${redisUrl.replace(/:[^:@]+@/, ":****@")}`
      ); // Hide password if present
      redisClient = createClient({ url: redisUrl });
    } else {
      console.log(`Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
      redisClient = createClient({
        socket: {
          host: REDIS_HOST,
          port: REDIS_PORT,
        },
      });
    }

    redisClient.on("error", (err: Error) => {
      console.error("Redis Client Error:", err);
      redisConnectionStatus = "error";
    });

    redisClient.on("connect", () => {
      console.log("Redis client connecting...");
    });

    redisClient.on("ready", () => {
      console.log("Redis client ready");
      redisConnectionStatus = "connected";
    });

    redisClient.on("end", () => {
      console.warn("Redis client connection ended");
      redisConnectionStatus = "disconnected";
    });

    await redisClient.connect();

    // Verify connection after connect
    const isHealthy = await checkRedisHealth();
    if (!isHealthy) {
      console.error("Redis connection established but health check failed");
      throw new Error("Redis health check failed after connection");
    }

    console.log("Redis connected successfully");
    return redisClient;
  } catch (error) {
    redisConnectionStatus = "error";
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
}

/**
 * Get cached stock data for a ticker
 * @param ticker - Stock ticker symbol
 * @returns Cached data object with metadata, or null if not found
 */
export async function getCachedStock(
  ticker: string
): Promise<Record<string, unknown> | null> {
  try {
    const client = await getRedisClient();
    const key = `stock-api:${ticker.toUpperCase()}`;
    const cached = await client.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as Record<string, unknown>;
  } catch (error) {
    console.error(`Error getting cached stock for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get cache age in seconds
 * @param ticker - Stock ticker symbol
 * @returns Cache age in seconds, or null if not cached
 */
export async function getCacheAge(ticker: string): Promise<number | null> {
  try {
    const cached = await getCachedStock(ticker);
    if (!cached || !cached._metadata) {
      return null;
    }

    const metadata = cached._metadata as { fetchedAt: number };
    const age = Math.floor(Date.now() / 1000) - metadata.fetchedAt;
    return age;
  } catch (error) {
    console.error(`Error getting cache age for ${ticker}:`, error);
    return null;
  }
}

/**
 * Check if cache is stale
 * @param ticker - Stock ticker symbol
 * @returns true if cache is stale or doesn't exist, false otherwise
 */
export async function isCacheStale(ticker: string): Promise<boolean> {
  const age = await getCacheAge(ticker);
  if (age === null) {
    return true; // Not cached = stale
  }
  return age >= CACHE_STALE_THRESHOLD_SECONDS;
}

/**
 * Cache stock data for a ticker with metadata
 * @param ticker - Stock ticker symbol
 * @param data - Data object from source (e.g., { price: 150.25, change: 2.5, ... })
 * @param source - Source name (e.g., "finnhub", "fidelity")
 */
export async function setCachedStock(
  ticker: string,
  data: Record<string, unknown>,
  source: string
): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `stock-api:${ticker.toUpperCase()}`;

    // Add metadata with timestamp
    const cachedData = {
      ...data,
      _metadata: {
        fetchedAt: Math.floor(Date.now() / 1000),
        source: source,
      },
    };

    await client.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(cachedData));

    // Remove from refresh queue since we just updated it
    await client.zRem(REFRESH_QUEUE_KEY, ticker.toUpperCase());
  } catch (error) {
    console.error(`Error caching stock for ${ticker}:`, error);
    // Don't throw - caching failures shouldn't break the request
  }
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisConnectionStatus = "disconnected";
  }
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): "connected" | "disconnected" | "error" {
  return redisConnectionStatus;
}

/**
 * Queue a ticker for refresh (add to sorted set by cache age)
 * @param ticker - Stock ticker symbol
 */
export async function queueRefresh(ticker: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const age = await getCacheAge(ticker);
    const score = age !== null ? age : Number.MAX_SAFE_INTEGER; // Not cached = highest priority

    await client.zAdd(REFRESH_QUEUE_KEY, {
      score: score,
      value: ticker.toUpperCase(),
    });
  } catch (error) {
    console.error(`Error queueing refresh for ${ticker}:`, error);
  }
}

/**
 * Get next ticker from refresh queue (oldest first)
 * @returns Ticker symbol or null if queue is empty
 */
export async function getNextRefreshTicker(): Promise<string | null> {
  try {
    const client = await getRedisClient();
    // Get the ticker with the highest score (oldest cache)
    const result = await client.zRange(REFRESH_QUEUE_KEY, -1, -1, {
      REV: true,
    });

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error("Error getting next refresh ticker:", error);
    return null;
  }
}

/**
 * Remove ticker from refresh queue
 * @param ticker - Stock ticker symbol
 */
export async function removeFromRefreshQueue(ticker: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.zRem(REFRESH_QUEUE_KEY, ticker.toUpperCase());
  } catch (error) {
    console.error(`Error removing ${ticker} from refresh queue:`, error);
  }
}
