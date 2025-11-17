import { NextRequest } from "next/server";
import generateOpenApiSpec from "@omer-x/next-openapi-json-generator";
import { StockDTO, StockQueryParams } from "@/lib/models/stock";
import { openApiInfo } from "@/lib/openapi-config";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    // Ensure schemas are available
    if (!StockDTO || !StockQueryParams) {
      throw new Error(
        "Required schemas (StockDTO, StockQueryParams) are not available"
      );
    }

    const spec = await generateOpenApiSpec(
      {
        StockDTO,
        StockQueryParams,
      },
      {
        // You can add include/exclude options here if needed
        // include: ["/api/stocks"],
        // exclude: ["/api/health"],
      }
    );

    console.log("spec", spec);
    console.log("spec.paths", spec.paths);

    if (!spec) {
      console.error("[OpenAPI] Spec generation returned null/undefined");
      return Response.json(
        { error: "OpenAPI spec generation returned empty result" },
        { status: 500 }
      );
    }

    // Merge with custom info and ensure required OpenAPI fields
    // Use 3.0.3 instead of 3.1.0 for better Swagger UI compatibility
    const openApiSpec = {
      ...spec,
      openapi: "3.0.3",
      info: {
        ...spec.info,
        ...openApiInfo,
      },
      paths: spec.paths ?? {},
    };

    const pathCount = Object.keys(openApiSpec.paths || {}).length;
    console.log("[OpenAPI] Returning spec with", pathCount, "paths");

    return Response.json(openApiSpec, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[OpenAPI] Error generating spec:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("[OpenAPI] Error details:", {
      message: errorMessage,
      stack: errorStack?.split("\n").slice(0, 5).join("\n"),
    });

    // Return a minimal valid OpenAPI spec as fallback
    const fallbackSpec = {
      openapi: "3.0.3",
      info: {
        ...openApiInfo,
        description: `${openApiInfo.description} (Error: ${errorMessage})`,
      },
      paths: {},
      components: {
        schemas: {},
      },
    };

    return Response.json(
      {
        ...fallbackSpec,
        _error: {
          message: "Failed to generate OpenAPI specification",
          details: errorMessage,
          ...(process.env.NODE_ENV === "development" && errorStack
            ? { stack: errorStack }
            : {}),
        },
      },
      { status: 200 } // Return 200 so SwaggerUI can still display something
    );
  }
}
