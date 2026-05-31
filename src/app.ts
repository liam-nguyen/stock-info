import compression from "compression";
import express from "express";
import { optionsRouter } from "./routes/options";
import { stocksRouter } from "./routes/stocks";

export const createApp = () => {
    const app = express();

    app.use(compression({ threshold: 500 }));

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

    app.use(express.json());

    app.get("/ping", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use("/stocks", stocksRouter);
    app.use("/options", optionsRouter);

    app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });

    return app;
};
