"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const options_1 = require("./routes/options");
const stocks_1 = require("./routes/stocks");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, compression_1.default)({ threshold: 500 }));
    // Browser clients (Prosper) call stock-api directly; allow cross-origin GET.
    app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        if (req.method === "OPTIONS") {
            res.sendStatus(204);
            return;
        }
        next();
    });
    app.use(express_1.default.json());
    app.get("/ping", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
    app.use("/stocks", stocks_1.stocksRouter);
    app.use("/options", options_1.optionsRouter);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });
    return app;
};
exports.createApp = createApp;
