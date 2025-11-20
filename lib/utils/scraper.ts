import puppeteer, { Browser, Page } from "puppeteer-core";

// Type-only import to satisfy TypeScript and build analysis
// The actual module is imported dynamically at runtime
type ChromiumModule = typeof import("@sparticuz/chromium");

export interface ScraperResult {
  symbol: string;
  price: number;
  source: string;
  queryTime: Date;
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
 * Get Chromium executable path for serverless environments
 */
async function getChromiumExecutablePath(): Promise<string | undefined> {
  if (isServerlessEnvironment()) {
    try {
      // Use Function constructor to create a truly dynamic import
      // This prevents Turbopack from statically analyzing the import
      const importChromium = new Function(
        'return import("@sparticuz/chromium")'
      );
      const chromium = (await importChromium()) as ChromiumModule;
      const path = chromium.executablePath();
      // Handle both sync and async executablePath
      return typeof path === "string" ? path : await path;
    } catch (error) {
      console.warn(
        "Failed to load @sparticuz/chromium, falling back to default:",
        error
      );
      // In serverless, if chromium is not available, we might need to use system Chrome
      // or handle this error appropriately
    }
  }
  // For local development, puppeteer-core will look for Chrome/Chromium in PATH
  // or use the PUPPETEER_EXECUTABLE_PATH environment variable
  return process.env.PUPPETEER_EXECUTABLE_PATH;
}

/**
 * Get Puppeteer launch arguments for serverless environments
 */
async function getLaunchArgs(): Promise<string[]> {
  const args = ["--no-sandbox", "--disable-setuid-sandbox"];

  if (isServerlessEnvironment()) {
    try {
      // Use Function constructor to create a truly dynamic import
      // This prevents Turbopack from statically analyzing the import
      const importChromium = new Function(
        'return import("@sparticuz/chromium")'
      );
      const chromium = (await importChromium()) as ChromiumModule;
      args.push(...chromium.args);
    } catch (error) {
      console.warn(
        "Failed to load @sparticuz/chromium args, using defaults:",
        error
      );
    }
  }

  return args;
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
      const executablePath = await getChromiumExecutablePath();
      const args = await getLaunchArgs();

      this.browser = await puppeteer.launch({
        headless: true,
        args,
        ...(executablePath && { executablePath }),
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
   * @returns Array of scraper results
   */
  abstract run(symbols: string[]): Promise<ScraperResult[]>;

  /**
   * Execute the scraper with browser lifecycle management
   * @param symbols - Array of stock symbols to scrape
   * @returns Array of scraper results
   */
  async execute(symbols: string[]): Promise<ScraperResult[]> {
    try {
      await this.initBrowser();
      return await this.run(symbols);
    } catch (error) {
      console.error(`Error in scraper ${this.source}:`, error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}
