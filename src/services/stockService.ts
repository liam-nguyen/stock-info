import { config } from "../config";
import { getRedisClient } from "../lib/redis";
import { YahooFinanceService } from "./YahooFinanceService";

export type CacheSourceStatus = "fresh" | "cached" | "stale_on_error" | "error";
const yahooFinanceService = new YahooFinanceService();

export interface StockCacheRecord {
    symbol: string;
    fetchedAt: number;
    nextRefreshAt: number;
    source: "yahoo-finance2";
    data: unknown;
}

export interface StockResult {
    symbol: string;
    status: CacheSourceStatus;
    fetchedAt?: number;
    nextRefreshAt?: number;
    data?: unknown;
    error?: string;
}

const getStockKey = (symbol: string): string => `stock-api:stock:${symbol}`;

const buildNextRefreshAt = (fromMs: number): number => {
    const jitter = Math.floor(Math.random() * (config.refreshJitterMaxMs + 1));
    return fromMs + config.refreshBaseMs + jitter;
};

const toCacheRecord = (symbol: string, data: unknown): StockCacheRecord => {
    const fetchedAt = Date.now();
    return {
        symbol,
        fetchedAt,
        nextRefreshAt: buildNextRefreshAt(fetchedAt),
        source: "yahoo-finance2",
        data,
    };
};

const saveRecord = async (key: string, record: StockCacheRecord): Promise<void> => {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(record), { EX: config.cacheTtlSeconds });
};

const fetchFromYahoo = async (symbol: string): Promise<unknown> => yahooFinanceService.fetchAllModules(symbol);

const parseCachedRecord = (raw: string | null): StockCacheRecord | null => {
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as StockCacheRecord;
        if (
            typeof parsed?.symbol === "string" &&
            typeof parsed?.fetchedAt === "number" &&
            typeof parsed?.nextRefreshAt === "number"
        ) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};

export const getStockQuote = async (symbolInput: string): Promise<StockResult> => {
    const symbol = symbolInput.toUpperCase();
    const redis = getRedisClient();
    const key = getStockKey(symbol);
    const cachedRecord = parseCachedRecord(await redis.get(key));
    const now = Date.now();

    if (!cachedRecord) {
        try {
            const freshData = await fetchFromYahoo(symbol);
            const freshRecord = toCacheRecord(symbol, freshData);
            await saveRecord(key, freshRecord);
            return {
                symbol,
                status: "fresh",
                fetchedAt: freshRecord.fetchedAt,
                nextRefreshAt: freshRecord.nextRefreshAt,
                data: freshRecord.data,
            };
        } catch (error) {
            return {
                symbol,
                status: "error",
                error: error instanceof Error ? error.message : "Failed to fetch stock data.",
            };
        }
    }

    if (now < cachedRecord.nextRefreshAt) {
        return {
            symbol,
            status: "cached",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: cachedRecord.data,
        };
    }

    try {
        const freshData = await fetchFromYahoo(symbol);
        const freshRecord = toCacheRecord(symbol, freshData);
        await saveRecord(key, freshRecord);
        return {
            symbol,
            status: "fresh",
            fetchedAt: freshRecord.fetchedAt,
            nextRefreshAt: freshRecord.nextRefreshAt,
            data: freshRecord.data,
        };
    } catch (error) {
        return {
            symbol,
            status: "stale_on_error",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: cachedRecord.data,
            error: error instanceof Error ? error.message : "Refresh failed, using stale cache.",
        };
    }
};
