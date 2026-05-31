import { Router } from "express";
import { getOptionContractQuote, getOptionsChain } from "../services/optionsService";

/** Equity underlying — same as stock route (short tickers). */
const UNDERLYING_SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,10}$/;

/** OCC option root symbol (uppercase alphanumerics; length varies by series). */
const OCC_OPTION_SYMBOL_PATTERN = /^[A-Z0-9]{15,24}$/;

const normalizeSymbols = (rawSymbols: unknown): string[] => {
    if (typeof rawSymbols !== "string" || rawSymbols.trim() === "") {
        return [];
    }

    return Array.from(
        new Set(
            rawSymbols
                .split(",")
                .map((symbol) => symbol.trim().toUpperCase())
                .filter((symbol) => symbol.length > 0),
        ),
    );
};

/** Normalize optional `expiration` query to YYYY-MM-DD for comparison. */
function parseExpirationDay(raw: unknown): string | null {
    if (raw === undefined || raw === null) {
        return null;
    }
    if (typeof raw !== "string" || raw.trim() === "") {
        return null;
    }
    const s = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function dayFromExpirationValue(exp: unknown): string | null {
    if (exp === undefined || exp === null) {
        return null;
    }
    if (typeof exp === "string") {
        if (/^\d{4}-\d{2}-\d{2}/.test(exp)) {
            return exp.slice(0, 10);
        }
        const d = new Date(exp);
        if (!Number.isNaN(d.getTime())) {
            return d.toISOString().slice(0, 10);
        }
    }
    if (typeof exp === "number" && Number.isFinite(exp)) {
        return new Date(exp).toISOString().slice(0, 10);
    }
    if (exp instanceof Date && !Number.isNaN(exp.getTime())) {
        return exp.toISOString().slice(0, 10);
    }
    return null;
}

/** Filter full chain payload to one expiration (presentation-only; does not change cache). */
function filterChainDataByExpirationDay(data: unknown, day: string): unknown {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
        return data;
    }
    const d = data as Record<string, unknown>;
    const opts = d.options;
    if (!Array.isArray(opts)) {
        return data;
    }
    const filtered = opts.filter((o) => {
        if (o === null || typeof o !== "object") {
            return false;
        }
        const row = o as Record<string, unknown>;
        const exp = row.expirationDate ?? row.expiration;
        const rowDay = dayFromExpirationValue(exp);
        return rowDay === day;
    });
    return { ...d, options: filtered };
}

export const optionsRouter = Router();

optionsRouter.get("/", async (req, res, next) => {
    try {
        const symbols = normalizeSymbols(req.query.symbols);

        if (symbols.length === 0) {
            return res.status(400).json({
                error: "Query parameter 'symbols' is required, e.g. /options?symbols=AAPL,MSFT",
            });
        }

        const invalidSymbols = symbols.filter((symbol) => !UNDERLYING_SYMBOL_PATTERN.test(symbol));
        if (invalidSymbols.length > 0) {
            return res.status(400).json({
                error: "Some symbols are invalid.",
                invalidSymbols,
            });
        }

        const expirationDay = parseExpirationDay(req.query.expiration);
        if (req.query.expiration !== undefined && req.query.expiration !== null && req.query.expiration !== "") {
            if (!expirationDay) {
                return res.status(400).json({
                    error: "Query parameter 'expiration' must be a date (e.g. YYYY-MM-DD).",
                });
            }
        }

        const results = await Promise.all(symbols.map((symbol) => getOptionsChain(symbol)));
        const shaped =
            expirationDay === null
                ? results
                : results.map((r) =>
                      r.data !== undefined
                          ? {
                                ...r,
                                data: filterChainDataByExpirationDay(r.data, expirationDay),
                            }
                          : r,
                  );

        return res.status(200).json({
            count: shaped.length,
            results: shaped,
        });
    } catch (error) {
        return next(error);
    }
});

optionsRouter.get("/contract", async (req, res, next) => {
    try {
        const rawSymbols = req.query.symbols;
        if (typeof rawSymbols === "string" && rawSymbols.trim() !== "") {
            const symbols = normalizeSymbols(rawSymbols);
            if (symbols.length === 0) {
                return res.status(400).json({
                    error: "Query parameter 'symbols' must list at least one OCC, e.g. /options/contract?symbols=OCC1,OCC2",
                });
            }
            const invalidSymbols = symbols.filter((s) => !OCC_OPTION_SYMBOL_PATTERN.test(s));
            if (invalidSymbols.length > 0) {
                return res.status(400).json({
                    error: "Some option symbols are invalid.",
                    invalidSymbols,
                });
            }
            const results = await Promise.all(symbols.map((symbol) => getOptionContractQuote(symbol)));
            return res.status(200).json({
                count: results.length,
                results,
            });
        }

        const raw = req.query.symbol;
        if (typeof raw !== "string" || raw.trim() === "") {
            return res.status(400).json({
                error:
                    "Query parameter 'symbol' (one OCC) or 'symbols' (comma-separated OCCs) is required, e.g. /options/contract?symbol=AAPL260116C00150000",
            });
        }

        const symbol = raw.trim().toUpperCase();
        if (!OCC_OPTION_SYMBOL_PATTERN.test(symbol)) {
            return res.status(400).json({
                error: "Option symbol is invalid.",
                symbol,
            });
        }

        const result = await getOptionContractQuote(symbol);
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
});
