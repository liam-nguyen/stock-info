// Cron endpoint for refreshing stock data
// Called by GitHub Actions or external cron services

import { NextRequest } from "next/server";
import { refreshOldestStocks } from "@/lib/workers/stock-refresh-worker";
import { refreshScraperTickers } from "@/lib/workers/scraper-refresh-worker";

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

    // Call both refresh workers in parallel
    const [yfResult, scraperResult] = await Promise.all([
      refreshOldestStocks(limit, baseUrl),
      refreshScraperTickers(),
    ]);

    // Combine results
    const combinedProcessed = yfResult.processed + scraperResult.processed;
    const combinedSucceeded = yfResult.succeeded + scraperResult.succeeded;
    const combinedFailed = yfResult.failed + scraperResult.failed;
    const combinedErrors = [...yfResult.errors, ...scraperResult.errors];

    // Log summary
    console.log(
      `YF refresh completed: ${yfResult.succeeded} succeeded, ${yfResult.failed} failed out of ${yfResult.processed} processed`
    );
    console.log(
      `Scraper refresh completed: ${scraperResult.succeeded} succeeded, ${scraperResult.failed} failed out of ${scraperResult.processed} processed`
    );
    console.log(
      `Combined refresh completed: ${combinedSucceeded} succeeded, ${combinedFailed} failed out of ${combinedProcessed} processed`
    );

    // Log all errors
    if (combinedErrors.length > 0) {
      console.error(
        "Errors during refresh:",
        JSON.stringify(combinedErrors, null, 2)
      );
    }

    return Response.json({
      success: true,
      yf: {
        processed: yfResult.processed,
        succeeded: yfResult.succeeded,
        failed: yfResult.failed,
        errors: yfResult.errors,
      },
      scraper: {
        processed: scraperResult.processed,
        succeeded: scraperResult.succeeded,
        failed: scraperResult.failed,
        errors: scraperResult.errors,
      },
      combined: {
        processed: combinedProcessed,
        succeeded: combinedSucceeded,
        failed: combinedFailed,
        errors: combinedErrors,
      },
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
