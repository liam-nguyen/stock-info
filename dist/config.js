"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: Number(process.env.PORT ?? 3000),
    redisHost: process.env.REDIS_HOST,
    redisPort: Number(process.env.REDIS_PORT ?? 6379),
    redisPassword: process.env.REDIS_PASSWORD,
    cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 60 * 60 * 24),
    /** Redis key prefix for options chains, e.g. `stock-api:options:AAPL`. */
    redisOptionsKeyPrefix: process.env.REDIS_OPTIONS_KEY_PREFIX ?? "stock-api:options",
    optionsCacheTtlSeconds: Number(process.env.OPTIONS_CACHE_TTL_SECONDS ?? process.env.CACHE_TTL_SECONDS ?? 60 * 60 * 24),
    refreshBaseMs: Number(process.env.REFRESH_BASE_MS ?? 60 * 60 * 1000),
    refreshJitterMaxMs: Number(process.env.REFRESH_JITTER_MAX_MS ?? 15 * 60 * 1000),
};
