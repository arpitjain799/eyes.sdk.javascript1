const {defineConfig} = require('cypress');

let eyesSetup = false;

module.exports = defineConfig({
  chromeWebSecurity: true,
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 86400000,
  eyesIsGlobalHooksSupported: false,
  eyesPort: 51664,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      if (!eyesSetup) {
        eyesSetup = true;
        require('../../../../')(module);
        return module.exports(on, config);
      }
    },
    specPattern: './cypress/integration-run',
    supportFile: './cypress/support/e2e.js',
  },
});
