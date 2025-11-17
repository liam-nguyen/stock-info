import mongoose, { Schema } from "mongoose";
import { QuoteSummaryResult } from "yahoo-finance2/modules/quoteSummary";
import { InsightsResult } from "yahoo-finance2/modules/insights";
import { ChartResultArray } from "yahoo-finance2/modules/chart";
import { FundamentalsTimeSeriesResult } from "yahoo-finance2/modules/fundamentalsTimeSeries";

export interface YfStockDocument {
  symbol: string;
  quoteSummary: QuoteSummaryResult;
  insights: InsightsResult;
  chart: ChartResultArray;
  fundamentalsTimeSeries: {
    allQuarterly: FundamentalsTimeSeriesResult[];
    allAnnual: FundamentalsTimeSeriesResult[];
    allTrailing: FundamentalsTimeSeriesResult[];
  };
  queryTime: Date;
}

const YfStockSchema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quoteSummary: {
      type: Schema.Types.Mixed,
      required: true,
    },
    insights: {
      type: Schema.Types.Mixed,
      required: true,
    },
    chart: {
      type: Schema.Types.Mixed,
      required: true,
    },
    fundamentalsTimeSeries: {
      type: {
        allQuarterly: [Schema.Types.Mixed],
        allAnnual: [Schema.Types.Mixed],
        allTrailing: [Schema.Types.Mixed],
      },
      required: true,
    },
    queryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "stock-cached-yf",
    timestamps: false,
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const YfStock: any =
  mongoose.models.YfStock || mongoose.model("YfStock", YfStockSchema);

export default YfStock;
