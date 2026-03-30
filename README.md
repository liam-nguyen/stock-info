# stock-api

Stock quote API using `yahoo-finance2@3.14.0` with Redis caching and staggered refresh.

## Features

- `GET /stocks?symbols=AAPL,MSFT` endpoint for batched symbol queries.
- Yahoo integration is encapsulated in `src/services/YahooFinanceService.ts`, and the route consumes the stock service flow.
- Per symbol, `data` includes:
  - `quote`
  - `insights`
  - `quoteSummary` (`modules: "all"`)
  - `recommendationsBySymbol`
  - `fundamentalsTimeSeries` (`module: "financials"`, `type: "quarterly"`, `period1: now - 1 year`)
- Redis cache key format: `stock-api:stock:<SYMBOL>`.
- Redis TTL is fixed at 1 day (`86400s`).
- Refresh policy per cached symbol:
    - Before refresh time: return cached.
    - At/after refresh time: attempt refetch.
    - Refetch success: replace cached value.
    - Refetch failure: return stale cached value (`stale_on_error`).
- Refresh time uses jitter: `nextRefreshAt = fetchedAt + 1h + random(0..15m)`.

## Configuration

Environment variables (defaults included):

- `PORT=3000`
- `REDIS_HOST=192.168.10.10`
- `REDIS_PORT=6379`
- `REDIS_PASSWORD=jayce1scute`
- `CACHE_TTL_SECONDS=86400`
- `REFRESH_BASE_MS=3600000`
- `REFRESH_JITTER_MAX_MS=900000`

## Run

```bash
npm install
npm run dev
```

The app auto-loads `.env` on startup (`dotenv/config` in `src/server.ts`), so local testing can use values from `.env` without exporting variables manually.

Build and run production:

```bash
npm run build
npm start
```

Run tests:

```bash
npm test
```

## Example request

```bash
curl "http://localhost:3000/stocks?symbols=AAPL,MSFT"
```

Example response shape (trimmed):

```json
{
  "count": 1,
  "results": [
    {
      "symbol": "AAPL",
      "status": "fresh",
      "fetchedAt": 1710000000000,
      "nextRefreshAt": 1710004500000,
      "data": {
        "quote": {},
        "insights": {},
        "quoteSummary": {},
        "recommendationsBySymbol": [],
        "fundamentalsTimeSeries": []
      }
    }
  ]
}
```

## Docker (API only)

This project does not start Redis in compose. It connects to your already-running Redis container/instance using the `.env` values.

Default host mapping:

- Container listens on `3000`
- Host publishes on `38081` (configurable via `HOST_PORT`)

Run with docker compose:

```bash
docker compose up --build -d
curl "http://localhost:38081/health"
```

Override host port:

```bash
HOST_PORT=49123 docker compose up --build -d
```

If Redis is running in another container, make sure `REDIS_HOST` resolves from the API container (for example, host IP like `192.168.10.10`, `host.docker.internal`, or a shared Docker network hostname).

## Reference

- [yahoo-finance2 v3.14.0 release](https://github.com/gadicc/yahoo-finance2/releases/tag/v3.14.0)
