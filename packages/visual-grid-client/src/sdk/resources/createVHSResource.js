const createResource = require('./createResource')

function createVHSResource({vhs, type}) {
  return createResource({value: Buffer.from(vhs), type: `x-applitools-vhs/${type}`})
}

module.exports = createVHSResource
