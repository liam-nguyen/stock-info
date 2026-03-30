import YahooFinance from "yahoo-finance2";

export interface YahooModuleData {
    quote: unknown;
    insights: unknown;
    quoteSummary: unknown;
    recommendationsBySymbol: unknown;
    fundamentalsTimeSeries: unknown;
}

export class YahooFinanceService {
    private readonly client: InstanceType<typeof YahooFinance>;

    constructor() {
        this.client = new YahooFinance();
    }

    quote(symbol: string): Promise<unknown> {
        return this.client.quote(symbol);
    }

    insights(symbol: string): Promise<unknown> {
        return this.client.insights(symbol);
    }

    quoteSummary(symbol: string): Promise<unknown> {
        return this.client.quoteSummary(symbol, { modules: "all" }, { validateResult: false });
    }

    recommendationsBySymbol(symbol: string): Promise<unknown> {
        return this.client.recommendationsBySymbol(symbol);
    }

    fundamentalsTimeSeries(symbol: string): Promise<unknown> {
        const oneYearAgoMs = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return this.client.fundamentalsTimeSeries(symbol, {
            module: "financials",
            period1: oneYearAgoMs,
            type: "quarterly",
        });
    }

    async fetchAllModules(symbol: string): Promise<YahooModuleData> {
        const [quote, insights, quoteSummary, recommendationsBySymbol, fundamentalsTimeSeries] =
            await Promise.all([
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
