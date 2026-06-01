/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@react-native-community/netinfo$': '<rootDir>/__tests__/mocks/netinfo.ts',
    '^expo-constants$': '<rootDir>/__tests__/mocks/expo-constants.ts',
    '^react-native$': '<rootDir>/__tests__/mocks/react-native.ts',
    '^expo-crypto$': '<rootDir>/__tests__/mocks/expo-crypto.ts',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverageFrom: [
    'src/domain/calculation/**/*.ts',
    'src/utils/**/*.ts',
    '!**/*.d.ts',
  ],
};
