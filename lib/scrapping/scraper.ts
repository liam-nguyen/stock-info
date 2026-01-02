import puppeteer, { Browser, Page } from "puppeteer-core";
import fs from "fs";

// Type-only import to satisfy TypeScript and build analysis
// The actual module is imported dynamically at runtime
type ChromiumModule = typeof import("@sparticuz/chromium");

// Helper to load chromium module - tries multiple methods
async function loadChromium(): Promise<ChromiumModule | null> {
  // Skip loading in local development if PUPPETEER_EXECUTABLE_PATH is set
  // But use it in Docker or serverless environments
  if (
    !isServerlessEnvironment() &&
    !isDockerEnvironment() &&
    process.env.PUPPETEER_EXECUTABLE_PATH
  ) {
    console.log("Using local Chrome, skipping @sparticuz/chromium");
    return null;
  }

  try {
    // Dynamic import - package is installed as optionalDependency
    return await import("@sparticuz/chromium");
  } catch (error) {
    console.error("Failed to load @sparticuz/chromium:", error);
    return null;
  }
}

export interface ScraperResult {
  symbol: string;
  price: number;
  source: string;
  queryTime: Date;
}

/**
 * Normalized stock data format that matches GraphQL schema
 * This is what gets cached and returned to the resolver
 */
export interface NormalizedStockData {
  price?: number;
  currentPrice?: number;
  change?: number;
  percentChange?: number;
  highPrice?: number;
  lowPrice?: number;
  openPrice?: number;
  previousClose?: number;
  timestamp?: number;
  queryTime?: string;
}

/**
 * Check if running in AWS Lambda or similar serverless environment
 */
function isServerlessEnvironment(): boolean {
  return (
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.VERCEL ||
    !!process.env.AWS_EXECUTION_ENV ||
    !!process.env.LAMBDA_TASK_ROOT
  );
}

/**
 * Check if running in Docker container
 */
function isDockerEnvironment(): boolean {
  if (process.env.DOCKER_CONTAINER) {
    return true;
  }

  try {
    // Check for /.dockerenv file (Docker creates this)
    if (fs.existsSync("/.dockerenv")) {
      return true;
    }

    // Check /proc/self/cgroup for docker
    if (fs.existsSync("/proc/self/cgroup")) {
      const cgroup = fs.readFileSync("/proc/self/cgroup", "utf-8");
      if (cgroup.includes("docker")) {
        return true;
      }
    }
  } catch {
    // If we can't check, assume not Docker
  }

  return false;
}

/**
 * Get Chromium configuration for serverless and Docker environments
 */
async function getChromiumConfig(): Promise<{
  executablePath?: string;
  args: string[];
  headless: boolean;
}> {
  // In Docker, prefer system Chromium (installed via apk)
  if (isDockerEnvironment()) {
    // Check for system Chromium first (Alpine Linux)
    const systemChromiumPaths = [
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/chrome",
    ];

    for (const chromiumPath of systemChromiumPaths) {
      if (fs.existsSync(chromiumPath)) {
        console.log(`Using system Chromium in Docker: ${chromiumPath}`);
        return {
          executablePath: chromiumPath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-software-rasterizer",
            "--disable-extensions",
          ],
          headless: true,
        };
      }
    }

    // Fallback to @sparticuz/chromium if system Chromium not found
    console.log("System Chromium not found, trying @sparticuz/chromium...");
    const chromium = await loadChromium();
    if (chromium) {
      try {
        const executablePath = await chromium.executablePath();
        console.log("Using Chromium from @sparticuz/chromium:", executablePath);

        if (fs.existsSync(executablePath)) {
          return {
            executablePath,
            args: chromium.args,
            headless: chromium.headless,
          };
        } else {
          console.error(
            `@sparticuz/chromium executable not found at: ${executablePath}`
          );
        }
      } catch (error) {
        console.error("Failed to load @sparticuz/chromium:", error);
      }
    }

    throw new Error(
      "No Chromium executable found in Docker. " +
        "Make sure Chromium is installed via 'apk add chromium' in Dockerfile."
    );
  }

  // Use @sparticuz/chromium in serverless environments
  if (isServerlessEnvironment()) {
    const chromium = await loadChromium();
    if (chromium) {
      try {
        const executablePath = await chromium.executablePath();
        console.log("Using Chromium from @sparticuz/chromium:", executablePath);
        return {
          executablePath,
          args: chromium.args,
          headless: chromium.headless,
        };
      } catch (error) {
        console.error(
          "Failed to load @sparticuz/chromium configuration:",
          error
        );
      }
    }
  }

  // Fallback for local development
  return {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    headless: true,
  };
}

/**
 * Base scraper class that manages Puppeteer browser instance
 * Child classes extend this and implement the run() method
 */
export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  public readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Initialize browser and page
   */
  protected async initBrowser(): Promise<void> {
    if (!this.browser) {
      const config = await getChromiumConfig();

      // In serverless or Docker environments, we must have an executablePath
      if (
        (isServerlessEnvironment() || isDockerEnvironment()) &&
        !config.executablePath
      ) {
        throw new Error(
          "Chromium executable path is required in serverless/Docker environment. " +
            "Make sure @sparticuz/chromium is installed and available."
        );
      }

      this.browser = await puppeteer.launch({
        headless: config.headless,
        args: config.args,
        ...(config.executablePath && { executablePath: config.executablePath }),
      });
    }
    if (!this.page) {
      this.page = await this.browser.newPage();
    }
  }

  /**
   * Close browser and cleanup
   */
  protected async closeBrowser(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Abstract method that child classes must implement
   * Should return scraper results for the given symbols
   * @param symbols - Array of stock symbols to scrape
   * @param urlMap - Optional map of symbol to URL (from config)
   * @returns Array of scraper results
   */
  abstract run(
    symbols: string[],
    urlMap?: Map<string, string>
  ): Promise<ScraperResult[]>;

  /**
   * Transform scraper result to normalized format for GraphQL
   * Override this method in child classes if custom transformation is needed
   * @param result - Scraper result
   * @returns Normalized stock data
   */
  normalizeResult(result: ScraperResult): NormalizedStockData {
    return {
      price: result.price,
      // Scrapers typically don't have change/percentChange, so leave them undefined
      queryTime: result.queryTime.toISOString(),
    };
  }

  /**
   * Execute the scraper with browser lifecycle management
   * @param symbols - Array of stock symbols to scrape
   * @param urlMap - Optional map of symbol to URL (from config)
   * @returns Array of scraper results
   */
  async execute(
    symbols: string[],
    urlMap?: Map<string, string>
  ): Promise<ScraperResult[]> {
    try {
      await this.initBrowser();
      return await this.run(symbols, urlMap);
    } catch (error) {
      console.error(`Error in scraper ${this.source}:`, error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}
