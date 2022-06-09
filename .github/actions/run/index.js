import * as core from '@actions/core'
import {spawn} from 'child_process'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

console.log(workflow, ref)

const run = spawn(`gh workflow run ${workflow}`, {
  shell: true,
  stdio: 'inherit'
}, console.log)

run.on('error', console.log)

setTimeout(() => console.log('HELLO!'), 10_000)