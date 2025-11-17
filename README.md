# Stock API

A Next.js TypeScript API repository with automatic OpenAPI documentation generation.

## Features

- **Next.js 16** with App Router
- **TypeScript** with strict mode
- **Automatic OpenAPI Documentation** via `next-openapi-route-handler`
- **Type-Safe API Routes** with Zod validation
- **Tailwind CSS** for styling
- **ESLint** with Next.js recommended config
- **Prettier** for code formatting
- **Husky** for git hooks
- **lint-staged** for pre-commit checks

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (install with `npm install -g pnpm`)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=your_database_name

# Cron Security
CRON_SECRET=your_cron_secret_here

# Optional: API URL (for GitHub Actions)
API_URL=https://your-domain.vercel.app
```

**Required Environment Variables:**

- `MONGODB_URI` - MongoDB connection string (required)
- `MONGODB_DB_NAME` - MongoDB database name (required)
- `CRON_SECRET` - Secret token for cron endpoint authentication (required)
- `API_URL` - Base URL for the API (optional, used in GitHub Actions)

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### API Documentation

Once the server is running, you can access:

- **API Documentation Page**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON Schema**: [http://localhost:3000/api/openapi](http://localhost:3000/api/openapi)
- **Swagger Editor** (external): [https://editor.swagger.io/?url=http://localhost:3000/api/openapi](https://editor.swagger.io/?url=http://localhost:3000/api/openapi)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking
- `pnpm validate` - Run all checks (type-check, lint, format:check)

## Code Quality

This project is configured to automatically:

- **Lint** code before commits (via Husky + lint-staged)
- **Format** code before commits (via Husky + lint-staged)
- **Type-check** on demand with `pnpm type-check`

### Pre-commit Hooks

Husky is configured to run lint-staged on pre-commit, which will:

- Run ESLint with auto-fix on staged `.ts`, `.tsx`, `.js`, `.jsx` files
- Run Prettier on staged files

### Manual Validation

Run all checks manually:

```bash
pnpm validate
```

## API Routes

The API uses `@omer-x/next-openapi-route-handler` to automatically generate OpenAPI documentation from your route handlers. Here's how to create a new API route:

```typescript
import defineRoute from "@omer-x/next-openapi-route-handler";
import { z } from "zod";

export const { GET } = defineRoute({
  operationId: "myOperation",
  method: "GET",
  summary: "Brief summary",
  description: "Detailed description",
  tags: ["Category"],
  queryParams: z.object({
    param: z.string().describe("Parameter description"),
  }),
  action: async ({ queryParams }) => {
    return Response.json({ data: "response" });
  },
  responses: {
    200: {
      description: "Success response",
      content: z.object({
        data: z.string(),
      }),
    },
  },
});
```

### Available Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/stocks` - Get list of stocks (with optional query params: `symbol`, `limit`)
- `GET /api/stocks/[symbol]` - Get stock by symbol
- `GET /api/openapi` - OpenAPI JSON schema

## Configuration

- **Prettier**: Double quotes, 2 spaces, semicolons
- **ESLint**: Next.js recommended config with TypeScript support
- **TypeScript**: Strict mode enabled
- **Tailwind**: Configured with TypeScript
- **OpenAPI**: Auto-generated from route handlers using Zod schemas

## Project Structure

```
.
├── app/
│   ├── api/              # API routes
│   │   ├── health/       # Health check endpoint
│   │   ├── stocks/       # Stock endpoints
│   │   └── openapi/      # OpenAPI schema endpoint
│   ├── api-docs/         # API documentation page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Homepage
│   └── globals.css       # Global styles
├── lib/
│   ├── models/           # Zod schemas and DTOs
│   └── openapi-config.ts # OpenAPI configuration
├── eslint.config.cjs     # ESLint configuration
├── .prettierrc           # Prettier configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # Tailwind configuration
└── next.config.js        # Next.js configuration
```
