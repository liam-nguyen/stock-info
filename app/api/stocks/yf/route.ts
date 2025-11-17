// This route is a wrapper around the Yahoo Finance API used to get stock data from Yahoo Finance

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import {
  QuoteSummaryResultSchema,
  InsightsResultSchema,
  ChartResultArraySchema,
  FundamentalsTimeSeriesResultsSchema,
} from "@/lib/models/yahoo-finance-schemas";

export const { POST } = defineRoute({
  operationId: "getStocksDataFromYahooFinance",
  method: "POST",
  summary: "Get stocks' data from Yahoo Finance",
  description: "Get stocks data from Yahoo Finance",
  tags: ["Stocks", "Yahoo Finance"],
  requestBody: z.object({
    symbols: z
      .array(z.string())
      .describe("Symbols of the stocks to get data for"),
  }),
  action: async ({ body }, request) => {
    const symbols = body.symbols;

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    // Query in parallels to get the data for all stocks symbols
    const failedToFetchSymbols: string[] = [];
    const stocksData = await Promise.all(
      symbols.map(async (symbol) => {
        const response = await fetch(`${baseUrl}/api/stocks/yf/${symbol}`);
        if (response.ok) {
          return response.json();
        } else {
          failedToFetchSymbols.push(symbol);
        }
      })
    );

    return Response.json({
      stocksData,
      failedToFetchSymbols,
    });
  },
  responses: {
    200: {
      description: "Stock data retrieved successfully",
      content: z.object({
        stocksData: z
          .array(
            z.record(
              z.string(),
              z.object({
                quoteSummary: QuoteSummaryResultSchema.describe(
                  "Quote summary from Yahoo Finance"
                ),
                insights: InsightsResultSchema.describe(
                  "Insights from Yahoo Finance"
                ),
                chart: ChartResultArraySchema.describe(
                  "Chart data from Yahoo Finance"
                ),
                fundamentalsTimeSeries: z
                  .object({
                    allQuarterly: FundamentalsTimeSeriesResultsSchema.describe(
                      "Quarterly financial data (balance-sheet, financials, cash-flow) from fundamentalsTimeSeries"
                    ),
                    allAnnual: FundamentalsTimeSeriesResultsSchema.describe(
                      "Annual financial data (balance-sheet, financials, cash-flow) from fundamentalsTimeSeries"
                    ),
                    allTrailing: FundamentalsTimeSeriesResultsSchema.describe(
                      "Trailing 12-month financial data (balance-sheet, financials, cash-flow) from fundamentalsTimeSeries"
                    ),
                  })
                  .describe(
                    "Financial statements data (replaces deprecated balanceSheetHistory, incomeStatementHistory, cashflowStatementHistory modules)"
                  ),
              })
            )
          )
          .describe("Array of stock data objects, each keyed by symbol"),
        failedToFetchSymbols: z
          .array(z.string())
          .describe("Array of symbols that failed to fetch"),
      }),
    },
  },
});
