module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@domain': './src/domain',
            '@data': './src/data',
            '@utils': './src/utils',
            '@presentation': './src/presentation',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
