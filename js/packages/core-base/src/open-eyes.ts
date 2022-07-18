import type {Logger} from '@applitools/types'
import type {Config, Eyes} from '@applitools/types/types/core-base'

export async function openEyes(options: {
  config?: Config
  logger?: Logger
  on?: (event: string, data?: Record<string, any>) => void
}): Promise<Eyes> {
  console.log(options)
}
