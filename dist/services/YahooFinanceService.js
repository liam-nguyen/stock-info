"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YahooFinanceService = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
class YahooFinanceService {
    client;
    constructor() {
        this.client = new yahoo_finance2_1.default();
    }
    quote(symbol) {
        return this.client.quote(symbol);
    }
    insights(symbol) {
        return this.client.insights(symbol);
    }
    quoteSummary(symbol) {
        return this.client.quoteSummary(symbol, { modules: "all" }, { validateResult: false });
    }
    recommendationsBySymbol(symbol) {
        return this.client.recommendationsBySymbol(symbol);
    }
    fundamentalsTimeSeries(symbol) {
        const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return this.client.fundamentalsTimeSeries(symbol, {
            module: "financials",
            period1: oneYearAgoMs,
            type: "quarterly",
        });
    }
    async fetchAllModules(symbol) {
        const [quote, insights, quoteSummary, recommendationsBySymbol, fundamentalsTimeSeries] = await Promise.all([
            this.quote(symbol),
            this.insights(symbol),
            this.quoteSummary(symbol),
            this.recommendationsBySymbol(symbol),
            this.fundamentalsTimeSeries(symbol),
        ]);
        return {
            quote,
            insights,
            quoteSummary,
            recommendationsBySymbol,
            fundamentalsTimeSeries,
        };
    }
}
exports.YahooFinanceService = YahooFinanceService;
