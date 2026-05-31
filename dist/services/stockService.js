"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockQuotes = exports.getStockQuote = void 0;
const config_1 = require("../config");
const marketSession_1 = require("../lib/marketSession");
const redis_1 = require("../lib/redis");
const symbolProxy_1 = require("../lib/symbolProxy");
const YahooFinanceService_1 = require("./YahooFinanceService");
const yahooFinanceService = new YahooFinanceService_1.YahooFinanceService();
/** Log schema validation details from yahoo-finance2 when a fetch still fails. */
function logYahooValidationFailure(symbol, error) {
    if (error === null || typeof error !== "object") {
        return;
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg !== "Failed Yahoo Schema validation") {
        return;
    }
    const withExtras = error;
    console.error(`[stock-api] Yahoo schema validation failed for ${symbol}`, withExtras.errors ?? error);
}
const getStockKey = (symbol) => `stock-api:stock:${symbol}`;
const buildNextRefreshAt = (fromMs) => (0, marketSession_1.computeNextRefreshAt)(fromMs);
const toCacheRecord = (symbol, data) => {
    const fetchedAt = Date.now();
    return {
        symbol,
        fetchedAt,
        nextRefreshAt: buildNextRefreshAt(fetchedAt),
        source: "yahoo-finance2",
        data,
    };
};
const saveRecord = async (key, record) => {
    const redis = (0, redis_1.getRedisClient)();
    await redis.set(key, JSON.stringify(record), { EX: config_1.config.cacheTtlSeconds });
};
const fetchFromYahoo = async (symbol) => yahooFinanceService.fetchAllModules(symbol);
/** Yahoo sometimes returns `quote` as a one-element array; downstream expects a single object. */
function normalizeModuleDataQuote(data) {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    const d = data;
    const q = d.quote;
    if (Array.isArray(q) && q.length > 0 && typeof q[0] === "object" && q[0] !== null) {
        return { ...d, quote: q[0] };
    }
    return data;
}
/** Every result row uses the requested ticker on `data.quote.symbol` (same contract as non-proxied quotes). */
function alignQuoteTickerToRequest(data, requestedUpper) {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    const d = data;
    const q = d.quote;
    if (q && typeof q === "object" && !Array.isArray(q)) {
        return {
            ...d,
            quote: { ...q, symbol: requestedUpper },
        };
    }
    return data;
}
function finalizeStockPayload(data, requestedUpper) {
    return alignQuoteTickerToRequest(normalizeModuleDataQuote(data), requestedUpper);
}
const fetchAndMaybeProxy = async (requestedSymbol) => {
    const { fetchSymbol, ratio } = (0, symbolProxy_1.resolveFetchSymbol)(requestedSymbol);
    const raw = await fetchFromYahoo(fetchSymbol);
    const merged = ratio !== 1 ? (0, symbolProxy_1.applyPriceProxyToYahooData)(raw, requestedSymbol, ratio, fetchSymbol) : raw;
    return finalizeStockPayload(merged, requestedSymbol);
};
const parseCachedRecord = (raw) => {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.symbol === "string" &&
            typeof parsed?.fetchedAt === "number" &&
            typeof parsed?.nextRefreshAt === "number") {
            return parsed;
        }
        return null;
    }
    catch {
        return null;
    }
};
const resolveStockQuoteFromCache = async (symbol, cachedRecord) => {
    const redis = (0, redis_1.getRedisClient)();
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
        }
        catch (error) {
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
    }
    catch (error) {
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
const getStockQuote = async (symbolInput) => {
    const symbol = symbolInput.trim().toUpperCase();
    const redis = (0, redis_1.getRedisClient)();
    const cachedRecord = parseCachedRecord(await redis.get(getStockKey(symbol)));
    return resolveStockQuoteFromCache(symbol, cachedRecord);
};
exports.getStockQuote = getStockQuote;
const getStockQuotes = async (symbolInputs) => {
    if (symbolInputs.length === 0) {
        return [];
    }
    const symbols = symbolInputs.map((s) => s.trim().toUpperCase());
    const redis = (0, redis_1.getRedisClient)();
    const keys = symbols.map(getStockKey);
    let raws;
    if (typeof redis.mGet === "function") {
        raws = await redis.mGet(keys);
    }
    else {
        raws = await Promise.all(keys.map((k) => redis.get(k)));
    }
    return Promise.all(symbols.map((sym, i) => resolveStockQuoteFromCache(sym, parseCachedRecord(raws[i] ?? null))));
};
exports.getStockQuotes = getStockQuotes;
