"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockQuote = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
const config_1 = require("../config");
const redis_1 = require("../lib/redis");
const getStockKey = (symbol) => `stock-api:stock:${symbol}`;
const buildNextRefreshAt = (fromMs) => {
    const jitter = Math.floor(Math.random() * (config_1.config.refreshJitterMaxMs + 1));
    return fromMs + config_1.config.refreshBaseMs + jitter;
};
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
const fetchFromYahoo = async (symbol) => yahoo_finance2_1.default.quote(symbol);
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
const getStockQuote = async (symbolInput) => {
    const symbol = symbolInput.toUpperCase();
    const redis = (0, redis_1.getRedisClient)();
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
        }
        catch (error) {
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
    }
    catch (error) {
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
exports.getStockQuote = getStockQuote;
