module.exports = {
  extends: 'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/js/config.js',
  emitOnly: test => {
    return test.features && test.features.includes('image')
  },
}
