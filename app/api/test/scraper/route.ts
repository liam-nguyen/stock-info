// Test endpoint for local scraper testing
// This endpoint allows testing scrapers without needing the cron worker

import { NextRequest } from "next/server";
import { FidelityScraper } from "@/lib/utils/fidelity-scraper";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbolParam = searchParams.get("symbol") || "NHFSMKX98";

  // Support multiple symbols separated by comma
  const symbols = symbolParam.split(",").map((s) => s.trim());

  try {
    console.log(`Testing scraper with symbols: ${symbols.join(", ")}`);

    const scraper = new FidelityScraper();
    const results = await scraper.execute(symbols);

    return Response.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Error testing scraper:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
