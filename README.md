# Stock API - Liam Nguyen

A simple Node.js TypeScript API server for fetching stock data from multiple sources (Finnhub, Fidelity, etc.).

## Features

- **GraphQL API** for flexible queries
- **Node.js** with Express
- **TypeScript** with strict mode
- **Redis** caching with smart refresh strategy
- **Background worker** for automatic cache refresh (respects rate limits)
- **Docker** support with docker-compose
- **Multiple data sources**: Finnhub API and Alpha Vantage API
- **Automatic source routing**: Routes to appropriate source based on ticker mapping
- **Market hours-aware caching**: Cache TTL extends until market opens when closed (including weekends)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- Redis (remote Redis service recommended, or use Docker Compose for local development)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
# OR use Redis URL
# REDIS_URL=redis://localhost:6379

# API Keys
FINNHUB_API_KEY=your_finnhub_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# Cache Refresh Configuration (optional)
CACHE_STALE_THRESHOLD_SECONDS=300  # When to consider cache stale (default: 300 = 5 min)
REFRESH_WORKER_INTERVAL_MS=2000    # Worker processing interval (default: 2000 = 2 sec)
BACKOFF_INITIAL_SECONDS=2          # Initial backoff on rate limit error (default: 2)
BACKOFF_MAX_SECONDS=60             # Maximum backoff time (default: 60)
```

3. Run the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Deployment

#### Using Pre-built Image (Recommended for Production)

The Docker image is automatically built and pushed to Docker Hub via GitHub Actions when code is pushed to the `main` branch.

1. Pull and start services:

```bash
docker-compose up -d
```

This will:

- Pull the latest image from Docker Hub (`liamngdev/stock-api:latest`)
- Start the API server on port 3000
- Start Watchtower for automatic updates (checks every 30 seconds)

2. Access the API:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ stocks(tickers: [\"AAPL\", \"MSFT\"]) { ticker price currentPrice change metadata { fetchedAt source } } }"}'
```

**Note:** This setup uses a remote Redis service. Make sure `REDIS_URL` is configured in your environment variables.

#### Local Development with Docker

For local development, you can build the image yourself:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

(You would need to create a `docker-compose.dev.yml` with `build: .` instead of `image:`)

## API Endpoints

### POST /graphql

GraphQL endpoint for querying stock data.

**Query a single stock:**

```graphql
query {
  stock(ticker: "AAPL") {
    ticker
    currentPrice
    change
    percentChange
    highPrice
    lowPrice
    openPrice
    previousClose
    metadata {
      fetchedAt
      source
    }
  }
}
```

**Query multiple stocks:**

```graphql
query {
  stocks(tickers: ["AAPL", "MSFT", "NHFSMKX98"]) {
    ticker
    price
    currentPrice
    change
    metadata {
      fetchedAt
      source
    }
  }
}
```

**Example using curl:**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ stocks(tickers: [\"AAPL\", \"MSFT\"]) { ticker currentPrice change metadata { fetchedAt source } } }"
  }'
```

**Response:**

```json
{
  "data": {
    "stocks": [
      {
        "ticker": "AAPL",
        "currentPrice": 150.25,
        "change": 2.5,
        "metadata": {
          "fetchedAt": 1704067200,
          "source": "finnhub"
        }
      },
      {
        "ticker": "MSFT",
        "currentPrice": 380.5,
        "change": 5.25,
        "metadata": {
          "fetchedAt": 1704067200,
          "source": "finnhub"
        }
      }
    ]
  }
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run validate` - Run all checks (type-check, lint, format:check)

## Architecture

### Data Sources

The API supports multiple data sources:

1. **Finnhub API** (`finnhub`): Default source for most tickers
   - Provides real-time quote data including current price, change, high/low, open, and previous close
   - Uses official Finnhub API with API key authentication
   - Cache TTL: 5 minutes during market hours

2. **Alpha Vantage API** (`alpha-vantage`): For specific tickers (FXAIX, VFIAX)
   - Provides real-time quote data via GLOBAL_QUOTE endpoint
   - Limited to 20 requests per day (shared between tickers)
   - Cache TTL: ~39 minutes during market hours (10 requests per ticker per day)

3. **Calculated Tickers**: NHFSMKX98 is calculated from FXAIX price (FXAIX price / 3.43)

### Caching and Refresh Strategy

- **Redis** is used for caching with source-specific TTLs
- Cache key format: `stock-api:{TICKER}` (e.g., `stock-api:AAPL`)
- **Market Hours-Aware**: Cache TTL extends until market opens when closed (including weekends)
- **Smart Refresh**: Background worker automatically refreshes stale data during market hours only
- **Priority Queue**: Most stale data is refreshed first
- **Rate Limiting**:
  - Finnhub: 1 ticker per 2 seconds (30/min, well under 60/min limit)
  - Alpha Vantage: ~39 minutes between refreshes per ticker (during market hours)
- **Exponential Backoff**: On rate limit errors, automatically backs off (2s, 4s, 8s, 16s, max 60s)
- **Non-blocking**: Users always get immediate response (cached data, even if stale)
- **Timestamp Tracking**: All cached data includes `fetchedAt` timestamp for display to users

### Source Routing

The API automatically routes to the appropriate source based on ticker mapping:

- Ticker source mapping is defined in `lib/utils/ticker-source-map.ts`
- FXAIX and VFIAX are mapped to Alpha Vantage
- All other tickers default to Finnhub
- **Single source per ticker** - no mixing of sources
- Easy to extend: just add new entries to the mapping

## Configuration

### Ticker Source Mapping

Configure which tickers use which source in `lib/utils/ticker-source-map.ts`:

```typescript
const TICKER_SOURCE_MAP: Record<string, Source> = {
  FXAIX: "alpha-vantage",
  VFIAX: "alpha-vantage",
  // Add more mappings as needed
};
```

Default is `finnhub` for unmapped tickers.

## Project Structure

```
.
├── server.ts                 # Main Express server
├── lib/
│   ├── db/
│   │   └── redis.ts         # Redis client and cache helpers
│   ├── utils/
│   │   ├── stock-data-fetcher.ts  # Fetches data from appropriate source
│   │   ├── finnhub.ts       # Finnhub API client
│   │   ├── alpha-vantage.ts # Alpha Vantage API client
│   │   ├── ticker-source-map.ts  # Ticker to source mapping
│   │   └── market-hours.ts  # Market hours utility
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Code Quality

This project is configured to automatically:

- **Lint** code before commits (via Husky + lint-staged)
- **Format** code before commits (via Husky + lint-staged)
- **Type-check** on demand with `npm run type-check`

### Pre-commit Hooks

Husky is configured to run lint-staged on pre-commit, which will:

- Run ESLint with auto-fix on staged `.ts`, `.tsx`, `.js`, `.jsx` files
- Run Prettier on staged files

### Manual Validation

Run all checks manually:

```bash
npm run validate
```

## Environment Variables

| Variable                        | Description                                      | Default        |
| ------------------------------- | ------------------------------------------------ | -------------- |
| `PORT`                          | Server port                                      | `3000`         |
| `REDIS_HOST`                    | Redis host                                       | `localhost`    |
| `REDIS_PORT`                    | Redis port                                       | `6379`         |
| `REDIS_URL`                     | Redis connection URL (overrides host/port)       | -              |
| `FINNHUB_API_KEY`               | Finnhub API key (required)                       | -              |
| `ALPHA_VANTAGE_API_KEY`         | Alpha Vantage API key (required for FXAIX/VFIAX) | -              |
| `CACHE_STALE_THRESHOLD_SECONDS` | When to consider cache stale                     | `300` (5 min)  |
| `REFRESH_WORKER_INTERVAL_MS`    | Worker processing interval                       | `2000` (2 sec) |
| `BACKOFF_INITIAL_SECONDS`       | Initial backoff on rate limit error              | `2`            |
| `BACKOFF_MAX_SECONDS`           | Maximum backoff time                             | `60`           |

## Development

### Local Development

1. Start Redis locally (if not using remote Redis):

   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

   Or use your remote Redis by setting `REDIS_URL` in your `.env` file.

2. Start the development server:
   ```bash
   npm run dev
   ```

### Synology Deployment

#### Initial Setup (Using Synology Docker GUI)

1. **Create a new Docker project in Synology:**
   - Open **Docker** app in Synology DSM
   - Go to **Container** → **Project** (or **Stack**)
   - Click **Create** → **Create from docker-compose.yml**
   - Set the **Project name**: `stock-api`
   - Set the **Path**: `/volume1/docker/stock-api` (or your preferred path)
   - Paste the contents of `docker-compose.yml` into the editor
   - Update environment variables if needed (especially `REDIS_URL`, `FINNHUB_API_KEY`, and `ALPHA_VANTAGE_API_KEY`)
   - Click **Create** to start the services

**Note:** The `scrappedTickers.json` configuration file is included in the Docker image, so no manual copying is needed. If you want to update the config file without rebuilding the image, uncomment the `volumes` section in `docker-compose.yml` and copy the file to the mounted directory first.

#### Alternative: Manual Setup (SSH)

If you prefer using SSH:

1. Create directory and copy docker-compose.yml:

   ```bash
   mkdir -p /volume1/docker/stock-api
   # Copy docker-compose.yml to /volume1/docker/stock-api/
   ```

2. Start services:
   ```bash
   cd /volume1/docker/stock-api
   docker-compose up -d
   ```

#### After Initial Setup

Once set up, Watchtower will automatically update your container when new images are pushed to Docker Hub. You only need to manually update the `scrappedTickers.json` file on Synology if you add new tickers.

### Automated Docker Builds with GitHub Actions

This project uses GitHub Actions to automatically build and push Docker images to Docker Hub.

#### Setup

1. **Create Docker Hub Access Token:**
   - Go to https://hub.docker.com/settings/security
   - Click "New Access Token"
   - Give it a name (e.g., "github-actions")
   - Copy the token (you won't see it again!)

2. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Click **Settings** (top navigation bar)
   - In the left sidebar, under **Security**, click **Secrets and variables**
   - From the dropdown, select **Actions**
   - Click **New repository secret** button
   - Add these two secrets:
     - Name: `DOCKER_USERNAME`, Value: `liamngdev`
     - Name: `DOCKER_TOKEN`, Value: Your Docker Hub access token (from step 1)

3. **Workflow:**
   - Push code to `main` branch → GitHub Actions automatically builds and pushes image
   - Image is available at: `liamngdev/stock-api:latest`
   - Watchtower on your server automatically pulls and updates the container

#### Watchtower Auto-Updates

If you're using Watchtower (included in `docker-compose.yml`), it will:

- Check Docker Hub every 30 seconds for new images
- Automatically pull and restart containers when a new `latest` tag is found
- Clean up old images to save space

This means you can simply push code to GitHub, and your production server will automatically update within 30 seconds!

### Adding New Data Sources

1. Create a new API client class in `lib/utils/` (similar to `finnhub.ts` or `alpha-vantage.ts`)
2. Add the source to the `Source` type in `lib/utils/ticker-source-map.ts`
3. Add ticker mappings to `TICKER_SOURCE_MAP` in `lib/utils/ticker-source-map.ts`
4. Update `fetchStockData()` in `lib/utils/stock-data-fetcher.ts` to handle the new source
5. Add cache TTL constants in `constants.ts` if needed

## License

Private
