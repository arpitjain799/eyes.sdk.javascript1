'use strict'
const {getTunnelAgentFromProxy} = require('@applitools/eyes-sdk-core/shared')
const userAgents = require('./userAgents')
const createResourceCookieHeader = require('./createResourceCookieHeader')

function createFetchOptions(resource, {referer, userAgent, proxy, cookies}) {
  const fetchOptions = {headers: {}}

  fetchOptions.headers['Referer'] = referer

  fetchOptions.headers['User-Agent'] = resource.browserName
    ? userAgents[resource.browserName]
    : userAgent

  if (proxy && proxy.getIsHttpOnly()) {
    fetchOptions.agent = getTunnelAgentFromProxy(proxy.toProxyObject())
  }

  if (cookies) {
    fetchOptions.headers['Cookie'] = createResourceCookieHeader(resource.url, cookies)
  }

  return fetchOptions
}

module.exports = createFetchOptions
