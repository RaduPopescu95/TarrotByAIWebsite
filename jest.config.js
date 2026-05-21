const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./"
});

const customJestConfig = {
  testEnvironment: "node",
  testRegex: ".*\\.test\\.(js|jsx|ts|tsx)$",
  testPathIgnorePatterns: ["/node_modules/", "/.next/"]
};

module.exports = createJestConfig(customJestConfig);
