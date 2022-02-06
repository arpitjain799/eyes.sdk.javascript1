'use strict'

const ArgumentGuard = require('../utils/ArgumentGuard')

/**
 * @prop {string} pageId
 * @prop {number} width
 * @prop {number} height
 */

class PageInfo {
  constructor(infoObject) {
    const {pageId, width, height} = infoObject
    ArgumentGuard.greaterThanOrEqualToZero(width, 'width')
    ArgumentGuard.greaterThanOrEqualToZero(height, 'height')
    ArgumentGuard.notNullOrEmpty(pageId, 'pageId')

    this._pageId = pageId
    this._width = width
    this._height = height
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
   * @override
   */
  toJSON() {
    return {pageId: this._pageId, width: this._width, height: this._height}
  }

  /**
   * @override
   */
  toString() {
    return `(${this._pageId}, ${this._width}, ${this._height})`
  }
}

module.exports = PageInfo
