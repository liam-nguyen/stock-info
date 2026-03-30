"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const redis_1 = require("./lib/redis");
const start = async () => {
    await (0, redis_1.ensureRedisConnected)();
    const app = (0, app_1.createApp)();
    app.listen(config_1.config.port, () => {
        console.log(`Server listening on port ${config_1.config.port}`);
    });
};
start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
