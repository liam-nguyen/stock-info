// Cron endpoint for refreshing stock data
// Called by GitHub Actions or external cron services

import { NextRequest } from "next/server";
import { refreshOldestStocks } from "@/lib/workers/stock-refresh-worker";

export async function POST(request: NextRequest) {
  // Security: Check for CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not set in environment variables");
    return Response.json(
      {
        error: "Cron secret not configured",
      },
      { status: 500 }
    );
  }

  // Check for secret in Authorization header or query param
  const authHeader = request.headers.get("authorization");
  const searchParams = request.nextUrl.searchParams;
  const providedSecret =
    authHeader?.replace("Bearer ", "") || searchParams.get("secret");

  if (providedSecret !== cronSecret) {
    console.error("Invalid cron secret provided");
    return Response.json(
      {
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    // Get limit from query param (default: 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10) || 10;

    // Get base URL from request
    const baseUrl = new URL(request.url).origin;

    console.log(`Starting stock refresh worker: limit=${limit}`);

    // Call the refresh worker
    const result = await refreshOldestStocks(limit, baseUrl);

    // Log summary
    console.log(
      `Stock refresh completed: ${result.succeeded} succeeded, ${result.failed} failed out of ${result.processed} processed`
    );

    // Log all errors
    if (result.errors.length > 0) {
      console.error(
        "Errors during refresh:",
        JSON.stringify(result.errors, null, 2)
      );
    }

    return Response.json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error in cron endpoint:", errorMessage, errorStack);

    return Response.json(
      {
        success: false,
        error: "Failed to refresh stocks",
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
