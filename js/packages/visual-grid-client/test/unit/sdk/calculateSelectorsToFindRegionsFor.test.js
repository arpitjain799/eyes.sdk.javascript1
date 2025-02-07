'use strict'

const {describe, it} = require('mocha')
const {expect} = require('chai')
const calculateSelectorsToFindRegionsFor = require('../../../src/sdk/calculateSelectorsToFindRegionsFor')
const {Region} = require('@applitools/eyes-sdk-core')

describe('calculateSelectorsToFindRegionsFor Tests', () => {
  describe('calculateSelectorsToFindRegionsFor', () => {
    it('handles no arguments', () => {
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({})
      expect(selectorsToFindRegionsFor).to.be.undefined
    })

    it('handles non-array selectors', () => {
      const layout = {selector: 'bla'}
      const content = {selector: 'bla2'}
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({layout, content})
      expect(selectorsToFindRegionsFor).to.eql(['bla', 'bla2'])
    })

    it('handles array selectors', () => {
      const ignore = [{selector: 'bla'}]
      const layout = [{selector: 'blu'}]
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({ignore, layout})
      expect(selectorsToFindRegionsFor).to.eql(['bla', 'blu'])
    })

    it('handles non-array differnt index selectors', () => {
      const layout = {selector: 'bla'}
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({layout})
      expect(selectorsToFindRegionsFor).to.eql(['bla'])
    })

    it('handles array different index selectors', () => {
      const layout = [{selector: 'bla'}]
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({layout})
      expect(selectorsToFindRegionsFor).to.eql(['bla'])
    })

    it('handles mixed ignore regions with selectors and other region types', () => {
      const ignore = [{a: 'b'}, {selector: 'bla'}, {c: 'd'}, {selector: 'kuku'}]
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({ignore})
      expect(selectorsToFindRegionsFor).to.eql(['bla', 'kuku'])
    })

    it('handles multiple selector arrays with duplicates', () => {
      const ignore = [
        {a: 'b'},
        {selector: 'bla'},
        {c: 'd'},
        {selector: 'kuku'},
        {selector: 'ignore'},
      ]
      const layout = [{a: 'b'}, {selector: 'bla'}, {c: 'd'}, {selector: 'layout'}]
      const strict = [{a: 'b'}, {selector: 'bla'}, {c: 'd'}, {selector: 'strict'}]
      const content = [{a: 'b'}, {selector: 'bla'}, {c: 'd'}, {selector: 'content'}]
      const floating = [
        {a: 'b'},
        {selector: 'bla'},
        {c: 'd'},
        {selector: 'kuku'},
        {selector: 'float'},
      ]
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({
        ignore,
        layout,
        strict,
        content,
        floating,
      })
      expect(selectorsToFindRegionsFor).to.eql([
        'bla',
        'kuku',
        'ignore',
        'bla',
        'layout',
        'bla',
        'strict',
        'bla',
        'content',
        'bla',
        'kuku',
        'float',
      ])
    })

    it('handles well formated typed selectors', () => {
      const ignore = {selector: 'bla'}
      const layout = {type: 'css', selector: 'bla1'}
      const strict = {type: 'xpath', selector: 'bla2'}
      const {selectorsToFindRegionsFor} = calculateSelectorsToFindRegionsFor({
        ignore,
        layout,
        strict,
      })
      expect(selectorsToFindRegionsFor).to.eql([
        'bla',
        {type: 'css', selector: 'bla1'},
        {type: 'xpath', selector: 'bla2'},
      ])
    })
  })

  describe('getMatchRegions', () => {
    it('handles a single selector', () => {
      const ignore = {selector: '.ignore'}
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({ignore})
      const ignoreRegionFromGrid = new Region({left: 1, top: 1, width: 2, height: 1})
      const selectorRegions = [[ignoreRegionFromGrid]]
      const regions = getMatchRegions({selectorRegions})
      expect(regions.ignore).to.eql([{left: 1, top: 1, width: 2, height: 1}])
    })

    it('handles a single selector in an array', () => {
      const layout = [{selector: '.layout'}]
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({layout})
      const ignoreRegionFromGrid = new Region({left: 1, top: 1, width: 2, height: 1})
      const selectorRegions = [[ignoreRegionFromGrid]]
      const regions = getMatchRegions({selectorRegions})
      expect(regions.ignore).to.be.undefined
      expect(regions.layout).to.eql([{left: 1, top: 1, width: 2, height: 1}])
    })

    it('handles multiple selectors', () => {
      const ignore = [{selector: '.ignore'}]
      const layout = [{selector: '.layout'}]
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({ignore, layout})

      const selectorRegions = [
        [new Region({left: 1, top: 1, width: 2, height: 1})],
        [new Region({left: 3, top: 3, width: 5, height: 4})],
      ]
      const regions = getMatchRegions({selectorRegions})

      expect(regions.ignore).to.eql([{left: 1, top: 1, width: 2, height: 1}])
      expect(regions.layout).to.eql([{left: 3, top: 3, width: 5, height: 4}])
    })

    it('handles multiple grid regions per selector', () => {
      const ignore = {selector: '.ignore'}
      const layout = {selector: '.layout'}
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({ignore, layout})

      const selectorRegions = [
        [
          new Region({left: 1, top: 1, width: 2, height: 1}),
          new Region({left: 2, top: 2, width: 3, height: 2}),
        ],
        [
          new Region({left: 3, top: 3, width: 4, height: 3}),
          new Region({left: 4, top: 4, width: 5, height: 4}),
          new Region({left: 5, top: 5, width: 6, height: 5}),
        ],
      ]
      const regions = getMatchRegions({selectorRegions})

      expect(regions.ignore).to.eql([
        {left: 1, top: 1, width: 2, height: 1},
        {left: 2, top: 2, width: 3, height: 2},
      ])
      expect(regions.layout).to.eql([
        {left: 3, top: 3, width: 4, height: 3},
        {left: 4, top: 4, width: 5, height: 4},
        {left: 5, top: 5, width: 6, height: 5},
      ])
    })

    it('handles multiple non-array selectors', () => {
      const accessibility = {selector: 'ignore-me', accessibilityType: 'LargeText'}
      const floating = {
        selector: 'ignore-you',
        maxUpOffset: 10,
        maxDownOffset: 10,
        maxLeftOffset: 10,
        maxRightOffset: 10,
      }

      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({accessibility, floating})

      const selectorRegions = [
        [new Region({left: 1, top: 1, width: 2, height: 1})],
        [new Region({left: 1, top: 1, width: 2, height: 1})],
      ]
      const regions = getMatchRegions({selectorRegions})

      expect(regions).to.eql({
        accessibility: [
          {
            accessibilityType: 'LargeText',
            height: 1,
            left: 1,
            top: 1,
            width: 2,
          },
        ],
        floating: [
          {
            height: 1,
            left: 1,
            maxDownOffset: 10,
            maxLeftOffset: 10,
            maxRightOffset: 10,
            maxUpOffset: 10,
            top: 1,
            width: 2,
          },
        ],
      })
    })

    it('handles multiple array selectors', () => {
      const accessibility = [{selector: 'ignore-me', accessibilityType: 'LargeText'}]
      const floating = [
        {
          selector: 'ignore-you',
          maxUpOffset: 10,
          maxDownOffset: 10,
          maxLeftOffset: 10,
          maxRightOffset: 10,
        },
      ]

      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({accessibility, floating})

      const selectorRegions = [
        [new Region({left: 1, top: 1, width: 2, height: 1})],
        [new Region({left: 1, top: 1, width: 2, height: 1})],
      ]
      const regions = getMatchRegions({selectorRegions})

      expect(regions.accessibility[0])
        .to.haveOwnProperty('accessibilityType')
        .and.equal('LargeText')

      expect(regions.floating[0])
        .to.haveOwnProperty('maxUpOffset')
        .and.equal(10)
    })

    it('handles multiple selectors with user-provided region and imageLocation', () => {
      const ignore = [
        {selector: '.ignore-1'},
        new Region({left: 3, top: 4, width: 5, height: 6}),
        {selector: '.ignore-2'},
      ]
      const layout = [{selector: '.layout'}]
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({ignore, layout})

      const selectorRegions = [
        [new Region({left: 3, top: 3, width: 3, height: 3})],
        [new Region({left: 4, top: 4, width: 4, height: 4})],
        [new Region({left: 5, top: 5, width: 5, height: 5})],
      ]
      const imageLocation = {x: 1, y: 2}
      const regions = getMatchRegions({selectorRegions, imageLocation})

      expect(regions.ignore).to.eql([
        {left: 2, top: 1, width: 3, height: 3},
        {left: 3, top: 2, width: 4, height: 4},
        {left: 3, top: 4, width: 5, height: 6},
      ])
      expect(regions.layout).to.eql([{left: 4, top: 3, width: 5, height: 5}])
    })

    it('handles multiple selectors with user-provided selector and imageLocation', () => {
      const accessibility = [
        {selector: '.accessibility-1', accessibilityType: 'RegularText'},
        {selector: '.accessibility-2', accessibilityType: 'LargeText'},
      ]
      const floating = [
        {
          selector: 'float-1',
          maxUpOffset: 10,
          maxDownOffset: 10,
          maxLeftOffset: 10,
          maxRightOffset: 10,
        },
        {
          selector: 'float-2',
          maxUpOffset: 11,
          maxDownOffset: 11,
          maxLeftOffset: 11,
          maxRightOffset: 11,
        },
      ]

      const imageLocation = {x: 1, y: 2}
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({
        accessibility,
        floating,
      })

      const selectorRegions = [
        [new Region({left: 3, top: 3, width: 3, height: 3})],
        [new Region({left: 4, top: 4, width: 4, height: 4})],
        [new Region({left: 5, top: 5, width: 5, height: 5})],
        [new Region({left: 6, top: 6, width: 6, height: 6})],
      ]
      const regions = getMatchRegions({selectorRegions, imageLocation})

      expect(regions.accessibility).to.eql([
        {left: 2, top: 1, width: 3, height: 3, accessibilityType: 'RegularText'},
        {left: 3, top: 2, width: 4, height: 4, accessibilityType: 'LargeText'},
      ])
      expect(regions.floating).to.eql([
        {
          left: 4,
          top: 3,
          width: 5,
          height: 5,
          maxUpOffset: 10,
          maxDownOffset: 10,
          maxLeftOffset: 10,
          maxRightOffset: 10,
        },
        {
          left: 5,
          top: 4,
          width: 6,
          height: 6,
          maxUpOffset: 11,
          maxDownOffset: 11,
          maxLeftOffset: 11,
          maxRightOffset: 11,
        },
      ])
    })

    it('normalizes user-provided selector and imageLocation without negative coordinates', () => {
      const accessibility = [
        {selector: '.accessibility-1', accessibilityType: 'RegularText'},
        {selector: '.accessibility-2', accessibilityType: 'LargeText'},
      ]
      const floating = [
        {
          selector: 'float-1',
          maxUpOffset: 10,
          maxDownOffset: 10,
          maxLeftOffset: 10,
          maxRightOffset: 10,
        },
        {
          selector: 'float-2',
          maxUpOffset: 11,
          maxDownOffset: 11,
          maxLeftOffset: 11,
          maxRightOffset: 11,
        },
      ]

      const imageLocation = {x: 8, y: 9}
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({
        accessibility,
        floating,
      })

      const selectorRegions = [
        [new Region({left: 3, top: 3, width: 3, height: 3})],
        [new Region({left: 4, top: 4, width: 4, height: 4})],
        [new Region({left: 5, top: 5, width: 5, height: 5})],
        [new Region({left: 6, top: 6, width: 6, height: 6})],
      ]
      const regions = getMatchRegions({selectorRegions, imageLocation})

      expect(regions.accessibility).to.eql([
        {left: 0, top: 0, width: 3, height: 3, accessibilityType: 'RegularText'},
        {left: 0, top: 0, width: 4, height: 4, accessibilityType: 'LargeText'},
      ])
      expect(regions.floating).to.eql([
        {
          left: 0,
          top: 0,
          width: 5,
          height: 5,
          maxUpOffset: 10,
          maxDownOffset: 10,
          maxLeftOffset: 10,
          maxRightOffset: 10,
        },
        {
          left: 0,
          top: 0,
          width: 6,
          height: 6,
          maxUpOffset: 11,
          maxDownOffset: 11,
          maxLeftOffset: 11,
          maxRightOffset: 11,
        },
      ])
    })
    it('calculate the right region size for selectors with padding', () => {
      const ignore = [
        {selector: 'ignore', padding: 10},
        {selector: 'ignore1', padding: {left: 20, top: 20}},
        {selector: 'ignore2', padding: {right: 20}},
      ]
      const layout = [
        {selector: 'layout', padding: 20},
        {selector: 'layout_no_padd'},
        {selector: 'layout2', padding: {left: 10}},
      ]
      const strict = [
        {selector: 'strict', padding: 15},
        {selector: 'strict1', padding: {right: 10}},
      ]
      const content = [
        {selector: 'content', padding: 18},
        {selector: 'content1', padding: {top: 23}},
      ]
      const {getMatchRegions} = calculateSelectorsToFindRegionsFor({
        ignore,
        layout,
        strict,
        content,
      })
      // all selectorRegions are preset to receive same result after padding is added: {width: 100, height: 100, left: 0, top: 0}
      const selectorRegions = [
        [new Region({left: 10, top: 10, width: 80, height: 80})], // ignore
        [new Region({left: 20, top: 20, width: 80, height: 80})], // ignore
        [new Region({left: 0, top: 0, width: 80, height: 100})], // ignore
        [new Region({left: 20, top: 20, width: 60, height: 60})], // layout
        [new Region({left: 0, top: 0, width: 100, height: 100})], // layout
        [new Region({left: 10, top: 0, width: 90, height: 100})], // layout
        [new Region({left: 15, top: 15, width: 70, height: 70})], // strict
        [new Region({left: 0, top: 0, width: 90, height: 100})], // strict
        [new Region({left: 18, top: 18, width: 64, height: 64})], // content
        [new Region({left: 0, top: 23, width: 100, height: 77})], // content
      ]
      const regions = getMatchRegions({selectorRegions})
      Object.values(regions).forEach(region => {
        region.forEach(rec => {
          expect(rec).to.eql({width: 100, height: 100, left: 0, top: 0})
        })
      })
    })
  })
})
