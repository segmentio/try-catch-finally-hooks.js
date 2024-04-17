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
    "./jest.setupFilesAfterEnv.ts"
  ],
  testTimeout: 30000,
};