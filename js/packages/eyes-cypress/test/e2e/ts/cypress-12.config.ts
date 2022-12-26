import { defineConfig } from 'cypress12'
import { eyesPlugin } from '../../../'

export default defineConfig({
   e2e: {
      setupNodeEvents: (on, config) => {
         return eyesPlugin(on, config)
      },
      specPattern: './**/*.spec.ts',
      video: false,
      screenshotOnRunFailure: false,
   }
})
