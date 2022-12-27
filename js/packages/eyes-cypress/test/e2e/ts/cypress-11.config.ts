import {defineConfig} from 'cypress11'
import {eyesPlugin} from '../../../dist/plugin/startPlugin'

export default defineConfig({
  e2e: {
    setupNodeEvents: (on, config) => {
      return eyesPlugin(on, config)
    },
    specPattern: './**/*.spec.ts',
    video: false,
    screenshotOnRunFailure: false,
  },
})
