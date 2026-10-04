module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  moduleNameMapper: {
    '^realm$': '<rootDir>/jest/realm.js',
    '^@shopify/flash-list$': '<rootDir>/jest/flashList.js',
    '^@react-native-community/netinfo$': '<rootDir>/jest/netinfo.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-)?react-native|@react-native(?:-community)?|@react-navigation|@reduxjs/toolkit|immer|react-redux|redux|reselect)/',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/test/**'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
