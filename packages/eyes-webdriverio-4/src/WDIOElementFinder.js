const {EyesElementFinder} = require('@applitools/eyes-sdk-core')
const WDIOWrappedElement = require('./WDIOWrappedElement')

class WDIOElementFinder extends EyesElementFinder {
  constructor(logger, driver) {
    super()
    this._logger = logger
    this._driver = driver
  }

  async findElement(locator, parentElement) {
    const selector = locator.value || locator
    const {value: element} = parentElement
      ? await this._driver.elementIdElement(WDIOWrappedElement.elementId(parentElement), selector)
      : await this._driver.element(selector)
    return element ? new WDIOWrappedElement(this._logger, this._driver, element, selector) : null
  }

  async findElements(locator, parentElement) {
    const selector = locator.value || locator
    const {value: elements} = parentElement
      ? await this._driver.elementIdElements(WDIOWrappedElement.elementId(parentElement), selector)
      : await this._driver.elements(selector)
    return elements.map(
      element => new WDIOWrappedElement(this._logger, this._driver, element, selector),
    )
  }
}

module.exports = WDIOElementFinder
