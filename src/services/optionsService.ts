import { config } from "../config";
import { computeNextRefreshAt } from "../lib/marketSession";
import { getRedisClient } from "../lib/redis";
import { applyPriceProxyToYahooData, resolveFetchSymbol } from "../lib/symbolProxy";
import { YahooFinanceService } from "./YahooFinanceService";

export type OptionsCacheSourceStatus = "fresh" | "cached" | "stale_on_error" | "error";

const yahooFinanceService = new YahooFinanceService();

export interface OptionsChainCacheRecord {
    symbol: string;
    fetchedAt: number;
    nextRefreshAt: number;
    source: "yahoo-finance2";
    data: unknown;
}

export interface OptionsChainResult {
    symbol: string;
    status: OptionsCacheSourceStatus;
    fetchedAt?: number;
    nextRefreshAt?: number;
    data?: unknown;
    error?: string;
    proxyBy?: string;
}

export interface OptionContractCacheRecord {
    symbol: string;
    fetchedAt: number;
    nextRefreshAt: number;
    source: "yahoo-finance2";
    data: unknown;
}

export interface OptionContractResult {
    symbol: string;
    status: OptionsCacheSourceStatus;
    fetchedAt?: number;
    nextRefreshAt?: number;
    data?: unknown;
    error?: string;
}

function logYahooValidationFailure(label: string, error: unknown): void {
    if (error === null || typeof error !== "object") {
        return;
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg !== "Failed Yahoo Schema validation") {
        return;
    }
    const withExtras = error as Error & { errors?: unknown };
    console.error(`[stock-api] Yahoo schema validation failed for ${label}`, withExtras.errors ?? error);
}

/** Yahoo sometimes returns `quote` as a one-element array; normalize to a single object. */
function normalizeQuoteInPayload(data: unknown): unknown {
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

function alignUnderlyingQuoteSymbol(data: unknown, requestedUpper: string): unknown {
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

function finalizeOptionsChainPayload(data: unknown, requestedUpper: string): unknown {
    return alignUnderlyingQuoteSymbol(normalizeQuoteInPayload(data), requestedUpper);
}

const getOptionsChainKey = (underlying: string): string =>
    `${config.redisOptionsKeyPrefix}:${underlying}`;

const getOptionContractKey = (occ: string): string =>
    `${config.redisOptionsKeyPrefix}:quote:${occ}`;

const buildNextRefreshAt = (fromMs: number): number => computeNextRefreshAt(fromMs);

const toChainRecord = (symbol: string, data: unknown): OptionsChainCacheRecord => {
    const fetchedAt = Date.now();
    return {
        symbol,
        fetchedAt,
        nextRefreshAt: buildNextRefreshAt(fetchedAt),
        source: "yahoo-finance2",
        data,
    };
};

const saveChainRecord = async (key: string, record: OptionsChainCacheRecord): Promise<void> => {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(record), { EX: config.optionsCacheTtlSeconds });
};

const saveContractRecord = async (key: string, record: OptionContractCacheRecord): Promise<void> => {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(record), { EX: config.optionsCacheTtlSeconds });
};

const fetchOptionsChainFromYahoo = async (requestedSymbol: string): Promise<{ data: unknown; proxyBy?: string }> => {
    const { fetchSymbol, ratio } = resolveFetchSymbol(requestedSymbol);
    const raw = await yahooFinanceService.options(fetchSymbol);
    const merged =
        ratio !== 1 ? applyPriceProxyToYahooData(raw, requestedSymbol, ratio, fetchSymbol) : raw;
    const finalized = finalizeOptionsChainPayload(merged, requestedSymbol);
    return ratio !== 1
        ? { data: finalized, proxyBy: fetchSymbol.toUpperCase() }
        : { data: finalized };
};

const parseChainRecord = (raw: string | null): OptionsChainCacheRecord | null => {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as OptionsChainCacheRecord;
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

const parseContractRecord = (raw: string | null): OptionContractCacheRecord | null => {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as OptionContractCacheRecord;
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

function normalizeStandaloneQuote(data: unknown): unknown {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
        return data[0];
    }
    return data;
}

export const getOptionsChain = async (underlyingInput: string): Promise<OptionsChainResult> => {
    const symbol = underlyingInput.trim().toUpperCase();
    const redis = getRedisClient();
    const key = getOptionsChainKey(symbol);
    const cachedRecord = parseChainRecord(await redis.get(key));
    const now = Date.now();

    if (!cachedRecord) {
        try {
            const { data, proxyBy } = await fetchOptionsChainFromYahoo(symbol);
            const freshRecord = toChainRecord(symbol, data);
            await saveChainRecord(key, freshRecord);
            return {
                symbol,
                status: "fresh",
                fetchedAt: freshRecord.fetchedAt,
                nextRefreshAt: freshRecord.nextRefreshAt,
                data: freshRecord.data,
                ...(proxyBy !== undefined ? { proxyBy } : {}),
            };
        } catch (error) {
            logYahooValidationFailure(symbol, error);
            return {
                symbol,
                status: "error",
                error: error instanceof Error ? error.message : "Failed to fetch options chain.",
            };
        }
    }

    if (now < cachedRecord.nextRefreshAt) {
        return {
            symbol,
            status: "cached",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: finalizeOptionsChainPayload(cachedRecord.data, symbol),
        };
    }

    try {
        const { data, proxyBy } = await fetchOptionsChainFromYahoo(symbol);
        const freshRecord = toChainRecord(symbol, data);
        await saveChainRecord(key, freshRecord);
        return {
            symbol,
            status: "fresh",
            fetchedAt: freshRecord.fetchedAt,
            nextRefreshAt: freshRecord.nextRefreshAt,
            data: freshRecord.data,
            ...(proxyBy !== undefined ? { proxyBy } : {}),
        };
    } catch (error) {
        logYahooValidationFailure(symbol, error);
        return {
            symbol,
            status: "stale_on_error",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: finalizeOptionsChainPayload(cachedRecord.data, symbol),
            error: error instanceof Error ? error.message : "Refresh failed, using stale cache.",
        };
    }
};

const toContractRecord = (symbol: string, data: unknown): OptionContractCacheRecord => {
    const fetchedAt = Date.now();
    return {
        symbol,
        fetchedAt,
        nextRefreshAt: buildNextRefreshAt(fetchedAt),
        source: "yahoo-finance2",
        data,
    };
};

export const getOptionContractQuote = async (occInput: string): Promise<OptionContractResult> => {
    const symbol = occInput.trim().toUpperCase();
    const redis = getRedisClient();
    const key = getOptionContractKey(symbol);
    const cachedRecord = parseContractRecord(await redis.get(key));
    const now = Date.now();

    const finalize = (d: unknown) => normalizeStandaloneQuote(d);

    if (!cachedRecord) {
        try {
            const raw = await yahooFinanceService.quote(symbol);
            const data = finalize(raw);
            const freshRecord = toContractRecord(symbol, data);
            await saveContractRecord(key, freshRecord);
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
                error: error instanceof Error ? error.message : "Failed to fetch option quote.",
            };
        }
    }

    if (now < cachedRecord.nextRefreshAt) {
        return {
            symbol,
            status: "cached",
            fetchedAt: cachedRecord.fetchedAt,
            nextRefreshAt: cachedRecord.nextRefreshAt,
            data: finalize(cachedRecord.data),
        };
    }

    try {
        const raw = await yahooFinanceService.quote(symbol);
        const data = finalize(raw);
        const freshRecord = toContractRecord(symbol, data);
        await saveContractRecord(key, freshRecord);
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
            data: finalize(cachedRecord.data),
            error: error instanceof Error ? error.message : "Refresh failed, using stale cache.",
        };
    }
};
