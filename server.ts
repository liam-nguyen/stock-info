import "dotenv/config";
import express from "express";
import cors from "cors";
import graphqlRoutes from "./routes/graphql";
import { checkRedisHealth } from "./lib/db/redis";
import {
  startRefreshWorker,
  stopRefreshWorker,
} from "./lib/workers/cache-refresh-worker";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Routes
app.use("/", graphqlRoutes);

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
      // Start background refresh worker
      startRefreshWorker();
    } else {
      console.warn("⚠ Redis connection check failed - caching will not work");
    }
  } catch (error) {
    console.error("✗ Failed to connect to Redis:", error);
    console.warn("⚠ Server will continue but caching will not work");
  }
});

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down gracefully...");
  stopRefreshWorker();
  const { closeRedisConnection } = await import("./lib/db/redis");
  await closeRedisConnection();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
