import * as core from '@actions/core'
import {spawnSync} from 'child_process'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

console.log(workflow, ref)

const run = spawnSync('gh', [`--version`], {
  encoding: 'utf8'
})

console.log(run)

setTimeout(() => console.log('HELLO!'), 10_000)