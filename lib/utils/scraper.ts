import puppeteer, { Browser, Page } from "puppeteer";

export interface ScraperResult {
  symbol: string;
  price: number;
  source: string;
  queryTime: Date;
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
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
