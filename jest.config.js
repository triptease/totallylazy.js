module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES6',
        module: 'commonjs',
      },
    },
  },
  setupFiles: [],
  testTimeout: 10000,
  maxWorkers: 1,
};

