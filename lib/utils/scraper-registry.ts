import { BaseScraper } from "./scraper";
import { FidelityScraper } from "./fidelity-scraper";

/**
 * Type for a concrete scraper class that extends BaseScraper
 */
type ScraperClassConstructor = new () => BaseScraper;

/**
 * Registry mapping scraper names to their class constructors
 * Add new scrapers here as they are created
 */
const scraperRegistry: Record<string, ScraperClassConstructor> = {
  Fidelity: FidelityScraper,
};

/**
 * Get a scraper class by name
 * @param scraperName - Name of the scraper (e.g., "Fidelity")
 * @returns The scraper class constructor, or null if not found
 */
export function getScraperClass(
  scraperName: string
): ScraperClassConstructor | null {
  return scraperRegistry[scraperName] || null;
}
