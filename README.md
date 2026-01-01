# Stock API

A simple Node.js TypeScript API server for fetching stock data from multiple sources (Finnhub, Fidelity, etc.).

## Features

- **Node.js** with Express
- **TypeScript** with strict mode
- **Redis** caching (5-minute TTL)
- **Docker** support with docker-compose
- **Multiple data sources**: Finnhub API and web scrapers (Fidelity)
- **Automatic source routing**: Routes to appropriate source based on ticker configuration

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

# Finnhub API Configuration
FINNHUB_API_KEY=your_finnhub_api_key_here
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
curl http://localhost:3000/stocks?tickers=AAPL,MSFT
```

**Note:** This setup uses a remote Redis service. Make sure `REDIS_URL` is configured in your environment variables.

#### Local Development with Docker

For local development, you can build the image yourself:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

(You would need to create a `docker-compose.dev.yml` with `build: .` instead of `image:`)

## API Endpoints

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### GET /stocks

Get stock data for one or more tickers.

**Query Parameters:**

- `tickers` (required): Comma-separated list of ticker symbols (e.g., `AAPL,MSFT,NHFSMKX98`)

**Response:**

```json
{
  "success": {
    "AAPL": {
      "finnhub": {
        "currentPrice": 150.25,
        "change": 2.5,
        "percentChange": 1.69,
        "highPrice": 151.0,
        "lowPrice": 149.5,
        "openPrice": 149.75,
        "previousClose": 147.75,
        "timestamp": 1704067200
      }
    },
    "NHFSMKX98": {
      "fidelity": {
        "price": 123.45,
        "source": "fidelity",
        "queryTime": "2024-01-01T00:00:00Z"
      }
    }
  },
  "failed": []
}
```

**Example:**

```bash
curl "http://localhost:3000/stocks?tickers=AAPL,MSFT,NHFSMKX98"
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

2. **Fidelity Scraper** (`fidelity`): For tickers configured in `scrappedTickers.json`
   - Web scraping for mutual funds and other instruments not available on Finnhub

### Caching

- **Redis** is used for caching with a 5-minute TTL
- Cache key format: `stock-api:{TICKER}:{SOURCE}` (e.g., `stock-api:AAPL:finnhub`)
- Each source is cached separately for better cache management

### Source Routing

The API automatically routes to the appropriate source:

- Checks `lib/data/scrappedTickers.json` to determine if a ticker should use a scraper
- If found in scrapped tickers, uses the configured scraper (e.g., Fidelity)
- Otherwise, uses Finnhub API
- All sources are tried in parallel, and successful results are merged

## Configuration

### Scrapped Tickers

Configure which tickers use scrapers in `lib/data/scrappedTickers.json`:

```json
{
  "Fidelity": ["NHFSMKX98", "ANOTHER_TICKER"]
}
```

The key is the scraper name (must match a scraper in the registry), and the value is an array of ticker symbols.

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
│   │   ├── scraper.ts       # Base scraper class
│   │   ├── fidelity-scraper.ts   # Fidelity scraper implementation
│   │   ├── scraper-helper.ts     # Scraper utilities
│   │   └── scraper-registry.ts   # Scraper registry
│   └── data/
│       └── scrappedTickers.json  # Ticker-to-scraper mapping
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

| Variable          | Description                                | Default     |
| ----------------- | ------------------------------------------ | ----------- |
| `PORT`            | Server port                                | `3000`      |
| `REDIS_HOST`      | Redis host                                 | `localhost` |
| `REDIS_PORT`      | Redis port                                 | `6379`      |
| `REDIS_URL`       | Redis connection URL (overrides host/port) | -           |
| `FINNHUB_API_KEY` | Finnhub API key (required)                 | -           |

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

#### Initial Setup

1. **Create the data directory on Synology:**

   ```bash
   mkdir -p /volume1/docker/stock-api/data
   ```

2. **Copy the configuration file:**

   ```bash
   cp lib/data/scrappedTickers.json /volume1/docker/stock-api/data/
   ```

3. **Copy docker-compose.yml to Synology:**
   - Upload `docker-compose.yml` to your Synology (e.g., to `/volume1/docker/stock-api/`)
   - Update environment variables in `docker-compose.yml` if needed (especially `REDIS_URL` and `FINNHUB_API_KEY`)

4. **Adjust volume path if needed:**
   - If your Synology uses a different volume (e.g., `/volume2`, `/volumeUSB1`), update the volume path in `docker-compose.yml`
   - The default path is: `/volume1/docker/stock-api/data:/app/lib/data`

5. **Start the services:**
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

### Adding New Scrapers

1. Create a new scraper class extending `BaseScraper` in `lib/utils/`
2. Register it in `lib/utils/scraper-registry.ts`
3. Add tickers to `lib/data/scrappedTickers.json` with the scraper name as the key

## License

Private
