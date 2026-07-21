const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: ["build/**", "node_modules/**", "src/uploads/**", "src/AAMVAFTP/**"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Downgraded from the strict defaults to match this codebase's
      // existing style rather than requiring a large-scale rewrite as
      // part of the tslint -> eslint migration.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-eval": "error",
      "no-var": "error",
      "eqeqeq": ["error", "smart"],
      "no-debugger": "error",
    },
  },
);
