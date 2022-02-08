'use strict'

const ArgumentGuard = require('../utils/ArgumentGuard')
/**
 * @prop {string} pageId
 * @prop {number} width
 * @prop {number} height
 * @prop {Location} imagePositionInPage
 */

class PageInfo {
  constructor(infoObject) {
    const {pageId, width, height, imagePositionInPage} = infoObject
    ArgumentGuard.greaterThanOrEqualToZero(width, 'width')
    ArgumentGuard.greaterThanOrEqualToZero(height, 'height')
    ArgumentGuard.notNullOrEmpty(pageId, 'pageId')
    ArgumentGuard.notNull(imagePositionInPage, 'imagePositionInPage')

    this._pageId = pageId
    this._width = width
    this._height = height
    this._imagePositionInPage = imagePositionInPage
  }

  /**
   * @return {boolean}
   */
  isEmpty() {
    return this.getPageId().length === 0 && this.getWidth() === 0 && this.getHeight() === 0
  }

  /**
   * @return {number} - The page width.
   */
  getWidth() {
    return this._width
  }

  /**
   * @return {number} - The page height.
   */
  getHeight() {
    return this._height
  }
  /**
   * @return {string} - The pageId.
   */
  getPageId() {
    return this._pageId
  }

  /**
   * @return {Location} - imagePositionInPage
   */
  getImagePositionInPage() {
    return this._imagePositionInPage
  }
  /**
   * update the imagePositionInPage with updated location
   * @param {Location} the image position in page.
   */
  setImagePositionInPage(location) {
    this._imagePositionInPage = location
  }

  /**
   * @override
   */
  toJSON() {
    return {pageId: this._pageId, width: this._width, height: this._height, imagePositionInPage: this._imagePositionInPage.toJSON()}
  }

  /**
   * @override
   */
  toString() {
    return `(${this._pageId}, ${this._width}, ${this._height}, ${this._imagePositionInPage.toString()})`
  }
}

module.exports = PageInfo
