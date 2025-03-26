import { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/*.test.ts"],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { 
      useESM: true,
      tsconfig: "test/tsconfig.json"
    }],
  },
  testTimeout: 300000,
};

export default config;
