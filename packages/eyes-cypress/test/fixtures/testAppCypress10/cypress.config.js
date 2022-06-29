const {defineConfig} = require('cypress');

module.exports = defineConfig({
  video: false,
  chromeWebSecurity: true,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {},
    specPattern: './cypress/integration-run',
    supportFile: './cypress/support/e2e.js',
  },
});

require('../../../')(module);
