import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} from "graphql";
import { resolvers } from "./resolvers";

/**
 * Stock metadata type
 */
const StockMetadataType = new GraphQLObjectType({
  name: "StockMetadata",
  fields: {
    fetchedAt: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Unix timestamp when the data was fetched",
    },
    source: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Source of the data (e.g., 'finnhub', 'fidelity')",
    },
  },
});

/**
 * Stock type
 */
const StockType = new GraphQLObjectType({
  name: "Stock",
  fields: {
    ticker: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Stock ticker symbol",
    },
    price: {
      type: GraphQLFloat,
      description: "Current price",
    },
    change: {
      type: GraphQLFloat,
      description: "Price change",
    },
    percentChange: {
      type: GraphQLFloat,
      description: "Percent change",
    },
    highPrice: {
      type: GraphQLFloat,
      description: "High price of the day",
    },
    lowPrice: {
      type: GraphQLFloat,
      description: "Low price of the day",
    },
    openPrice: {
      type: GraphQLFloat,
      description: "Open price of the day",
    },
    previousClose: {
      type: GraphQLFloat,
      description: "Previous close price",
    },
    timestamp: {
      type: GraphQLInt,
      description: "Data timestamp from source",
    },
    queryTime: {
      type: GraphQLString,
      description: "Query time (for scraper sources)",
    },
    metadata: {
      type: StockMetadataType,
      description: "Cache metadata including fetch timestamp and source",
    },
  },
});

/**
 * Root query type
 */
const RootQueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    stock: {
      type: StockType,
      description: "Get stock data for a single ticker",
      args: {
        ticker: {
          type: new GraphQLNonNull(GraphQLString),
          description: "Stock ticker symbol (e.g., 'AAPL')",
        },
      },
      resolve: resolvers.Query.stock,
    },
    stocks: {
      type: new GraphQLList(StockType),
      description: "Get stock data for multiple tickers",
      args: {
        tickers: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLString))
          ),
          description: "Array of stock ticker symbols (e.g., ['AAPL', 'MSFT'])",
        },
      },
      resolve: resolvers.Query.stocks,
    },
  },
});

/**
 * GraphQL schema
 */
export const schema = new GraphQLSchema({
  query: RootQueryType,
});
