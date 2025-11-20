import mongoose, { Schema } from "mongoose";

export interface ScraperStockDocument {
  symbol: string;
  price: number;
  source: string;
  queryTime: Date;
}

const ScraperStockSchema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    queryTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    collection: "stock-cached-scrapped",
    timestamps: false,
  }
);

// Compound unique index on symbol + source to allow multiple sources per symbol
ScraperStockSchema.index({ symbol: 1, source: 1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ScraperStock: any =
  mongoose.models.ScraperStock ||
  mongoose.model("ScraperStock", ScraperStockSchema);

export default ScraperStock;
