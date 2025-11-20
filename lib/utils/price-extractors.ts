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
 * @param data - Scraper data object (can be nested by source name or flat)
 * @returns PriceResult with price and source, or null if price not found
 */
export function extractPriceFromScraper(data: unknown): PriceResult | null {
  try {
    if (!data || typeof data !== "object") {
      return null;
    }

    // Handle nested structure: { "fidelity": { price, source, queryTime } }
    // or flat structure: { price, source, queryTime }
    const dataObj = data as Record<string, unknown>;

    // Check if it's a nested structure (object with source names as keys)
    const keys = Object.keys(dataObj);
    if (
      keys.length > 0 &&
      typeof dataObj[keys[0]] === "object" &&
      dataObj[keys[0]] !== null
    ) {
      // It's nested - get the first source's data
      const firstSourceData = dataObj[keys[0]] as Record<string, unknown>;
      if (
        "price" in firstSourceData &&
        typeof firstSourceData.price === "number"
      ) {
        // Use the source name from the nested key, or fall back to the source field
        const sourceName = (firstSourceData.source as string) || keys[0];
        return {
          price: firstSourceData.price as number,
          source: sourceName,
        };
      }
    }

    // Handle flat structure: { price, source, queryTime }
    if ("price" in dataObj && typeof dataObj.price === "number") {
      return {
        price: dataObj.price as number,
        source: (dataObj.source as string) || "scraper",
      };
    }

    return null;
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
