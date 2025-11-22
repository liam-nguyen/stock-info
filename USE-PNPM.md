# ⚠️ Important: Use pnpm

This project uses **pnpm** as its package manager.

## Quick Start

```bash
# Install pnpm (if you haven't already)
npm install -g pnpm

# Install dependencies
pnpm install

# Run the project
pnpm dev
```

## Why pnpm?

- Faster installs
- Efficient disk space usage
- Strict dependency resolution

## ❌ Don't use npm or yarn

```bash
# DON'T do this:
npm install   # ❌ Will fail
yarn install  # ❌ Will fail

# DO this instead:
pnpm install  # ✅ Correct!
```

---

If you see an error like `Cannot read properties of null (reading 'matches')` when running `npm install`, **that's expected** - it means you need to use pnpm instead!
