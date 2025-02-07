const assert = require('assert')
const {
  checkPackagesForUniqueVersions,
  findEntryByPackageName,
  findPackageInPackageLock,
} = require('../../src/versions/versions-utils')
const path = require('path')

describe('versions-utils', () => {
  it('finds all references to a given package', () => {
    const packageLock = require(path.join(__dirname, 'fixtures', 'package-lock-lockFileVersion1.json'))
    const expected = [
      {'@applitools/eyes-webdriverio@file:../dry-run.tgz': '@applitools/eyes-sdk-core@9.0.2'},
      {'@applitools/visual-grid-client@13.6.12': '@applitools/eyes-sdk-core@9.0.3'},
    ]
    assert.deepStrictEqual(findPackageInPackageLock({packageLock, packageName: '@applitools/eyes-sdk-core'}), expected)
  })
  it('finds all references to a given package', () => {
    const packageLock = require(path.join(__dirname, 'fixtures', 'package-lock-lockFileVersion3.json'))
    const expected = [
      {'@applitools/eyes-sdk-core@13.11.26': '@applitools/core@1.3.6'},
      {'@applitools/eyes-universal@2.18.0': '@applitools/core@1.3.5'},
    ]
    assert.deepStrictEqual(findPackageInPackageLock({packageLock, packageName: '@applitools/core'}), expected)
  })
})

describe('versions', () => {
  describe('verify-installed-versions to see if different versions of the same package are installed', () => {
    describe('with package-lock.json', () => {
      it('lockFileVersion: 1', () => {
        const packageLock = require(path.join(__dirname, 'fixtures', 'package-lock-lockFileVersion1.json'))
        const packageNames = ['@applitools/eyes-sdk-core', '@applitools/dom-utils']
        assert.throws(() => {
          checkPackagesForUniqueVersions(packageLock, packageNames, {isNpmLs: false})
        }, /Non-unique package versions found of @applitools\/eyes\-sdk-core\./)
      })
      it('lockFileVersion: 2', () => {
        const packageLock = require(path.join(__dirname, 'fixtures', 'package-lock-lockFileVersion2.json'))
        const packageNames = [
          '@applitools/eyes-api',
          '@applitools/eyes-sdk-core',
          '@applitools/spec-driver-selenium',
          '@applitools/visual-grid-client',
        ]
        assert.throws(() => {
          checkPackagesForUniqueVersions(packageLock, packageNames, {isNpmLs: false})
        }, /Non-unique package versions found of @applitools\/eyes\-sdk-core\./)
      })
      it('lockFileVersion: 3', () => {
        const packageLock = require(path.join(__dirname, 'fixtures', 'package-lock-lockFileVersion3.json'))
        const packageNames = ['@applitools/core']
        assert.throws(() => {
          checkPackagesForUniqueVersions(packageLock, packageNames, {isNpmLs: false})
        }, /Non-unique package versions found of @applitools\/core\./)
      })
    })
    describe('with npm ls', () => {
      it('filters package name exactly', () => {
        const npmLsOutput = `
        └─┬ @applitools/eyes-webdriverio@5.9.21
        ├─┬ selenium-webdriver@4.0.0-alpha.7
        └─┬ webdriverio@5.22.4
          └─┬ webdriver@5.22.4
        `
        assert.deepStrictEqual(findEntryByPackageName(npmLsOutput, 'webdriverio'), ['        └─┬ webdriverio@5.22.4'])
      })
      it('checks if different versions of the same package are installed', () => {
        const npmLsOutput = `
        ├─┬ @applitools/eyes-selenium@4.33.24
        │ │ ├─┬ @applitools/eyes-common@3.19.0
        │ ├─┬ @applitools/eyes-common@3.20.1
        │ ├─┬ @applitools/eyes-sdk-core@8.1.1
        │ │ ├─┬ @applitools/eyes-common@3.20.0
        │   ├─┬ @applitools/eyes-common@3.20.0
        │   ├── @applitools/eyes-sdk-core@8.1.1 deduped
        `
        const packageNames = ['@applitools/eyes-sdk-core', '@applitools/eyes-common']
        assert.throws(() => {
          checkPackagesForUniqueVersions(npmLsOutput, packageNames)
        }, /Non-unique package versions found of @applitools\/eyes\-common/)
      })
    })
  })
})
