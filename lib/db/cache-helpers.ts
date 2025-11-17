import mongoose from "mongoose";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Discover all collections with prefix "stock-cached-"
 * @returns Array of source names (e.g., ["yf"])
 */
export async function discoverCachedCollections(): Promise<string[]> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  const collections = await db.listCollections().toArray();
  const cachedCollections = collections
    .map((col) => col.name)
    .filter((name) => name.startsWith("stock-cached-"))
    .map((name) => name.replace("stock-cached-", ""));

  return cachedCollections;
}

/**
 * Check if a batch of symbols needs refresh
 * Cache TTL is per batch: if ANY symbol is stale or missing, refresh ALL symbols
 * @param cachedData Array of cached documents (may be null for missing symbols)
 * @returns true if batch needs refresh
 */
export function batchNeedsRefresh(
  cachedData: Array<{ queryTime: Date } | null>
): boolean {
  const now = new Date();

  // If ANY symbol is missing or stale, refresh the entire batch
  for (const data of cachedData) {
    if (!data || !data.queryTime) {
      return true; // Missing data
    }

    const age = now.getTime() - data.queryTime.getTime();
    if (age >= CACHE_TTL_MS) {
      return true; // Stale data
    }
  }

  return false; // All data is fresh
}

/**
 * Get the model for a specific source collection
 * @param source Source name (e.g., "yf")
 * @returns Mongoose model for the source
 */
export function getSourceModel(source: string) {
  // For now, we only have YfStock model
  // In the future, this can be extended to support other sources
  if (source === "yf") {
    // Dynamic import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const YfStock = require("@/models/mongodb/yf-stock").default;
    return YfStock;
  }

  throw new Error(`Unknown source: ${source}`);
}

/**
 * Batch write multiple symbols to a collection with individual queryTime for each symbol
 * Each symbol gets its own queryTime so expiration can be checked per-stock
 * @param source Source name (e.g., "yf")
 * @param symbolsData Map of symbol to data object
 */
export async function batchWriteToCollection(
  source: string,
  symbolsData: Record<string, unknown>
): Promise<void> {
  const Model = getSourceModel(source);

  const writePromises = Object.entries(symbolsData).map(([symbol, data]) => {
    // Each symbol gets its own queryTime for per-stock expiration checking
    const queryTime = new Date();
    const updateData: Record<string, unknown> = {
      symbol,
      queryTime,
    };

    // Only spread data if it's an object
    if (data && typeof data === "object" && !Array.isArray(data)) {
      Object.assign(updateData, data);
    }

    return Model.findOneAndUpdate({ symbol }, updateData, {
      upsert: true,
      new: true,
    });
  });

  await Promise.all(writePromises);
}

export { CACHE_TTL_MS };
