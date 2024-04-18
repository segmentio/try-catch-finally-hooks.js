/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      tsconfig: './tsconfig.test.json'
    }],
  },
  setupFilesAfterEnv:[
    //"./jest.setupFilesAfterEnv.ts"
    "jest-extended/all"
  ],
  testTimeout: 30000,
  verbose: true,
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};
