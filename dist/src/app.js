"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const stocks_1 = require("./routes/stocks");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
    app.use("/stocks", stocks_1.stocksRouter);
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });
    return app;
};
exports.createApp = createApp;
