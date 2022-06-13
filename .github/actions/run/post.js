import * as core from '@actions/core'
import * as github from '@actions/github'

const octokit = github.getOctokit(process.env.GITHUB_TOKEN)
const status = core.getState('status')

if (status === 'in_progress'){
  const run = core.getState('run')

  await octokit.rest.actions.cancelWorkflowRun({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: run.id,
  })
}
