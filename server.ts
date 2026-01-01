import "dotenv/config";
import express from "express";
import healthRoutes from "./routes/health";
import stocksRoutes from "./routes/stocks";
import { checkRedisHealth } from "./lib/db/redis";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/stocks", stocksRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize and check Redis connection on startup
  try {
    // Initialize Redis client first
    const { getRedisClient } = await import("./lib/db/redis");
    await getRedisClient();

    // Then check health
    const isHealthy = await checkRedisHealth();
    if (isHealthy) {
      console.log("✓ Redis connection is healthy");
    } else {
      console.warn("⚠ Redis connection check failed - caching will not work");
    }
  } catch (error) {
    console.error("✗ Failed to connect to Redis:", error);
    console.warn("⚠ Server will continue but caching will not work");
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  const { closeRedisConnection } = await import("./lib/db/redis");
  await closeRedisConnection();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  const { closeRedisConnection } = await import("./lib/db/redis");
  await closeRedisConnection();
  process.exit(0);
});
