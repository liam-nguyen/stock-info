import { Router } from "express";
import { getStockQuote } from "../services/stockService";

const STOCK_SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,10}$/;

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

export const stocksRouter = Router();

stocksRouter.get("/", async (req, res, next) => {
    try {
        const symbols = normalizeSymbols(req.query.symbols);

        if (symbols.length === 0) {
            return res.status(400).json({
                error: "Query parameter 'symbols' is required, e.g. /stocks?symbols=AAPL,MSFT",
            });
        }

        const invalidSymbols = symbols.filter((symbol) => !STOCK_SYMBOL_PATTERN.test(symbol));
        if (invalidSymbols.length > 0) {
            return res.status(400).json({
                error: "Some symbols are invalid.",
                invalidSymbols,
            });
        }

        const results = await Promise.all(symbols.map((symbol) => getStockQuote(symbol)));
        return res.status(200).json({
            count: results.length,
            results,
        });
    } catch (error) {
        return next(error);
    }
});
