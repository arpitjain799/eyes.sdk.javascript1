import type {Core as BaseCore} from '@applitools/types/base'
import * as utils from '@applitools/utils'

export function makeFakeCore(): BaseCore {
  return <any>{
    getAccountInfo() {
      return {}
    },
    openEyes({settings}) {
      const environment = settings.environment
      const checkResults = []
      return {
        async check({target, settings}) {
          await utils.general.sleep(target.delay)
          await target.hooks?.check?.({environment, settings})

          if (settings.name.startsWith('fail')) {
            throw new Error('Received fail step name')
          }

          const result = {asExpected: true, target, settings, environment}

          checkResults.push(result)
          return [result]
        },
        async close() {
          return [
            {
              status: checkResults.every(result => result.asExpected) ? 'Passed' : 'Unresolved',
              stepsInfo: checkResults,
            },
          ]
        },
        async abort() {
          return [{}]
        },
      }
    },
  }
}
