/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    browser: false,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "no-console": 0,
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
