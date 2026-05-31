/**
 * Some tickers are illiquid or unavailable on Yahoo; proxy to a liquid ETF and scale per-share prices.
 * NHFSMKX98 ≈ VOO × 0.1132; 87267D106 ≈ VOO × 0.357 (user-provided ratios).
 */

const NHFSMKX98 = "NHFSMKX98";
const D87267D106 = "87267D106";

export type SymbolProxyConfig = {
    underlying: string;
    ratio: number;
};

const PROXY_BY_SYMBOL: Record<string, SymbolProxyConfig> = {
    [NHFSMKX98]: { underlying: "VOO", ratio: 0.1132 },
    [D87267D106]: { underlying: "VOO", ratio: 0.357 },
};

/** Yahoo quote fields that are $/share (or $ change) — scale by ratio. Omit percents, volume, marketCap. */
const QUOTE_PRICE_KEYS = [
    "regularMarketPrice",
    "regularMarketOpen",
    "regularMarketDayHigh",
    "regularMarketDayLow",
    "regularMarketPreviousClose",
    "regularMarketChange",
    "bid",
    "ask",
    "fiftyTwoWeekLow",
    "fiftyTwoWeekHigh",
    "preMarketPrice",
    "postMarketPrice",
    "currentPrice",
] as const;

function finiteNumberForScale(v: unknown): number | undefined {
    if (typeof v === "number" && Number.isFinite(v)) {
        return v;
    }
    if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v.replace(/,/g, ""));
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

export function resolveFetchSymbol(requested: string): { fetchSymbol: string; ratio: number } {
    const upper = requested.trim().toUpperCase();
    const cfg = PROXY_BY_SYMBOL[upper];
    if (cfg) {
        return { fetchSymbol: cfg.underlying.toUpperCase(), ratio: cfg.ratio };
    }
    return { fetchSymbol: upper, ratio: 1 };
}

function scaleQuoteObject(
    quote: Record<string, unknown>,
    requestedSymbol: string,
    ratio: number,
): Record<string, unknown> {
    const scaled: Record<string, unknown> = { ...quote };
    for (const key of QUOTE_PRICE_KEYS) {
        const v = finiteNumberForScale(scaled[key]);
        if (v !== undefined) {
            scaled[key] = v * ratio;
        }
    }
    const reg = finiteNumberForScale(scaled.regularMarketPrice);
    const post = finiteNumberForScale(scaled.postMarketPrice);
    const pre = finiteNumberForScale(scaled.preMarketPrice);
    const cur = finiteNumberForScale(scaled.currentPrice);
    if ((reg === undefined || reg <= 0) && post !== undefined && post > 0) {
        scaled.regularMarketPrice = post;
    } else if ((reg === undefined || reg <= 0) && pre !== undefined && pre > 0) {
        scaled.regularMarketPrice = pre;
    } else if ((reg === undefined || reg <= 0) && cur !== undefined && cur > 0) {
        scaled.regularMarketPrice = cur;
    }
    scaled.symbol = requestedSymbol;
    scaled.shortName = requestedSymbol;
    scaled.longName = requestedSymbol;
    return scaled;
}

/**
 * Adjust `fetchAllModules` payload: scale quote prices, relabel symbol/name to the requested ticker.
 * Sets `proxyBy` to the Yahoo symbol used (e.g. VOO) so clients know the quote is synthesized.
 * Other modules (insights, quoteSummary, …) are left unchanged (still VOO).
 */
export function applyPriceProxyToYahooData(
    data: unknown,
    requestedSymbol: string,
    ratio: number,
    proxyBy: string,
): unknown {
    if (data === null || typeof data !== "object") {
        return data;
    }
    const out = structuredClone(data) as Record<string, unknown>;
    out.proxyBy = proxyBy.toUpperCase();
    const quote = out.quote;
    if (quote && typeof quote === "object" && !Array.isArray(quote)) {
        out.quote = scaleQuoteObject(quote as Record<string, unknown>, requestedSymbol, ratio);
    } else if (Array.isArray(quote) && quote.length >= 1 && typeof quote[0] === "object" && quote[0] !== null) {
        out.quote = quote.map((item, i) =>
            i === 0 && typeof item === "object" && item !== null
                ? scaleQuoteObject(item as Record<string, unknown>, requestedSymbol, ratio)
                : item,
        );
    }
    return out;
}
