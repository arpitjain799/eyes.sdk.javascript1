import * as core from '@actions/core'
import {execSync} from 'child_process'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

console.log(workflow, ref)

async function main() {
  execSync('gh', ['workflow', 'run', workflow])
  const {stdout} = execSync('gh', ['run', 'list', '--json', 'databaseId', '--workflow', workflow, '--limit', '1'])

  console.log(stdout)

  const [{databaseId}] = JSON.parse(stdout)

  execSync('gh', ['run', 'watch', databaseId], {stdio: 'inherit'})

}

main()