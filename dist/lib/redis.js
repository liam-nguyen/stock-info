"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRedisConnected = exports.getRedisClient = void 0;
const redis_1 = require("redis");
const config_1 = require("../config");
const redisClient = (0, redis_1.createClient)({
    socket: {
        host: config_1.config.redisHost,
        port: config_1.config.redisPort,
    },
    password: config_1.config.redisPassword,
});
redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});
const getRedisClient = () => redisClient;
exports.getRedisClient = getRedisClient;
const ensureRedisConnected = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};
exports.ensureRedisConnected = ensureRedisConnected;
