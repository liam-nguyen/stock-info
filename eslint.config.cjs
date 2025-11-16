const nextConfig = require("eslint-config-next/core-web-vitals");
const nextTypeScriptConfig = require("eslint-config-next/typescript");

module.exports = [
  ...nextConfig,
  ...nextTypeScriptConfig,
  {
    rules: {
      "prefer-const": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.lock",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      ".DS_Store",
      "*.log",
      ".env*.local",
      ".vercel/**",
      ".turbo/**",
    ],
  },
  {
    files: ["eslint.config.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
