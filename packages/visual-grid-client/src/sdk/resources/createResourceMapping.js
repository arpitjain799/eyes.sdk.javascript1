'use strict'

const createResource = require('./createResource')
const createDomResource = require('./createDomResource')
const createVHSResource = require('./createVHSResource')

function makeCreateResourceMapping({processResources}) {
  return async function createResourceMapping({
    snapshot,
    browserName,
    userAgent,
    cookies,
    proxy,
    autProxy,
  }) {
    const processedSnapshotResources = await processSnapshotResources({
      snapshot,
      browserName,
      userAgent,
      cookies,
      proxy,
      autProxy,
    })

    const resources = await processedSnapshotResources.promise

    const dom = resources[snapshot.url || 'vhs']
    if (snapshot.url) {
      delete resources[snapshot.url]
    }

    return {dom, resources}
  }

  async function processSnapshotResources({
    snapshot,
    browserName,
    userAgent,
    cookies,
    proxy,
    autProxy,
  }) {
    const [snapshotResources, ...frameResources] = await Promise.all([
      processResources({
        resources: {
          ...(snapshot.resourceUrls || []).reduce((resources, url) => {
            return Object.assign(resources, {[url]: createResource({url, browserName})})
          }, {}),
          ...Object.entries(snapshot.resourceContents || {}).reduce(
            (resources, [url, resource]) => {
              return Object.assign(resources, {[url]: createResource(resource)})
            },
            {},
          ),
        },
        referer: snapshot.url,
        browserName,
        userAgent,
        cookies,
        proxy,
        autProxy,
      }),
      ...(snapshot.frames || []).map(frameSnapshot => {
        return processSnapshotResources({
          snapshot: frameSnapshot,
          browserName,
          userAgent,
          cookies,
          proxy,
          autProxy,
        })
      }),
    ])

    const frameDomResourceMapping = frameResources.reduce((mapping, resources, index) => {
      const frameUrl = snapshot.frames[index].url
      return Object.assign(mapping, {[frameUrl]: resources.mapping[frameUrl]})
    }, {})

    let domResource
    if (snapshot.cdt) {
      domResource = await processResources({
        resources: {
          [snapshot.url]: createDomResource({
            cdt: snapshot.cdt,
            resources: {...snapshotResources.mapping, ...frameDomResourceMapping},
          }),
        },
      })
    } else if (snapshot.vhs) {
      // TODO this is not complete (iOS support)
      domResource = await processResources({
        resources: {vhs: createVHSResource({vhs: snapshot.vhs, type: snapshot.vhsType})},
      })
    } else {
      domResource = await processResources({
        resources: {
          vhs: createResource({
            value: Buffer.from(
              JSON.stringify({
                vhs: snapshot.vhsHash,
                resources: {...snapshotResources.mapping, ...frameDomResourceMapping}, // this will be empty until resources are supported inside VHS
                metadata: {
                  platformName: snapshot.platformName,
                  vhsType: snapshot.vhsType,
                },
              }),
            ),
            type: 'x-applitools-resource-map/native',
          }),
        },
      })
    }

    const frameResourceMapping = frameResources.reduce((mapping, resources) => {
      return Object.assign(mapping, resources.mapping)
    }, {})

    const resourceMapping = {
      ...frameResourceMapping,
      ...snapshotResources.mapping,
      ...domResource.mapping,
    }
    return {
      mapping: resourceMapping,
      promise: Promise.all([
        snapshotResources.promise,
        domResource.promise,
        ...frameResources.map(resources => resources.promise),
      ]).then(() => resourceMapping),
    }
  }
}

module.exports = makeCreateResourceMapping
