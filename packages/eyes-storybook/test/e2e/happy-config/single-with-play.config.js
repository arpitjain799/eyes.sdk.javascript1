const path = require('path');

module.exports = {
  appName: 'Storybook with play interaction',
  batchName: 'Storybook with play',
  storybookConfigDir: path.resolve(__dirname, '../../fixtures/storybookWithPlay/.storybook'),
  storybookStaticDir: path.resolve(__dirname, '../../fixtures'),
  browser: [
    {width: 640, height: 480, name: 'chrome'},
    {width: 1280, height: 960, name: 'chrome'},
  ],
};
