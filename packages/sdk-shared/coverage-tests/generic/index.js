const prettier = require('prettier')

module.exports = {
  output: './test/generic',
  ext: '.spec.js',
  emitter: 'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/dom-image-location/js/emitter.js',
  overrides:
    'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/dom-image-location/js/overrides.js',
  template:
    'https://raw.githubusercontent.com/applitools/sdk.coverage.tests/dom-image-location/js/template.hbs',
  formatter: code => {
    return prettier.format(code, {
      parser: 'babel',
      singleQuote: true,
      semi: false,
      bracketSpacing: false,
      trailingComma: 'es5',
    })
  },
}
