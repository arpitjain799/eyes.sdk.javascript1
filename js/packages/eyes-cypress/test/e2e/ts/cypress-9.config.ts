import {defineConfig} from 'cypress'

export default defineConfig({
  e2e: {
    integrationFolder: './cypress/integration',
    supportFile: './cypress/support/index.js',
    pluginsFile: './cypress/plugins/index.ts',
    video: false,
    screenshotOnRunFailure: false,
  },
})
