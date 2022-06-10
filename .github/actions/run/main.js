import * as core from '@actions/core'
import * as  github from '@actions/github'
import {setTimeout} from 'timers/promises'

const workflowId = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

const octokit = github.getOctokit(process.env.GITHUB_TOKEN)

const run = await runWorkflow(workflowId)
core.info(`Workflow "${run.name}" is running: ${run.html_url}`)

await waitWorkflowRun(run)

async function runWorkflow(workflowId) {
  await octokit.rest.actions.createWorkflowDispatch({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    workflow_id: workflowId,
    ref,
  });

  return getRunningWorkflow(workflowId)

  async function getRunningWorkflow(workflowId) {
    const response = await octokit.rest.actions.listWorkflowRuns({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      workflow_id: workflowId,
      per_page: 1
    });

    const [run] = response.data.workflow_runs

    if (!['queued', 'in_progress'].includes(run.status)) {
      await setTimeout(3000)
      return getRunningWorkflow(workflowId)
    }

    return run
  }
}

async function waitWorkflowRun(run) {
  const response = await octokit.rest.actions.getWorkflowRunAttempt({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: run.id,
    attempt_number: run.run_attempt,
  });

  console.log(response)
}

