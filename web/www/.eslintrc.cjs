/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:svelte/recommended",
  ],
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  rules: {
    "no-console": 1,
    "prefer-template": 1,
    "no-unused-vars": 0,
    "react/display-name": 0,
    "react/prop-types": 0,
    "react/react-in-jsx-scope": 0,
    "react/no-unescaped-entities": 0,
    "react/no-children-prop": 0,
    "no-restricted-imports": ["error"],
  },
}
