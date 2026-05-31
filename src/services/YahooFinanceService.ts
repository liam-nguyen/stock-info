import YahooFinance from "yahoo-finance2";

/** Avoid FailedYahooValidationError when Yahoo JSON drifts from yahoo-finance2 schemas (see validation.md). */
const SKIP_YAHOO_SCHEMA = { validateResult: false as const };

export interface YahooModuleData {
    quote: unknown;
    insights: unknown;
    quoteSummary: unknown;
    recommendationsBySymbol: unknown;
    fundamentalsTimeSeries: unknown;
    /** Present when Yahoo returns a non-empty chain (separate from `quoteSummary`). */
    optionChain?: unknown;
}

function hasNonEmptyOptionsPayload(raw: unknown): boolean {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        return false;
    }
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.options) && o.options.length > 0) {
        return true;
    }
    if (Array.isArray(o.expirationDates) && o.expirationDates.length > 0) {
        return true;
    }
    return false;
}

export class YahooFinanceService {
    private readonly client: InstanceType<typeof YahooFinance>;

    constructor() {
        this.client = new YahooFinance();
    }

    quote(symbol: string): Promise<unknown> {
        return this.client.quote(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }

    insights(symbol: string): Promise<unknown> {
        return this.client.insights(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }

    quoteSummary(symbol: string): Promise<unknown> {
        return this.client.quoteSummary(symbol, { modules: "all" }, SKIP_YAHOO_SCHEMA);
    }

    recommendationsBySymbol(symbol: string): Promise<unknown> {
        return this.client.recommendationsBySymbol(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }

    fundamentalsTimeSeries(symbol: string): Promise<unknown> {
        const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return this.client.fundamentalsTimeSeries(
            symbol,
            {
                module: "financials",
                period1: oneYearAgoMs,
                type: "quarterly",
            },
            SKIP_YAHOO_SCHEMA,
        );
    }

    /** Full options chain for an equity underlying (no `date` filter — cache one payload per symbol). */
    options(symbol: string): Promise<unknown> {
        return this.client.options(symbol, undefined, SKIP_YAHOO_SCHEMA);
    }

    async fetchAllModules(symbol: string): Promise<YahooModuleData> {
        const [quote, insights, quoteSummary, recommendationsBySymbol, fundamentalsTimeSeries, optionChainRaw] =
            await Promise.all([
                this.quote(symbol),
                this.insights(symbol),
                this.quoteSummary(symbol),
                this.recommendationsBySymbol(symbol),
                this.fundamentalsTimeSeries(symbol),
                this.options(symbol).catch(() => null),
            ]);

        const optionChain =
            optionChainRaw != null && hasNonEmptyOptionsPayload(optionChainRaw) ? optionChainRaw : undefined;

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
