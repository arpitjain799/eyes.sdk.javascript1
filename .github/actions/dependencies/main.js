import * as core from '@actions/core'
import YAML from 'yaml'
import * as path from 'path'
import * as fs from 'fs/promises'

const cwd = process.cwd()
const workflowFilePath = path.resolve(cwd, '../../workflows/publish-new.yml')
const packagesPath = path.resolve(cwd, '../../../packages')

const workflow = YAML.parse(await fs.readFile(workflowFilePath, {encoding: 'utf8'}))

console.log(workflow)

const packages = await fs.readdir(packagesPath)

const dependencies = packages.map(async (packageDir) => {
  const packageManifestPath = path.resolve(packagesPath, packageDir, 'package.json')
  if (await fs.stat(packageManifestPath).catch(() => false)) {
    const manifest = JSON.parse(await fs.readFile(packageManifestPath, {encoding: 'utf8'}))
    
  }
})