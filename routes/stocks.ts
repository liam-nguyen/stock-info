import express from "express";
import { getCachedStock, setCachedStock } from "../lib/db/redis";
import { fetchStockData } from "../lib/utils/stock-data-fetcher";

const router = express.Router();

router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const tickersParam = req.query.tickers;

    if (!tickersParam) {
      return res.status(400).json({
        error: "tickers parameter is required",
      });
    }

    // Parse tickers - support both comma-separated string and array
    let tickers: string[];
    if (Array.isArray(tickersParam)) {
      tickers = tickersParam.map((t) => String(t).toUpperCase().trim());
    } else {
      tickers = String(tickersParam)
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t.length > 0);
    }

    if (tickers.length === 0) {
      return res.status(400).json({
        error: "At least one ticker is required",
      });
    }

    const success: Record<string, Record<string, unknown>> = {};
    const failed: string[] = [];

    // Process each ticker
    for (const ticker of tickers) {
      try {
        // Check if ticker is cached
        let tickerData = await getCachedStock(ticker);

        // If not cached, fetch from all sources
        if (!tickerData) {
          const fetchedData = await fetchStockData(ticker);
          if (fetchedData) {
            tickerData = fetchedData;
            // Cache all sources together
            await setCachedStock(ticker, tickerData);
          } else {
            failed.push(ticker);
            continue;
          }
        }

        if (tickerData && Object.keys(tickerData).length > 0) {
          success[ticker] = tickerData;
        } else {
          failed.push(ticker);
        }
      } catch (error) {
        console.error(`Error processing ticker ${ticker}:`, error);
        failed.push(ticker);
      }
    }

    return res.json({
      success,
      failed,
    });
  } catch (error) {
    console.error("Error in /stocks endpoint:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

export default router;
