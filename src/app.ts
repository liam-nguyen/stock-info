import express from "express";
import { stocksRouter } from "./routes/stocks";

export const createApp = () => {
    const app = express();

    app.use(express.json());

    app.get("/ping", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use("/stocks", stocksRouter);

    app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });

    return app;
};
