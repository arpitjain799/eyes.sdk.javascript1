#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const {execSync} = require('child_process')
const yargs = require('yargs')

yargs
  .usage('link <link-packages> [options]')
  .command({
    command: '* <link-packages>',
    builder: yargs =>
      yargs.options({
        linkPackages: {
          alias: ['include'],
          description: 'Package names to link',
          type: 'string',
          coerce: string => string.split(/[\s,]+/)
        },
        packagePath: {
          alias: ['package'],
          description: 'Path to the target package',
          type: 'string',
        },
        packagesPath: {
          alias: ['root'],
          description: 'Path to the root directory of the local packages',
          type: 'string',
        },
        runInstall: {
          alias: ['install'],
          description: 'Run `yarn install` before link package',
          type: 'boolean',
          default: false,
        },
        runBuild: {
          alias: ['build'],
          description: 'Run `yarn build` if needed before link package',
          type: 'boolean',
          default: true,
        },
      }),
    handler: async args => {
      try {
        if (args.unlink) await unlink(args)
        else await link(args)
      } catch (err) {
        console.error(err)
        process.exit(1)
      }
    },
  })
  .help().argv

async function link({
  linkPackages = [],
  packagePath = process.cwd(),
  packagesPath = path.resolve(packagePath, '..'),
  runInstall = false,
  runBuild = true,
} = {}) {
  const packageManifest = JSON.parse(fs.readFileSync(path.resolve(packagePath, 'package.json'), {encoding: 'utf8'}))
  const packages = getPackages(packagesPath)
  const package = packages[packageManifest.name]
  if (!package) throw new Error('Package not found!')

  linkPackages = Object.values(packages).filter(package => linkPackages.some(linkName => [package.name, package.dirname, ...package.aliases].includes(linkName)))

  for (const linkPackage of linkPackages) {
    const commands = ['yarn link']
    if (runInstall || runBuild) commands.push('yarn install', 'npm run upgrade:framework --if-present')
    if (runBuild) commands.push('npm run build --if-present')
    execSync(commands.join(' && '), {cwd: path.resolve(packagesPath, linkPackage.dirname), encoding: 'utf8'})
  }

  for (const targetPackage of [package, ...linkPackages]) {
    const linkCommands = linkPackages.map(linkPackage => `yarn link ${linkPackage.name}`)
    execSync(linkCommands.join(' && '), {cwd: path.resolve(packagesPath, targetPackage.dirname), encoding: 'utf8'})
  }
}

function getPackages(packagesPath) {
  const packageDirs = fs.readdirSync(packagesPath)
  return packageDirs.reduce((packages, packageDir) => {
    const packageManifestPath = path.resolve(packagesPath, packageDir, 'package.json')
    if (fs.existsSync(packageManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(packageManifestPath, {encoding: 'utf8'}))
      packages[manifest.name]  = {
        name: manifest.name,
        dirname: packageDir,
        aliases: manifest.aliases || [],
        dependencies: [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})]
      }
    }
    return packages
  }, {})
}
