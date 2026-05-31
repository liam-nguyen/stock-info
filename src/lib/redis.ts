import { createClient } from "redis";
import { config } from "../config";

export interface RedisLikeClient {
    get(key: string): Promise<string | null>;
    mGet(keys: string[]): Promise<(string | null)[]>;
    set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
    connect(): Promise<unknown>;
    isOpen?: boolean;
}

const redisClient = createClient({
    socket: {
        host: config.redisHost,
        port: config.redisPort,
    },
    password: config.redisPassword,
});

redisClient.on("error", (error) => {
    console.error("Redis error:", error);
});

export const getRedisClient = (): RedisLikeClient => redisClient;

export const ensureRedisConnected = async (): Promise<void> => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};
