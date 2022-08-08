import type {Renderer} from '@applitools/types'
import * as utils from '@applitools/utils'

export async function extractRendererInfo({renderer}: {renderer: Renderer}) {
  if (utils.types.has(renderer, ['width', 'height'])) {
    const {name, width, height} = renderer
    return {name, width, height}
  } else {
    let devicesSizes, browserObj
    if (utils.types.has(renderer, 'chromeEmulationInfo')) {
      browserObj = renderer.chromeEmulationInfo
      devicesSizes = await getEmulatedDevicesSizes()
    } else if (utils.types.has(renderer, 'iosDeviceInfo')) {
      browserObj = renderer.iosDeviceInfo
      devicesSizes = await getIosDevicesSizes()
    }
    const {deviceName, screenOrientation = 'portrait'} = browserObj
    const size = devicesSizes[deviceName][screenOrientation]
    return {name: deviceName, screenOrientation, ...size}
  }
}
