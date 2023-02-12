import type {ImageTarget, ImageSettings} from '../types'
import {promises as fs} from 'fs'
import {req} from '@applitools/req'
import {type Image, makeImage} from '@applitools/image'
import * as utils from '@applitools/utils'

export async function transformTarget({
  target,
  settings,
}: {
  target: ImageTarget
  settings?: ImageSettings
}): Promise<ImageTarget> {
  if (target.isTransformed) return target
  if (target.image instanceof URL) target.image = target.image.href
  if (utils.types.isString(target.image)) {
    const str = target.image // we need this var because ts-wise all our string formats checkers (isHttpUrl/isBase64) are string type guards
    if (utils.types.isHttpUrl(str)) {
      const response = await req(target.image, {proxy: settings?.autProxy})
      target.image = await response.buffer()
    } else if (!utils.types.isBase64(str) /* is file path/file protocol url */) {
      target.image = await fs.readFile(target.image.startsWith('file:') ? new URL(target.image) : target.image)
    }
  }
  const image = makeImage(target.image)
  if (image.height === 0 || image.width === 0) {
    await image.debug('image is empty, try to getObject')
    await image.toObject()
  }

  if (settings?.normalization || settings?.region) {
    await image.debug({...settings.debugImages, suffix: 'original'})
    if (settings.normalization) {
      if (settings.normalization.scaleRatio) image.scale(settings.normalization.scaleRatio)
      if (settings.normalization.rotation) image.rotate(settings.normalization.rotation)
      if (settings.normalization.cut) image.crop(settings.normalization.cut)
      await image.debug({...settings.debugImages, suffix: 'normalized'})
    }
    if (settings.region) {
      image.crop(settings.region)
      await image.debug({...settings.debugImages, suffix: 'region'})
    }
    if (settings.normalization?.limit) {
      const height = cropToHeightLimit(image, settings.normalization.limit)
      image.crop({y: 0, x: 0, width: image.width, height})
    }
  }

  target.image = await image.toPng()

  if (!target.size || settings?.normalization || settings?.region) {
    target.size = image.size
  }

  return target
}

function cropToHeightLimit(image: Image, limit: {maxImageHeight: number; maxImageArea: number}): number {
  const {maxImageHeight, maxImageArea} = limit
  if (image.height > maxImageHeight || image.height * image.width > maxImageArea) {
    return Math.min(maxImageArea / image.width, maxImageHeight)
  }
  return image.height
}
