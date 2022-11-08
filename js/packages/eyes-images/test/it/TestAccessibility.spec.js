'use strict'

const assert = require('assert')
const {Target, AccessibilityLevel, AccessibilityGuidelinesVersion, AccessibilityRegionType} = require('../../dist')
const {getEyes, getBatch} = require('../util/TestSetup')
const {getTestInfo} = require('@applitools/test-utils')

describe('TestAccessibility', () => {
  it('TestAccessibility', async () => {
    const accessibilitySettings = {
      level: AccessibilityLevel.AA,
      guidelinesVersion: AccessibilityGuidelinesVersion.WCAG_2_0,
    }

    const eyes = getEyes({
      config: {
        matchTimeout: 0,
        defaultMatchSettings: {
          accessibilitySettings,
        },
        batch: getBatch(),
      },
    })

    await eyes.open('TestAccessibility', `TestAccessibility`, {width: 700, height: 460})

    const checkSettings = Target.image(`${__dirname}/../fixtures/dropbox1b-ie.png`).accessibilityRegion(
      {left: 10, top: 20, width: 30, height: 40},
      AccessibilityRegionType.LargeText,
    )

    await eyes.check('', checkSettings)
    const testResults = await eyes.close(false)

    const sessionAccessibilityStatus = testResults.getAccessibilityStatus()
    assert.ok(sessionAccessibilityStatus)
    assert.ok(sessionAccessibilityStatus.status)
    assert.strictEqual(sessionAccessibilityStatus.version, accessibilitySettings.guidelinesVersion)
    assert.strictEqual(sessionAccessibilityStatus.level, accessibilitySettings.level)

    const sessionResults = await getTestInfo(testResults.toJSON())
    const {actualAppOutput} = sessionResults

    const expectedAccessibilityRegions = [{type: 'LargeText', isDisabled: false, left: 10, top: 20, width: 30, height: 40}]
    const expectedAccessibilitySettings = {
      level: 'AA',
      version: 'WCAG_2_0',
    }

    assert.deepStrictEqual(actualAppOutput[0].imageMatchSettings.accessibilitySettings, expectedAccessibilitySettings)

    assert.deepStrictEqual(actualAppOutput[0].imageMatchSettings.accessibility, expectedAccessibilityRegions)

    // reset value
    eyes.setConfiguration(eyes.getConfiguration().setAccessibilityValidation())

    await eyes.open('TestAccessibility', `TestAccessibility_No_Accessibility`, {
      width: 700,
      height: 460,
    })
    await eyes.check('', Target.image(`${__dirname}/../fixtures/dropbox1b-ie.png`))
    const testResultsWithoutAccessibility = await eyes.close(false)

    assert.deepStrictEqual(testResultsWithoutAccessibility.getAccessibilityStatus(), undefined)

    const {startInfo: startInfoWithoutAccessibility} = await getTestInfo(testResultsWithoutAccessibility.toJSON())

    assert.strictEqual(startInfoWithoutAccessibility.defaultMatchSettings.accessibilitySettings, undefined)
  })
})
