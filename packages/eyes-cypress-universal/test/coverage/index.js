module.exports = {
  name: 'eyes-cypress',
  ext: '.spec.js',
  emitter: './test/coverage/emitter.js',
  template: './test/coverage/template.hbs',
  output: './test/coverage/generic/cypress/integration',
  tests:
    'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/coverage-tests.js',
  overrides: [
    'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/js/overrides.js',
    'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/js/js-overrides.js',
    ...(process.env.APPLITOOLS_TEST_REMOTE === 'eg'
      ? [
          'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/universal-sdk/eg.overrides.js',
        ]
      : []),
    './test/coverage/overrides.js',
  ],
  emitOnly: test => {
    if (test.api === 'classic') return false;
    return test.vg;
  },
};
