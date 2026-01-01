const tseslint = require("typescript-eslint");
const eslintPluginImport = require("eslint-plugin-import");

module.exports = [
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      import: eslintPluginImport,
    },
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "prefer-const": "warn",
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "*.lock",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
      ".DS_Store",
      "*.log",
      ".env*.local",
      ".git/**",
      ".husky/**",
    ],
  },
  {
    files: ["eslint.config.cjs", "*.config.{js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];
