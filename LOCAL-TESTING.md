# Local Testing Guide

## Testing Scrapers Locally

Since `@sparticuz/chromium` is not installed locally (to avoid memory issues), you need to use your local Chrome installation for testing.

### Setup

1. **Create `.env.local` file** (gitignored, safe to create):

```bash
# Point Puppeteer to your local Chrome installation
PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

2. **Start the development server**:

```bash
npm run dev
```

### Testing Scrapers

#### Option 1: Use the Test Endpoint (Recommended)

Visit in your browser or use curl:

```bash
# Test single symbol
curl http://localhost:3000/api/test/scraper?symbol=NHFSMKX98

# Test multiple symbols
curl http://localhost:3000/api/test/scraper?symbol=NHFSMKX98,AAPL,MSFT
```

Or open in browser:

- http://localhost:3000/api/test/scraper?symbol=NHFSMKX98

#### Option 2: Test the Full Cron Endpoint

```bash
# Set your CRON_SECRET in .env.local
echo "CRON_SECRET=your-secret-here" >> .env.local

# Test the full refresh workflow
curl -X POST "http://localhost:3000/api/cron/refresh-stocks?secret=your-secret-here&limit=5"
```

### Troubleshooting

**Error: "Failed to launch browser"**

- Make sure Chrome is installed at the path specified in `PUPPETEER_EXECUTABLE_PATH`
- Try finding Chrome's location:

  ```bash
  # macOS
  ls "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

  # Linux
  which google-chrome
  which chromium-browser
  ```

**Chrome not installed?**

- Download from: https://www.google.com/chrome/
- Or use Chromium: `brew install --cask chromium` (but note the deprecation warning)

### Production vs Local

| Environment | Chromium Source            | Installation                  |
| ----------- | -------------------------- | ----------------------------- |
| **Local**   | Your local Chrome/Chromium | Pre-installed on your machine |
| **Vercel**  | `@sparticuz/chromium` v126 | Installed during deployment   |

**Note:** `@sparticuz/chromium` is installed locally (~120MB) to prevent Next.js build errors, but it's **not used** in local development. The code detects `PUPPETEER_EXECUTABLE_PATH` and uses your local Chrome instead, which is much faster and doesn't consume resources.

### Note

The test endpoint (`/api/test/scraper`) is for development only. It's not included in the OpenAPI spec and should not be used in production.
