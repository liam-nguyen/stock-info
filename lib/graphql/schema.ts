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
 * Stock metadata type (cache metadata)
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
      description: "Source of the data (e.g., 'finnhub', 'alpha-vantage')",
    },
  },
});

/**
 * API metadata type (source-specific fields)
 */
const ApiMetadataType = new GraphQLObjectType({
  name: "ApiMetadata",
  fields: {
    source: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Source name (e.g., 'finnhub', 'alpha-vantage')",
    },
    timestamp: {
      type: GraphQLInt,
      description: "Timestamp from source (Finnhub only)",
    },
    volume: {
      type: GraphQLString,
      description: "Trading volume (Alpha Vantage only)",
    },
    latestTradingDay: {
      type: GraphQLString,
      description: "Latest trading day (Alpha Vantage only)",
    },
    symbol: {
      type: GraphQLString,
      description: "Symbol from source (Alpha Vantage only)",
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
    apiMetadata: {
      type: ApiMetadataType,
      description:
        "API-specific metadata including source name and source-specific fields",
    },
  },
});

/**
 * Stocks response type (includes successful results and failed tickers)
 */
const StocksResponseType = new GraphQLObjectType({
  name: "StocksResponse",
  fields: {
    stocks: {
      type: new GraphQLList(StockType),
      description: "Array of successfully fetched stock data",
    },
    failed: {
      type: new GraphQLList(GraphQLString),
      description: "Array of ticker symbols that failed to be fetched",
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
      type: new GraphQLNonNull(new GraphQLList(StockType)),
      description:
        "Get stock data for multiple tickers (only successful results)",
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
    failed: {
      type: new GraphQLList(GraphQLString),
      description: "Get list of failed tickers from the last stocks query",
      args: {
        tickers: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLString))
          ),
          description: "Array of stock ticker symbols (e.g., ['AAPL', 'MSFT'])",
        },
      },
      resolve: resolvers.Query.failed,
    },
  },
});

/**
 * GraphQL schema
 */
export const schema = new GraphQLSchema({
  query: RootQueryType,
});
