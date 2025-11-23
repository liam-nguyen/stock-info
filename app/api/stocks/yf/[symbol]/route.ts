// This route use Yahoo Finance API v2 to get stock details

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import YahooFinance from "yahoo-finance2";
import { QuoteSummaryResult } from "yahoo-finance2/modules/quoteSummary";
import { InsightsResult } from "yahoo-finance2/modules/insights";
import { ChartResultArray } from "yahoo-finance2/modules/chart";
import { FundamentalsTimeSeriesResult } from "yahoo-finance2/modules/fundamentalsTimeSeries";
import {
  QuoteSummaryResultSchema,
  InsightsResultSchema,
  ChartResultArraySchema,
  FundamentalsTimeSeriesResultsSchema,
} from "@/lib/models/yahoo-finance-schemas";

export const { GET } = defineRoute({
  operationId: "getStockDetailsFromYahooFinance",
  method: "GET",
  summary: "Get stock details from Yahoo Finance",
  description: "Get stock details from Yahoo Finance",
  tags: ["Stocks", "Yahoo Finance"],
  pathParams: z.object({
    symbol: z.string().describe("Stock ticker symbol"),
  }),
  action: async ({ pathParams }) => {
    const symbol = pathParams.symbol;

    try {
      const yf = new YahooFinance({
        suppressNotices: ["yahooSurvey"],
      });

      // Get financial statements using fundamentalsTimeSeries (replaces the deprecated modules)
      // Fetch data for the last 5 years
      const period1 = new Date();
      period1.setFullYear(period1.getFullYear() - 5);

      // Parallelize all API calls for better performance
      const [
        quoteSummary,
        allQuarterly,
        allAnnual,
        allTrailing,
        insights,
        chart,
      ] = await Promise.all([
        yf.quoteSummary(
          symbol,
          {
            modules: [
              "assetProfile",
              "calendarEvents",
              "defaultKeyStatistics",
              "earnings",
              "earningsHistory",
              "earningsTrend",
              "financialData",
              "fundOwnership",
              "fundPerformance",
              "fundProfile",
              "indexTrend",
              "industryTrend",
              "insiderHolders",
              "insiderTransactions",
              "institutionOwnership",
              "majorDirectHolders",
              "majorHoldersBreakdown",
              "netSharePurchaseActivity",
              "price",
              "quoteType",
              "recommendationTrend",
              "secFilings",
              "sectorTrend",
              "summaryDetail",
              "summaryProfile",
              "topHoldings",
              "upgradeDowngradeHistory",
            ],
          },
          { validateResult: false }
        ) as Promise<QuoteSummaryResult>,
        yf.fundamentalsTimeSeries(
          symbol,
          {
            period1,
            type: "quarterly",
            module: "all",
          },
          { validateResult: false }
        ) as Promise<FundamentalsTimeSeriesResult[]>,
        yf.fundamentalsTimeSeries(
          symbol,
          {
            period1,
            type: "annual",
            module: "all",
          },
          { validateResult: false }
        ) as Promise<FundamentalsTimeSeriesResult[]>,
        yf.fundamentalsTimeSeries(
          symbol,
          {
            period1,
            type: "trailing",
            module: "all",
          },
          { validateResult: false }
        ) as Promise<FundamentalsTimeSeriesResult[]>,
        yf.insights(
          symbol,
          {
            lang: "en-US",
            reportsCount: 1000,
            region: "US",
          },
          { validateResult: false }
        ) as Promise<InsightsResult>,
        yf.chart(
          symbol,
          {
            period1: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5), // 5 years ago
            period2: new Date(), // today
            interval: "1d", // 1 day interval
            return: "array",
          },
          { validateResult: false }
        ) as Promise<ChartResultArray>,
      ]);

      return Response.json({
        [symbol]: {
          quoteSummary,
          insights,
          chart,
          fundamentalsTimeSeries: {
            allQuarterly,
            allAnnual,
            allTrailing,
          },
        },
      });
    } catch (error) {
      console.error(`Error fetching data for symbol ${symbol}:`, error);

      // Check if it's a 404 error (symbol not found)
      if (
        error instanceof Error &&
        (error.message.includes("Not Found") ||
          error.message.includes("No data found") ||
          error.message.includes("404"))
      ) {
        return Response.json(
          {
            error: `Symbol ${symbol} not found`,
            message: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 404 }
        );
      }

      // For other errors, return 500
      return Response.json(
        {
          error: "Failed to fetch stock data",
          message: error instanceof Error ? error.message : "Unknown error",
          symbol,
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: "Stock details retrieved successfully",
      content: z.record(
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
      ),
    },
    404: {
      description: "Stock not found",
      content: z.object({
        error: z.string().describe("Error message"),
        message: z.string().optional().describe("Detailed error message"),
      }),
    },
    500: {
      description: "Error fetching stock data",
      content: z.object({
        error: z.string().describe("Error type"),
        message: z.string().optional().describe("Detailed error message"),
        symbol: z.string().optional().describe("Stock symbol"),
      }),
    },
  },
});
