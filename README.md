# Next.js Scaffold

A Next.js TypeScript scaffolding repository with development tools and best practices configured.

## Features

- **Next.js 15** with App Router
- **TypeScript** with strict mode
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

2. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

## Configuration

- **Prettier**: Double quotes, 2 spaces, semicolons
- **ESLint**: Next.js recommended config with TypeScript support
- **TypeScript**: Strict mode enabled
- **Tailwind**: Configured with TypeScript

## Project Structure

```
.
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Homepage
│   └── globals.css     # Global styles
├── .eslintrc.json      # ESLint configuration
├── .prettierrc         # Prettier configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.ts  # Tailwind configuration
└── next.config.js      # Next.js configuration
```
