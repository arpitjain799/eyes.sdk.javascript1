import * as core from '@actions/core'
import YAML from 'yaml'
import * as path from 'path'
import * as fs from 'fs/promises'

const PACKAGES_TO_NAMES = {
  // #region BASE
  '@applitools/types': 'types',
  '@applitools/utils': 'utils',
  // #endregion

  // #region TEST BASE
  '@applitools/test-utils': 'test-utils',
  '@applitools/test-server': 'test-server',
  // #endregion

  // #region TOOLING
  '@applitools/scripts': 'scripts',
  '@applitools/bongo': 'bongo',
  // #endregion

  // #region MODULES
  '@applitools/snippets': 'snippets',
  '@applitools/logger': 'logger',
  '@applitools/screenshoter': 'screenshoter',
  '@applitools/driver': 'driver',
  // #endregion
  
  // #region CORE
  '@applitools/eyes-sdk-core': 'core',
  '@applitools/visual-grid-client': 'ufg-client',
  '@applitools/execution-grid-client': 'eg-client',
  '@applitools/eyes-api': 'api',
  // #endregion

  // #region SPEC DRIVER
  '@applitools/spec-driver-playwright': 'spec-playwright',
  '@applitools/spec-driver-puppeteer': 'spec-puppeteer',
  '@applitools/spec-driver-webdriverio': 'spec-webdriverio',
  '@applitools/spec-driver-selenium': 'spec-selenium',
  // #endregion

  // #region SDKS
  '@applitools/eyes-universal': 'universal',
  '@applitools/eyes-playwright': 'playwright',
  '@applitools/eyes-puppeteer': 'puppeteer',
  '@applitools/eyes-webdriverio': 'webdriverio',
  '@applitools/eyes-selenium': 'selenium',
  '@applitools/eyes-protractor': 'protractor',
  '@applitools/eyes-nightwatch': 'nightwatch',
  '@applitools/eyes-testcafe': 'testcafe',
  '@applitools/eyes-cypress': 'cypress',
  '@applitools/eyes-storybook': 'storybook',
  '@applitools/eyes-browser-extension': 'browser-extension',
  // #endregion
}

const NAMES_TO_PACKAGES = Object.fromEntries(Object.entries(PACKAGES_TO_NAMES).map(([key, value]) => [value, key]))

const cwd = process.cwd()
const workflowFilePath = path.resolve(cwd, '../../workflows/publish-new.yml')
const packagesPath = path.resolve(cwd, '../../../packages')

const workflow = YAML.parseDocument(await fs.readFile(workflowFilePath, {encoding: 'utf8'}))

console.log(workflow.get('jobs').items)

// console.log(workflow)

const packages = await fs.readdir(packagesPath)

const dependencies = await packages.reduce(async (dependencies, packageDir) => {
  const packageManifestPath = path.resolve(packagesPath, packageDir, 'package.json')
  if (await fs.stat(packageManifestPath).catch(() => false)) {
    const manifest = JSON.parse(await fs.readFile(packageManifestPath, {encoding: 'utf8'}))
    return {
      ...(await dependencies),
      [manifest.name]: Object.keys({...manifest.dependencies, ...manifest.devDependencies}).filter(depName => /^@applitools\//.test(depName))
    }
  }
  return dependencies
}, Promise.resolve({}))

for(const {key: name, value: job} of workflow.get('jobs').items) {
  if (!NAMES_TO_PACKAGES[name.value]) {
    core.warning(`Unknown job "${name.value}"`)
    continue
  }

  if (!dependencies[NAMES_TO_PACKAGES[name.value]]) {
    core.warning(`No dependencies found for job "${name.value}" in package "${NAMES_TO_PACKAGES[name.value]}"`)
    continue
  }

  const needs = dependencies[NAMES_TO_PACKAGES[name.value]].flatMap(packageName => {
    if (!PACKAGES_TO_NAMES[packageName]) return []
    if (!workflow.get('jobs').has(PACKAGES_TO_NAMES[packageName])) return []
    return PACKAGES_TO_NAMES[packageName]
  })

  job.set('needs', workflow.createNode(needs, {flow: true}))
}

await fs.writeFile(workflowFilePath, YAML.stringify(workflow))