module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  preset: 'ts-jest/presets/js-with-ts',
  transformIgnorePatterns: [
    'node_modules/(?!(query-string|decode-uri-component|split-on-first|filter-obj)/)',
  ],
  testRegex: '/test/(unit|integration)/.*\\.test\\.ts$',
  moduleFileExtensions: [
    'ts',
    'js'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: [ '<rootDir>/test/util/SetupTests.ts' ],
  collectCoverage: true,
  coverageReporters: [ 'text', 'lcov' ],
  coveragePathIgnorePatterns: [
    '/dist/',
    '/node_modules/',
    '/test/',
  ],
  testTimeout: 60000
};
