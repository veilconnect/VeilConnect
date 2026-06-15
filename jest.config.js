/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^electron-store$': '<rootDir>/tests/__mocks__/electron-store.ts',
    '^electron$': '<rootDir>/tests/__mocks__/electron.ts'
  },
  collectCoverageFrom: [
    'src/main/**/*.ts',
    '!src/main/main.ts',
    '!src/main/preload.ts'
  ],
  clearMocks: true,
  testTimeout: 10000
};
