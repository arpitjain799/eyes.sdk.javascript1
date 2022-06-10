import * as core from '@actions/core'
import * as github from '@actions/github'
import {setTimeout} from 'timers/promises'

console.log(workflow, ref)

async function main() {
  const workflowId = core.getInput('workflow', {required: true})
  const ref = core.getInput('ref')

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN)

  const result = await octokit.rest.actions.createWorkflowDispatch({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_id: workflowId,
    ref,
  });

  console.log(result)

  // await execp(`gh workflow run ${workflow} --ref ${ref}`)
  // await setTimeout(5000)



  // const workflowList = execSync(`gh run list --json databaseId --workflow ${workflow} --limit 1`, {encoding: 'utf8'})

  // console.log(g)

  // const [{databaseId}] = JSON.parse(g)

  // core.info(``)

  // console.log(execSync(`gh run watch ${databaseId} --exit-status`, {stdio: 'inherit'}))

}

main()