import * as core from '@actions/core'
import * as github from '@actions/github'

const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
const run = core.getState('run')


const response = await octokit.rest.actions.getWorkflowRunAttempt({
  owner: github.context.repo.owner,
  repo: github.context.repo.repo,
  run_id: github.context.runId,
  attempt_number: github.context.runNumber,
})
console.log('POST!')
console.log(process.env)
console.log(response.data)

console.log(run)
