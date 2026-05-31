import { config } from "../config";
import { computeNextRefreshAt } from "../lib/marketSession";
import { getRedisClient } from "../lib/redis";
import { applyPriceProxyToYahooData, resolveFetchSymbol } from "../lib/symbolProxy";
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

/** Log schema validation details from yahoo-finance2 when a fetch still fails. */
function logYahooValidationFailure(symbol: string, error: unknown): void {
    if (error === null || typeof error !== "object") {
        return;
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg !== "Failed Yahoo Schema validation") {
        return;
    }
    const withExtras = error as Error & { errors?: unknown };
    console.error(`[stock-api] Yahoo schema validation failed for ${symbol}`, withExtras.errors ?? error);
}

const getStockKey = (symbol: string): string => `stock-api:stock:${symbol}`;

const buildNextRefreshAt = (fromMs: number): number => computeNextRefreshAt(fromMs);

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

/** Yahoo sometimes returns `quote` as a one-element array; downstream expects a single object. */
function normalizeModuleDataQuote(data: unknown): unknown {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    const d = data as Record<string, unknown>;
    const q = d.quote;
    if (Array.isArray(q) && q.length > 0 && typeof q[0] === "object" && q[0] !== null) {
        return { ...d, quote: q[0] };
    }
    return data;
}

/** Every result row uses the requested ticker on `data.quote.symbol` (same contract as non-proxied quotes). */
function alignQuoteTickerToRequest(data: unknown, requestedUpper: string): unknown {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    const d = data as Record<string, unknown>;
    const q = d.quote;
    if (q && typeof q === "object" && !Array.isArray(q)) {
        return {
            ...d,
            quote: { ...(q as Record<string, unknown>), symbol: requestedUpper },
        };
    }
    return data;
}

function finalizeStockPayload(data: unknown, requestedUpper: string): unknown {
    return alignQuoteTickerToRequest(normalizeModuleDataQuote(data), requestedUpper);
}

const fetchAndMaybeProxy = async (requestedSymbol: string): Promise<unknown> => {
    const { fetchSymbol, ratio } = resolveFetchSymbol(requestedSymbol);
    const raw = await fetchFromYahoo(fetchSymbol);
    const merged = ratio !== 1 ? applyPriceProxyToYahooData(raw, requestedSymbol, ratio, fetchSymbol) : raw;
    return finalizeStockPayload(merged, requestedSymbol);
};

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

const resolveStockQuoteFromCache = async (
    symbol: string,
    cachedRecord: StockCacheRecord | null,
): Promise<StockResult> => {
    const redis = getRedisClient();
    const key = getStockKey(symbol);
    const now = Date.now();

    if (!cachedRecord) {
        try {
            const freshData = await fetchAndMaybeProxy(symbol);
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
            logYahooValidationFailure(symbol, error);
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
            data: finalizeStockPayload(cachedRecord.data, symbol),
        };
    }

    try {
        const freshData = await fetchAndMaybeProxy(symbol);
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
        logYahooValidationFailure(symbol, error);
        return {
            symbol,
            status: "stale_on_error",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: finalizeStockPayload(cachedRecord.data, symbol),
            error: error instanceof Error ? error.message : "Refresh failed, using stale cache.",
        };
    }
};

export const getStockQuote = async (symbolInput: string): Promise<StockResult> => {
    const symbol = symbolInput.trim().toUpperCase();
    const redis = getRedisClient();
    const cachedRecord = parseCachedRecord(await redis.get(getStockKey(symbol)));
    return resolveStockQuoteFromCache(symbol, cachedRecord);
};

export const getStockQuotes = async (symbolInputs: string[]): Promise<StockResult[]> => {
    if (symbolInputs.length === 0) {
        return [];
    }
    const symbols = symbolInputs.map((s) => s.trim().toUpperCase());
    const redis = getRedisClient();
    const keys = symbols.map(getStockKey);
    let raws: (string | null)[];
    if (typeof redis.mGet === "function") {
        raws = await redis.mGet(keys);
    } else {
        raws = await Promise.all(keys.map((k) => redis.get(k)));
    }
    return Promise.all(symbols.map((sym, i) => resolveStockQuoteFromCache(sym, parseCachedRecord(raws[i] ?? null))));
};
