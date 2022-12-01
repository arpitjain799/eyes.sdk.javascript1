import { defineConfig } from 'cypress'
import { eyesPlugin } from '../../../'

export default defineConfig({
   e2e: {
      integrationFolder:'test/e2e/ts/cypress/integration',
      supportFile:'test/e2e/ts/cypress/support/index.js',
      pluginsFile:'test/e2e/ts/cypress/plugins/index.ts',
      video: false,
      screenshotOnRunFailure: false,
   }
})
