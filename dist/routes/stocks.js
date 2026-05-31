"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stocksRouter = void 0;
const express_1 = require("express");
const stockService_1 = require("../services/stockService");
const STOCK_SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,10}$/;
const normalizeSymbols = (rawSymbols) => {
    if (typeof rawSymbols !== "string" || rawSymbols.trim() === "") {
        return [];
    }
    return Array.from(new Set(rawSymbols
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter((symbol) => symbol.length > 0)));
};
exports.stocksRouter = (0, express_1.Router)();
exports.stocksRouter.get("/", async (req, res, next) => {
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
        const results = await (0, stockService_1.getStockQuotes)(symbols);
        return res.status(200).json({
            count: results.length,
            results,
        });
    }
    catch (error) {
        return next(error);
    }
});
