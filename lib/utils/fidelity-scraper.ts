import { BaseScraper, ScraperResult } from "./scraper";

/**
 * Scraper for Fidelity mutual fund pages
 * Extends BaseScraper to scrape stock prices from Fidelity's fund research pages
 */
export class FidelityScraper extends BaseScraper {
  constructor() {
    super("fidelity");
  }

  /**
   * Scrapes Fidelity mutual fund pages for stock prices
   * @param symbols - Array of stock symbols to scrape
   * @returns Array of scraper results
   */
  async run(symbols: string[]): Promise<ScraperResult[]> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    const results: ScraperResult[] = [];

    // Set user agent to avoid bot detection
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Process symbols sequentially to avoid overwhelming the server
    for (const symbol of symbols) {
      try {
        const url = `https://fundresearch.fidelity.com/mutual-funds/summary/${symbol}?appcode=529`;

        // Navigate to the page and wait for the content to load
        await this.page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Wait for the price element to appear
        try {
          await this.page.waitForSelector(
            ".mfl-daily-info-snapshot .value-column.font-xxl.label",
            { timeout: 10000 }
          );
        } catch {
          console.error(
            `Price element did not appear for ${symbol} on Fidelity page`
          );
          continue; // Skip this symbol and continue with next
        }

        // Extract the price text
        const priceText = await this.page.evaluate(() => {
          const element = document.querySelector(
            ".mfl-daily-info-snapshot .value-column.font-xxl.label"
          );
          return element?.textContent?.trim() || null;
        });

        if (!priceText) {
          console.error(`Could not extract price text for ${symbol}`);
          continue; // Skip this symbol and continue with next
        }

        // Remove any currency symbols, commas, and parse as number
        const price = parseFloat(
          priceText.replace(/[$,]/g, "").replace(/[^\d.-]/g, "")
        );

        if (isNaN(price)) {
          console.error(`Could not parse price "${priceText}" for ${symbol}`);
          continue; // Skip this symbol and continue with next
        }

        const stockData: ScraperResult = {
          symbol: symbol.toUpperCase(),
          price,
          source: this.source,
          queryTime: new Date(),
        };

        results.push(stockData);
      } catch (error) {
        console.error(`Error scraping Fidelity for ${symbol}:`, error);
        // Continue with next symbol even if this one fails
      }
    }

    return results;
  }
}
