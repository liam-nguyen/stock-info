"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YahooFinanceService = void 0;
const yahoo_finance2_1 = __importDefault(require("yahoo-finance2"));
/** Avoid FailedYahooValidationError when Yahoo JSON drifts from yahoo-finance2 schemas (see validation.md). */
const SKIP_YAHOO_SCHEMA = { validateResult: false };
function hasNonEmptyOptionsPayload(raw) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        return false;
    }
    const o = raw;
    if (Array.isArray(o.options) && o.options.length > 0) {
        return true;
    }
    if (Array.isArray(o.expirationDates) && o.expirationDates.length > 0) {
        return true;
    }
    return false;
}
class YahooFinanceService {
    client;
    constructor() {
        this.client = new yahoo_finance2_1.default();
    }
    quote(symbol) {
        return this.client.quote(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }
    insights(symbol) {
        return this.client.insights(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }
    quoteSummary(symbol) {
        return this.client.quoteSummary(symbol, { modules: "all" }, SKIP_YAHOO_SCHEMA);
    }
    recommendationsBySymbol(symbol) {
        return this.client.recommendationsBySymbol(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }
    fundamentalsTimeSeries(symbol) {
        const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return this.client.fundamentalsTimeSeries(symbol, {
            module: "financials",
            period1: oneYearAgoMs,
            type: "quarterly",
        }, SKIP_YAHOO_SCHEMA);
    }
    /** Full options chain for an equity underlying (no `date` filter — cache one payload per symbol). */
    options(symbol) {
        return this.client.options(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }
    async fetchAllModules(symbol) {
        const [quote, insights, quoteSummary, recommendationsBySymbol, fundamentalsTimeSeries, optionChainRaw] = await Promise.all([
            this.quote(symbol),
            this.insights(symbol),
            this.quoteSummary(symbol),
            this.recommendationsBySymbol(symbol),
            this.fundamentalsTimeSeries(symbol),
            this.options(symbol).catch(() => null),
        ]);
        const optionChain = optionChainRaw != null && hasNonEmptyOptionsPayload(optionChainRaw) ? optionChainRaw : undefined;
        return {
            quote,
            insights,
            quoteSummary,
            recommendationsBySymbol,
            fundamentalsTimeSeries,
            ...(optionChain !== undefined ? { optionChain } : {}),
        };
    }
}
exports.YahooFinanceService = YahooFinanceService;
