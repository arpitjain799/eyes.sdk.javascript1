import {Region} from '@applitools/types'
import {CheckSettings as BaseCheckSettings} from '@applitools/types/base'
import {CheckSettings} from '@applitools/types/classic'
import * as utils from '@applitools/utils'

export function toBaseCheckSettings<TElement, TSelector>(
  settings: CheckSettings<TElement, TSelector>,
): {regions: any[]; getBaseCheckSettings(regions: Region[])} {
  const regionTypes = ['ignore', 'layout', 'strict', 'content', 'floating', 'accessibility'] as const
  const regions = regionTypes.flatMap(regionType => {
    return (settings[`${regionType}Regions`] ?? []).reduce((regions, reference) => {
      const {region} = utils.types.has(reference, 'region') ? reference : {region: reference}
      return !isRegion(region) ? regions.concat(region) : regions
    }, [])
  })

  return {regions, getBaseCheckSettings}

  function getBaseCheckSettings(regions): BaseCheckSettings {
    const transformedSettings = {...settings}
    regionTypes.forEach(regionType => {
      transformedSettings[`${regionType}Regions`] = transformedSettings[`${regionType}Regions`]?.map(reference => {
        const {region, ...options} = utils.types.has(reference, 'region') ? reference : {region: reference}
        return !isRegion(region) ? {region: regions.shift(), ...options} : reference
      })
    })
    return transformedSettings as BaseCheckSettings
  }

  function isRegion(region: any): region is Region {
    return utils.types.has(region, ['x', 'y', 'width', 'height'])
  }
}
