import "dotenv/config";
import { createApp } from "./app";
import { config } from "./config";
import { ensureRedisConnected } from "./lib/redis";

const start = async () => {
    await ensureRedisConnected();
    const app = createApp();

    app.listen(config.port, () => {
        console.log(`Server listening on port ${config.port}`);
    });
};

start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
