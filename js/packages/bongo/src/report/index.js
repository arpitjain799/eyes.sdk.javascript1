const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const {sendTestReport, sendReleaseNotification, sendToStorage} = require('./send')
const {createReport} = require('./create')
const {getLatestReleaseEntries} = require('../changelog')

function makeSendReleaseNotification({name, version, changeLog, testCoverageGap}, recipient) {
  return async () => {
    const payload = {
      sdk: name,
      version,
      changeLog,
      testCoverageGap,
      specificRecipient: recipient,
    }
    const result = await sendReleaseNotification({payload, name})
    if (!result.isSuccessful)
      throw new Error(
        `There was a problem sending the release notification: status ${result.status} with message ${result.message}`,
      )
  }
}

async function createAndSendTestReport({name, group, reportId, metaPath, resultPath, sandbox, skipStorage}) {
  const cwd = process.cwd()
  const junit = fs.readFileSync(path.resolve(cwd, resultPath ? resultPath : '', 'coverage-test-report.xml'), {
    encoding: 'utf-8',
  })
  let metadata
  try {
    metadata = require(path.resolve(cwd, metaPath ? metaPath : '', 'coverage-tests-metadata.json'))
  } catch (error) {
    console.log(chalk.red('No metadata file found'))
  }

  const report = createReport({
    reportId,
    name,
    group,
    sandbox,
    junit,
    metadata,
  })

  console.log('Report was successfully generated!\n')
  if (report.id) {
    console.log(`${chalk.bold('Report ID')}: ${report.id}\n`)
  }

  const total = report.results.length
  const {passed, failed, skipped, generic, custom} = report.results.reduce(
    (counts, result) => {
      if (result.isGeneric) counts.generic += 1
      else counts.custom += 1
      if (result.isSkipped) counts.skipped += 1
      else if (result.passed) counts.passed += 1
      else counts.failed += 1

      return counts
    },
    {passed: 0, failed: 0, skipped: 0, generic: 0, custom: 0},
  )

  console.log(
    `${chalk.bold(`${total}`.padEnd(3))} total including ${chalk.blue.bold(
      `${generic} generic`,
    )} and ${chalk.magenta.bold(`${custom} custom`)} test(s)`,
  )
  console.log(chalk.green(`${chalk.bold(`${passed}`.padEnd(3))} passed test(s)`))
  console.log(chalk.cyan(`${chalk.bold(`${skipped}`.padEnd(3))} skipped test(s)`))
  console.log(chalk.red(`${chalk.bold(`${failed}`.padEnd(3))} failed test(s)`))

  process.stdout.write(`\nSending report to QA dashboard ${sandbox ? '(sandbox)' : ''}... `)
  const result = await sendTestReport(report)
  process.stdout.write(result.isSuccessful ? chalk.green('Done!\n') : chalk.red('Failed!\n'))
  if (!result.isSuccessful) {
    console.log(result.message)
  }
  if (!skipStorage) {
    await sendToStorage({
      sdkName: name,
      reportId: reportId,
      isSandbox: sandbox,
      payload: JSON.stringify(report),
    }).catch(err => {
      console.log(chalk.gray('Error sending results to storage:', err.message))
    })
  }
}

module.exports = {
  sendTestReport: createAndSendTestReport,
  sendReleaseNotification: async ({name, version, targetFolder, recipient}) => {
    if (!version) ({version} = require(path.resolve(targetFolder, 'package.json')))

    const send = makeSendReleaseNotification(
      {
        name,
        version,
        changeLog: getLatestReleaseEntries({targetFolder}).join('\n'),
        testCoverageGap: 'TODO', // track in a file in the package, get it from there
      },
      recipient,
    )
    try {
      await send()
    } catch (error) {
      await send()
    }
  },
}
