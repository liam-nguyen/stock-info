/**
 * Price extractor utilities for different data sources
 * Each extractor function extracts the current price from a source's data structure
 */

export interface PriceResult {
  price: number;
  source: string;
}

/**
 * Extract price from Yahoo Finance data structure
 * @param data - Yahoo Finance data object with quoteSummary
 * @returns PriceResult with price and source, or null if price not found
 */
export function extractPriceFromYf(data: unknown): PriceResult | null {
  try {
    if (!data || typeof data !== "object" || !("quoteSummary" in data)) {
      return null;
    }

    const dataObj = data as { quoteSummary?: unknown };
    if (
      !dataObj.quoteSummary ||
      typeof dataObj.quoteSummary !== "object" ||
      !("price" in dataObj.quoteSummary)
    ) {
      return null;
    }

    const quoteSummary = dataObj.quoteSummary as { price?: unknown };
    if (!quoteSummary.price || typeof quoteSummary.price !== "object") {
      return null;
    }

    const priceData = quoteSummary.price as {
      postMarketPrice?: number;
      preMarketPrice?: number;
      regularMarketPrice?: number;
    };

    // Priority order: regularMarketPrice > postMarketPrice > preMarketPrice
    // Use postMarketPrice if market is closed and post-market data is available
    // Use preMarketPrice if market hasn't opened yet
    // Otherwise use regularMarketPrice

    if (
      priceData.postMarketPrice != null &&
      priceData.postMarketPrice !== undefined
    ) {
      return {
        price: priceData.postMarketPrice,
        source: "yf",
      };
    }

    if (
      priceData.preMarketPrice != null &&
      priceData.preMarketPrice !== undefined
    ) {
      return {
        price: priceData.preMarketPrice,
        source: "yf",
      };
    }

    if (
      priceData.regularMarketPrice != null &&
      priceData.regularMarketPrice !== undefined
    ) {
      return {
        price: priceData.regularMarketPrice,
        source: "yf",
      };
    }

    return null;
  } catch (error) {
    console.error("Error extracting price from YF data:", error);
    return null;
  }
}

/**
 * Extract price from scraper data structure
 * @param data - Scraper data object
 * @returns PriceResult with price and source, or null if price not found
 */
export function extractPriceFromScraper(data: unknown): PriceResult | null {
  try {
    // Placeholder for future scraper implementation
    // TODO: Implement scraper price extraction when scraper source is added
    if (
      !data ||
      typeof data !== "object" ||
      !("price" in data) ||
      typeof (data as { price: unknown }).price !== "number"
    ) {
      return null;
    }

    return {
      price: (data as { price: number }).price,
      source: "scraper",
    };
  } catch (error) {
    console.error("Error extracting price from scraper data:", error);
    return null;
  }
}

/**
 * Extract price from a source's data structure
 * Routes to the appropriate extractor based on source name
 * @param source - Source name (e.g., "yf", "scraper")
 * @param data - Data object from the source
 * @returns PriceResult with price and source, or null if price not found
 */
export function extractPriceFromSource(
  source: string,
  data: unknown
): PriceResult | null {
  switch (source.toLowerCase()) {
    case "yf":
    case "yahoo":
    case "yahoofinance":
      return extractPriceFromYf(data);
    case "scraper":
    case "web":
    case "webscraper":
      return extractPriceFromScraper(data);
    default:
      console.warn(`Unknown source for price extraction: ${source}`);
      return null;
  }
}
