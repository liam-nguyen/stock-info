import { z } from "zod";

export const StockDTO = z.object({
  symbol: z.string().describe("Stock ticker symbol"),
  name: z.string().describe("Company name"),
  price: z.number().describe("Current stock price"),
  change: z.number().describe("Price change from previous close"),
  changePercent: z.number().describe("Percentage change from previous close"),
  volume: z.number().describe("Trading volume"),
  marketCap: z.number().optional().describe("Market capitalization"),
  lastUpdated: z.string().describe("Last update timestamp"),
});

export type StockDTO = z.infer<typeof StockDTO>;

export const StockQueryParams = z.object({
  symbol: z.string().optional().describe("Filter by stock symbol"),
  limit: z.string().optional().describe("Maximum number of results to return"),
});
