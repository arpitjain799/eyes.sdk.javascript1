const {defineConfig} = require('cypress');

module.exports = defineConfig({
  video: false,
  chromeWebSecurity: true,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index-run.js')(on, config);
    },
    specPattern: './cypress/integration-run',
    supportFile: './cypress/support/e2e.js',
  },
});
