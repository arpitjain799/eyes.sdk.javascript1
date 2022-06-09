import * as core from '@actions/core'
import {execSync} from 'child_process'
import {setTimeout} from 'timers/promises'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

console.log(workflow, ref)

async function main() {
  execSync(`gh workflow run ${workflow}`)
  
  await setTimeout(5000)

  const g = execSync(`gh run list --json databaseId --workflow ${workflow} --limit 1`, {encoding: 'utf8'})

  console.log(g)

  const [{databaseId}] = JSON.parse(g)

  console.log(execSync(`gh run watch ${databaseId}`, {stdio: 'inherit'}))

}

main()