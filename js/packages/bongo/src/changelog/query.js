const path = require('path')
const {readFileSync} = require('fs')

// returns the entries for a given heading
// each entry has an index for where it is in the changelog
function getEntriesForHeading({changelogContents, targetHeading, includeHeading}) {
  let foundEntries = []
  let headingFound = false
  for (let [index, entry] of changelogContents.split('\n').entries()) {
    const _entry = entry.trim()
    if (headingFound && /^\s*##[^#]/.test(_entry)) break
    if (headingFound && _entry.length) foundEntries.push({entry, index})
    if (_entry === targetHeading) {
      if (includeHeading) foundEntries.push({entry, index})
      headingFound = true
    }
  }
  return foundEntries
}

function getChangelogContents(targetFolder) {
  return readFileSync(path.resolve(targetFolder, 'CHANGELOG.md'), 'utf8')
}

function getLatestReleaseEntries({changelogContents, targetFolder}) {
  if (!changelogContents) changelogContents = getChangelogContents(targetFolder)
  const targetHeading = getLatestReleaseHeading(changelogContents).heading
  const entries = getEntriesForHeading({changelogContents, targetHeading})
  return entries.map(entry => entry.entry)
}

function getLatestReleaseHeading(changelogContents) {
  let latestReleaseHeading = {}
  for (let [index, entry] of changelogContents.split('\n').entries()) {
    const _entry = entry.trim()
    if (/^\s*##[^#]/.test(_entry) && !_entry.includes('Unreleased')) {
      latestReleaseHeading.heading = _entry
      latestReleaseHeading.index = index
      break
    }
  }
  return latestReleaseHeading
}

function getReleaseNumberFromHeading(heading) {
  return heading.match(/([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2})/)[0]
}

function verifyChangelog(targetFolder) {
  try {
    const changelogContents = getChangelogContents(targetFolder)
    const {version} = require(path.resolve(targetFolder, 'package.json'))
    verifyChangelogContents({changelogContents, version})
  } catch (error) {
    if (/no such file or directory/.test(error.message)) {
      console.log('no changelog found')
      return
    }
    throw error
  }
}

function verifyChangelogContents({changelogContents}) {
  const unreleasedEntries = getEntriesForHeading({
    changelogContents,
    targetHeading: '## Unreleased',
  })
  if (unreleasedEntries.length)
    throw new Error(
      'Invalid changelog entries found. Unreleased changelog entries need to be added topending-changes.yml and reviewed prior to publishing.',
    )
}

module.exports = {
  getEntriesForHeading,
  getLatestReleaseEntries,
  getLatestReleaseHeading,
  getReleaseNumberFromHeading,
  verifyChangelogContents,
  verifyChangelog,
}
