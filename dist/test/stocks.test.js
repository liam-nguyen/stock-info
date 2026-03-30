"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const { redisStore, redisClientMock, quoteMock } = vitest_1.vi.hoisted(() => {
    const store = new Map();
    return {
        redisStore: store,
        redisClientMock: {
            get: vitest_1.vi.fn(async (key) => store.get(key) ?? null),
            set: vitest_1.vi.fn(async (key, value) => {
                store.set(key, value);
                return "OK";
            }),
            connect: vitest_1.vi.fn(async () => undefined),
            isOpen: true,
        },
        quoteMock: vitest_1.vi.fn(),
    };
});
vitest_1.vi.mock("../src/lib/redis", () => ({
    getRedisClient: () => redisClientMock,
    ensureRedisConnected: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("yahoo-finance2", () => ({
    default: {
        quote: quoteMock,
    },
}));
const app_1 = require("../src/app");
(0, vitest_1.describe)("GET /stocks", () => {
    (0, vitest_1.beforeEach)(() => {
        redisStore.clear();
        redisClientMock.get.mockClear();
        redisClientMock.set.mockClear();
        quoteMock.mockReset();
    });
    (0, vitest_1.it)("fetches and caches when cache is missing", async () => {
        vitest_1.vi.spyOn(Math, "random").mockReturnValueOnce(0);
        quoteMock.mockResolvedValueOnce({ symbol: "AAPL", regularMarketPrice: 123.45 });
        const response = await (0, supertest_1.default)((0, app_1.createApp)()).get("/stocks?symbols=AAPL");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.results[0].status).toBe("fresh");
        (0, vitest_1.expect)(response.body.results[0].symbol).toBe("AAPL");
        (0, vitest_1.expect)(redisClientMock.set).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(redisClientMock.set).toHaveBeenCalledWith("stock-api:stock:AAPL", vitest_1.expect.any(String), { EX: 86400 });
    });
    (0, vitest_1.it)("returns cached value when refresh time is not due", async () => {
        const now = Date.now();
        redisStore.set("stock-api:stock:MSFT", JSON.stringify({
            symbol: "MSFT",
            fetchedAt: now - 5_000,
            nextRefreshAt: now + 60_000,
            source: "yahoo-finance2",
            data: { symbol: "MSFT", regularMarketPrice: 321.0 },
        }));
        const response = await (0, supertest_1.default)((0, app_1.createApp)()).get("/stocks?symbols=msft");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.results[0].status).toBe("cached");
        (0, vitest_1.expect)(response.body.results[0].data.regularMarketPrice).toBe(321.0);
        (0, vitest_1.expect)(quoteMock).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("refreshes and replaces cache when refresh is due and fetch succeeds", async () => {
        vitest_1.vi.spyOn(Math, "random").mockReturnValueOnce(0);
        const now = Date.now();
        redisStore.set("stock-api:stock:TSLA", JSON.stringify({
            symbol: "TSLA",
            fetchedAt: now - 7_000,
            nextRefreshAt: now - 1,
            source: "yahoo-finance2",
            data: { symbol: "TSLA", regularMarketPrice: 200.0 },
        }));
        quoteMock.mockResolvedValueOnce({ symbol: "TSLA", regularMarketPrice: 210.0 });
        const response = await (0, supertest_1.default)((0, app_1.createApp)()).get("/stocks?symbols=TSLA");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.results[0].status).toBe("fresh");
        (0, vitest_1.expect)(response.body.results[0].data.regularMarketPrice).toBe(210.0);
        (0, vitest_1.expect)(redisClientMock.set).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)("keeps stale cache when refresh is due and fetch fails", async () => {
        const now = Date.now();
        redisStore.set("stock-api:stock:NVDA", JSON.stringify({
            symbol: "NVDA",
            fetchedAt: now - 7_000,
            nextRefreshAt: now - 1,
            source: "yahoo-finance2",
            data: { symbol: "NVDA", regularMarketPrice: 500.0 },
        }));
        quoteMock.mockRejectedValueOnce(new Error("Yahoo unavailable"));
        const response = await (0, supertest_1.default)((0, app_1.createApp)()).get("/stocks?symbols=NVDA");
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.results[0].status).toBe("stale_on_error");
        (0, vitest_1.expect)(response.body.results[0].data.regularMarketPrice).toBe(500.0);
        (0, vitest_1.expect)(response.body.results[0].error).toContain("Yahoo unavailable");
        (0, vitest_1.expect)(redisClientMock.set).not.toHaveBeenCalled();
    });
});
