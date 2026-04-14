export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
  ],
};
