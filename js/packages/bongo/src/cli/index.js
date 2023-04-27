#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const {
  removePendingChanges,
  verifyChangelog,
  verifyPendingChanges,
  writePendingChangesToChangelog,
  writeReleaseEntryToChangelog,
  getLatestReleaseEntries,
} = require('../changelog')
const {packInstall, lsDryRun} = require('../dry-run')
const {lint} = require('../lint')
const {sendTestReport, sendReleaseNotification} = require('../report')
const {createDotFolder} = require('../setup')
const {verifyCommits, verifyInstalledVersions, verifyVersions} = require('../versions')
const {gitAdd, gitCommit, gitPushWithTags, isChanged, gitStatus} = require('../git')
const {yarnInstall, yarnUpgrade, verifyUnfixedDeps} = require('../yarn')
const log = require('../log')
const released = require('../released')
const {makeDependencyTree, filterDependencyTreeByPackageName} = require('../../src/tree')
const {makePackagesList} = require('../../src/versions/versions-utils')

const pendingChangesFilePath = path.join(process.cwd(), '..', '..', '..', 'pending-changes.yaml')

yargs
  .config({cwd: process.cwd()})
  .command(
    ['tree'],
    'Show the publishing order of packages',
    {
      packageName: {alias: 'p', type: 'string'},
      all: {type: 'boolean', default: false},
      debug: {type: 'boolean', default: false},
    },
    args => {
      const {cwd, packageName, all, debug} = args
      const {tree, packages} = makeDependencyTree(makePackagesList())
      console.log('bongo tree')
      if (all) {
        console.log('showing publishing order for all packages')
        console.log(tree)
      } else if (packageName) {
        console.log(`showing publishing order for package ${packageName}`)
        console.log(filterDependencyTreeByPackageName(packageName, {tree, packages}))
      } else {
        const {name} = require(path.join(cwd, 'package.json'))
        console.log(`showing publishing order for package ${name}`)
        console.log(filterDependencyTreeByPackageName(name, {tree, packages}))
      }
      if (debug) {
        console.log('showing debug output for all packages')
        console.log(packages)
      }
    },
  )
  .command(
    ['released', 'release'],
    'Show which SDK versions contain a given package version or commit',
    {
      filterBySDK: {type: 'boolean', default: true},
      packageName: {alias: 'p', type: 'string'},
      sha: {type: 'string'},
      version: {alias: 'v', type: 'number'},
      versionsBack: {alias: 'n', type: 'number', default: 1},
      pendingChangesFilePath: {type: 'string', default: pendingChangesFilePath},
    },
    async args => {
      await released({args})
    },
  )
  .command(
    ['log', 'logs'],
    'Show commit logs for a given package',
    {
      packageName: {alias: 'p', type: 'string'},
      lowerVersion: {alias: 'lv', type: 'string'},
      upperVersion: {alias: 'uv', type: 'string'},
      expandAutoCommitLogEntries: {alias: 'expand', type: 'boolean', default: true},
      versionsBack: {alias: 'n', type: 'number', default: 3},
      listVersions: {alias: 'lsv', type: 'boolean'},
      splitByVersion: {alias: 'split', type: 'boolean', default: true},
      'latest-changelog': {type: 'boolean', default: false},
    },
    async args => {
      if (args['latest-changelog']) {
        try {
          console.log(getLatestReleaseEntries({targetFolder: args.cwd}).join('\n'))
        } catch (error) {
          // no-op
        }
      } else await log(args)
    },
  )
  .command(
    ['preversion', 'release-pre-check', 'pre-version'],
    'Run all verification checks pre-release',
    {
      skipVerifyInstalledVersions: {alias: 'sviv', type: 'boolean'},
      skipVerifyVersions: {alias: 'svv', type: 'boolean'},
      skipDeps: {alias: 'sd', type: 'boolean'},
      skipCommit: {alias: 'sc', type: 'boolean', default: false},
      verifyPendingChanges: {type: 'boolean', default: false},
      pendingChangesFilePath: {type: 'string', default: pendingChangesFilePath},
    },
    async args => {
      const {cwd, pendingChangesFilePath} = args
      if (!args.skipDeps) {
        console.log('[bongo preversion] yarn install')
        await yarnInstall()
      }
      console.log('[bongo preversion] lint')
      await lint(cwd)
      if (args.verifyPendingChanges) {
        console.log('[bongo preversion] verify changelog')
        verifyChangelog(cwd)
        console.log('[bongo preversion] verify pending changes')
        verifyPendingChanges({cwd, pendingChangesFilePath})
      }
      console.log('[bongo preversion] verify unfixed dependencies')
      verifyUnfixedDeps(cwd)
      if (!args.skipVerifyVersions) {
        console.log('[bongo preversion] verify commits')
        await verifyCommits({pkgPath: cwd}).catch(err => console.log(err.message))
      }
      try {
        console.log('[bongo preversion] verify versions')
        verifyVersions({pkgPath: cwd})
      } catch (err) {
        console.log(chalk.yellow(err.message))
      }
      if (!args.skipVerifyInstalledVersions) {
        console.log('[bongo preversion] verify installed versions')
        createDotFolder(cwd)
        await packInstall(cwd)
        await verifyInstalledVersions({
          pkgPath: cwd,
          installedDirectory: path.join('.bongo', 'dry-run'),
        })
      }
      await commitFiles(args)
      console.log('[bongo preversion] done!')
    },
  )
  .command(
    ['update-changelog'],
    'Create changelog entry with what is in pending changes',
    {
      pendingChangesFilePath: {type: 'string', default: pendingChangesFilePath},
    },
    async ({cwd, pendingChangesFilePath}) => {
      verifyChangelog(cwd)
      verifyPendingChanges({cwd, pendingChangesFilePath})

      writePendingChangesToChangelog({cwd, pendingChangesFilePath})
      removePendingChanges({cwd, pendingChangesFilePath})
      writeReleaseEntryToChangelog(cwd)

      await gitAdd(pendingChangesFilePath)
      await gitAdd('CHANGELOG.md')
      await gitCommit('[auto commit] updated changelog')
    },
  )
  .command(
    ['version'],
    'Supportive steps to version a package',
    {
      skipAdd: {alias: 'sa', type: 'boolean', default: false},
      withPendingChanges: {type: 'boolean', default: false},
      pendingChangesFilePath: {type: 'string', default: pendingChangesFilePath},
    },
    async ({cwd, skipAdd, withPendingChanges, pendingChangesFilePath}) => {
      if (withPendingChanges) {
        writePendingChangesToChangelog({cwd, pendingChangesFilePath})
        removePendingChanges({cwd, pendingChangesFilePath})
        writeReleaseEntryToChangelog(cwd)
        if (!skipAdd) {
          await gitAdd(pendingChangesFilePath)
          await gitAdd('CHANGELOG.md')
        }
      }
      // no commit here since it is implicitly handled as part of `yarn version`'s lifecycle script hooks
    },
  )
  .command(['postversion'], 'Supportive steps to after a package has been versioned', async () => {
    try {
      console.log('[bongo postversion] pushing with tags')
      await gitPushWithTags()
      console.log('[bongo postversion] done!')
    } catch (err) {
      console.log(chalk.yellow(err.message))
    }
  })
  .command(['lint', 'l'], 'Static code analysis ftw', {}, async ({cwd}) => await lint(cwd))
  .command(['verify-changelog', 'vch'], 'Verify changelog has unreleased entries', {}, ({cwd}) => verifyChangelog(cwd))
  .command(
    ['verify-commits', 'vco'],
    'Verify no unreleased changes for internal dependencies exist',
    {},
    async ({cwd}) => await verifyCommits({pkgPath: cwd}),
  )
  .command(['verify-versions', 'vv'], 'Verify consistent versions in relevant packages', {}, async ({cwd}) => {
    try {
      verifyVersions({pkgPath: cwd})
    } catch (err) {
      console.log(chalk.yellow(err.message))
    }
  })
  .command(['verify-installed-versions', 'viv'], 'Verify correct dependencies are installable', {}, async ({cwd}) => {
    createDotFolder(cwd)
    await packInstall(cwd)
    await verifyInstalledVersions({
      pkgPath: cwd,
      installedDirectory: path.join('.bongo', 'dry-run'),
    })
  })
  .command(['ls-dry-run', 'ls'], 'Display dependencies from a verify-installed-versions run', {}, () => lsDryRun())
  .command(
    ['send-release-notification'],
    'Send a notification that an sdk has been released',
    {
      recipient: {alias: 'r', type: 'string'},
      name: {alias: 'n', type: 'string', description: 'the sdk name'},
      version: {alias: 'v', type: 'string', description: 'the sdk version name'},
    },
    async args =>
      await sendReleaseNotification({
        name: args.name,
        version: args.version,
        targetFolder: args.cwd,
        recipient: args.recipient,
      }),
  )
  .command({
    command: ['send-test-report', 'report'],
    description: 'send a test report to QA dashboard',
    builder: yargs =>
      yargs.options({
        name: {
          alias: ['n'],
          description: 'the sdk name',
          type: 'string',
          demandOption: true,
        },
        group: {
          alias: ['g'],
          description: 'the sdk group',
          type: 'string',
        },
        version: {
          alias: ['v'],
          description: 'the sdk version (required for non-JS SDKs)',
          type: 'string',
        },
        reportId: {
          alias: ['id'],
          describe: 'id of the report which will be displayed at the dashboard',
        },
        resultDir: {
          alias: ['r', 'resultPath'],
          description: 'path to the junit xml file',
          type: 'string',
        },
        metaDir: {
          alias: ['m', 'metaPath'],
          description: 'path to the json metadata file generated with tests',
          type: 'string',
        },
        sandbox: {
          description: `send a result report to the sandbox QA dashboard instead of prod`,
        },
      }),
    handler: sendTestReport,
  })
  .command(
    ['deps', 'd'],
    'update internal deps',
    {
      commit: {type: 'boolean', default: false},
      upgradeAll: {type: 'boolean', default: false},
    },
    async args => {
      console.log('[bongo deps] running...')
      await deps(args)
      console.log('[bongo deps] updated deps. now committing...')
      await commitFiles(args)
      console.log('[bongo deps] done')
    },
  )
  .demandCommand(1, 'exit')
  .fail((msg, error, args) => {
    if (msg === 'exit') {
      return args.showHelp()
    }
    const command = process.argv[2]
    if (process.argv.includes('--verbose')) {
      console.log(error)
    } else {
      console.log(chalk.red(error.message))
      console.log(`run "npx bongo ${command} --verbose" to see stack trace`)
    }
    process.exit(1)
  })
  .wrap(yargs.terminalWidth())
  .help().argv

async function deps({cwd, upgradeAll}) {
  verifyUnfixedDeps(cwd)
  await yarnUpgrade({
    folder: cwd,
    upgradeAll,
  })
}

async function commitFiles({cwd, commit}) {
  if (commit) {
    console.log('[bongo] commit files running...\n', (await gitStatus()).stdout)
    const files = ['package.json', 'CHANGELOG.md', 'yarn.lock']
    for (const file of files) {
      // git add fails when trying to add files that weren't changed
      if (await isChanged(file)) {
        console.log(`[bongo] git add changed file: ${file}`)
        await gitAdd(file)
      }
    }

    // git commit fails when trying to commit files that weren't changed
    console.log(`[bongo] committing changed files:\n${(await gitStatus()).stdout}`)
    if (await isChanged(...files)) {
      const pkgName = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'))).name
      await gitCommit(`[auto commit] ${pkgName}: upgrade deps`)
      console.log(`[bongo] actually committed files`)
    }
  }
}
