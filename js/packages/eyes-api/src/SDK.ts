import {makeCore, type Core, type SpecType, type SpecDriver} from '@applitools/core'
import * as utils from '@applitools/utils'

export interface SDKOptions<TSpec extends SpecType = SpecType> {
  agentId?: string
  spec?: SpecDriver<TSpec>
  makeCore?: typeof makeCore
}

export interface SDK<TSpec extends SpecType = SpecType> {
  core: Core<TSpec, 'classic' | 'ufg'>
  spec?: SpecDriver<TSpec>
}

export function makeSDK<TSpec extends SpecType = SpecType>(options: SDKOptions<TSpec> = {}): SDK<TSpec> {
  return {
    core: getCore(options),
    spec: options.spec,
  }
}

const getCore = utils.general.cachify(function getCore<TSpec extends SpecType = SpecType>(
  options: SDKOptions<TSpec> = {},
): Core<TSpec, 'classic' | 'ufg'> {
  return (options.makeCore ?? makeCore)({agentId: `js/eyes/${require('../package.json')}`, ...options})
})
