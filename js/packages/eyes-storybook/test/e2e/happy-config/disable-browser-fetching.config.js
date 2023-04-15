const path = require('path');

module.exports = {
  appName: 'disable browser fetching',
  batchName: 'disable browser fetching',
  storybookConfigDir: path.resolve(__dirname, '../../fixtures/disableBrowserFetching'),
  storybookStaticDir: path.resolve(__dirname, '../../fixtures'),
  browser: [{name: 'chrome', width: 1000, height: 800}],
  disableBrowserFetchin: true,
};
