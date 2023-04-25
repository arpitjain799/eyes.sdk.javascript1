const group = process.env.MOCHA_GROUP

module.exports = {
  timeout: 0,
  reporter: 'mocha-multi',
  reporterOptions: [`spec=-,json=./logs/report${group ? `-${group}` : ''}.json`],
  'node-option': ['experimental-specifier-resolution=node', 'loader=ts-node/esm']
}
