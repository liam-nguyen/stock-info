// Endpoint to write Yahoo Finance stock data to MongoDB

import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";
import dbConnect from "@/lib/db/mongodb";
import YfStock from "@/models/mongodb/yf-stock";
import {
  QuoteSummaryResultSchema,
  InsightsResultSchema,
  ChartResultArraySchema,
  FundamentalsTimeSeriesResultsSchema,
} from "@/lib/models/yahoo-finance-schemas";

export const { POST } = defineRoute({
  operationId: "writeYfStockData",
  method: "POST",
  summary: "Write Yahoo Finance stock data to database",
  description: "Write or update Yahoo Finance stock data in the database",
  tags: ["Stocks", "Database"],
  requestBody: z.object({
    symbol: z.string().describe("Stock ticker symbol"),
    data: z.object({
      quoteSummary: QuoteSummaryResultSchema.describe(
        "Quote summary from Yahoo Finance"
      ),
      insights: InsightsResultSchema.describe("Insights from Yahoo Finance"),
      chart: ChartResultArraySchema.describe("Chart data from Yahoo Finance"),
      fundamentalsTimeSeries: z
        .object({
          allQuarterly: FundamentalsTimeSeriesResultsSchema.describe(
            "Quarterly financial data"
          ),
          allAnnual: FundamentalsTimeSeriesResultsSchema.describe(
            "Annual financial data"
          ),
          allTrailing: FundamentalsTimeSeriesResultsSchema.describe(
            "Trailing 12-month financial data"
          ),
        })
        .describe("Financial statements data"),
    }),
  }),
  action: async ({ body }) => {
    const { symbol, data } = body;

    try {
      await dbConnect();

      const queryTime = new Date();

      await YfStock.findOneAndUpdate(
        { symbol },
        {
          symbol,
          quoteSummary: data.quoteSummary,
          insights: data.insights,
          chart: data.chart,
          fundamentalsTimeSeries: data.fundamentalsTimeSeries,
          queryTime,
        },
        { upsert: true, new: true }
      );

      return Response.json({
        success: true,
        message: `Stock data for ${symbol} saved successfully`,
        queryTime: queryTime.toISOString(),
      });
    } catch (error) {
      console.error("Error saving stock data:", error);
      return Response.json(
        {
          success: false,
          error: "Failed to save stock data",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: {
      description: "Stock data saved successfully",
      content: z.object({
        success: z.boolean().describe("Operation success status"),
        message: z.string().describe("Success message"),
        queryTime: z
          .string()
          .describe("Time when data was saved (ISO 8601 format)"),
      }),
    },
    500: {
      description: "Error saving stock data",
      content: z.object({
        success: z.boolean().describe("Operation success status"),
        error: z.string().describe("Error type"),
        message: z.string().describe("Error message"),
      }),
    },
  },
});
