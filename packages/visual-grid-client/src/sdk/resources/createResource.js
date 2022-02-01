const crypto = require('crypto')
const VISUAL_GRID_MAX_BUFFER_SIZE = 34.5 * 1024 * 1024

function createResource(data = {}) {
  const {url, value, type, browserName, dependencies, errorStatusCode} = data
  const resource = {}

  if (url) {
    resource.url = resource.id = url
  }

  if (errorStatusCode) {
    resource.errorStatusCode = errorStatusCode
    resource.hash = {errorStatusCode}
    return resource
  }

  if (browserName && isBrowserDependantResource(resource)) {
    resource.browserName = getBrowserName(browserName)
    resource.id += `~${resource.browserName}`
  }

  if ('value' in data) {
    resource.value =
      value && type !== 'x-applitools-html/cdt' && value.length > VISUAL_GRID_MAX_BUFFER_SIZE
        ? value.slice(0, VISUAL_GRID_MAX_BUFFER_SIZE - 100000)
        : value || ''
    resource.type = type || 'application/x-applitools-unknown'
    resource.hash = createResourceHashObject(resource)
  }

  if (dependencies) resource.dependencies = dependencies

  return resource
}

function isBrowserDependantResource({url}) {
  return /https:\/\/fonts.googleapis.com/.test(url)
}

function createResourceHashObject({value, type}) {
  return {
    hashFormat: 'sha256',
    hash: crypto
      .createHash('sha256')
      .update(value)
      .digest('hex'),
    contentType: type,
  }
}

function getBrowserName(browserName) {
  if (!browserName) return ''
  if (['IE', 'Chrome', 'Firefox', 'Safari', 'Edgechromium', 'Edge'].includes(browserName)) {
    return browserName
  }
  if (browserName === 'ie10' || browserName === 'ie11' || browserName === 'ie') return 'IE'
  if (browserName.includes('chrome')) return 'Chrome'
  if (browserName.includes('firefox')) return 'Firefox'
  if (browserName.includes('safari')) return 'Safari'
  if (browserName.includes('edgechromium')) return 'Edgechromium'
  if (browserName.includes('edge')) return 'Edge'
}

module.exports = createResource
