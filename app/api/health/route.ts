import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";

export const { GET } = defineRoute({
  operationId: "healthCheck",
  method: "GET",
  summary: "Health check endpoint",
  description: "Returns the health status of the API",
  tags: ["Health"],
  action: async () => {
    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  },
  responses: {
    200: {
      description: "API is healthy",
      content: z.object({
        status: z.string().describe("Health status"),
        timestamp: z.string().describe("Current timestamp"),
      }),
    },
  },
});
