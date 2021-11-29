import type * as types from '@applitools/types'
import type {Driver} from './driver'
import type {Element} from './element'

export class HelperIOS<TDriver, TContext, TElement, TSelector> {
  static async make<TDriver, TContext, TElement, TSelector>(_options: {
    driver: Driver<TDriver, TContext, TElement, TSelector>
  }): Promise<HelperIOS<TDriver, TContext, TElement, TSelector> | null> {
    // const {driver} = options
    // const element = await driver.element({
    //   type: '-android uiautomator',
    //   selector: 'new UiSelector().description("EyesAppiumHelperEDT")',
    // })
    return null as any
    // return element ? new HelperIOS<TDriver, TContext, TElement, TSelector>({element}) : null
  }

  private _element: Element<TDriver, TContext, TElement, TSelector>

  async getContentSize(_element: Element<TDriver, TContext, TElement, TSelector>): Promise<types.Size> {
    return null as any
  }
}
