'use strict'

const createResource = require('./createResource')

function createDomResource({cdt, resources}) {
  const value = Buffer.from(
    JSON.stringify({
      resources: Object.fromEntries(
        Object.entries(resources).sort(([url1], [url2]) => (url1 > url2 ? 1 : -1)),
      ),
      domNodes: cdt,
    }),
  )

  return createResource({value, type: 'x-applitools-html/cdt'})
}

module.exports = createDomResource
