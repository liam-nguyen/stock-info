import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "../lib/graphql/schema";
import { GraphQLError } from "graphql";

const router = express.Router();

// GraphQL endpoint
router.all(
  "/graphql",
  (req, res, next) => {
    console.log(`[GraphQL Route] Request received: ${req.method} ${req.path}`);
    console.log(`[GraphQL Route] Request body:`, req.body);
    next();
  },
  createHandler({
    schema,
    context: (req) => {
      console.log(`[GraphQL Handler] Creating context`);
      return { req };
    },
    formatError: (err) => {
      console.error("[GraphQL Handler] GraphQL error:", err);
      // Return the error as-is, or create a new GraphQLError
      if (err instanceof GraphQLError) {
        return err;
      }
      return new GraphQLError(err.message || String(err));
    },
  })
);

export default router;
