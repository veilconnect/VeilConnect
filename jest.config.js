/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // 根 tsconfig 用 ESNext/Bundler（面向 webpack 网页构建）。Node 测试环境需 CommonJS，
  // 故在此覆盖 ts-jest 的 module/moduleResolution，使既有单元测试照常运行。
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node' } }]
  },
  moduleNameMapper: {
    '^electron-store$': '<rootDir>/tests/__mocks__/electron-store.ts'
  },
  collectCoverageFrom: [
    'src/main/**/*.ts'
  ],
  clearMocks: true,
  testTimeout: 10000
};
