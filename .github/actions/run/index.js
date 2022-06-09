import * as core from '@actions/core'
import {spawn} from 'child_process'

const workflow = core.getInput('workflow', {required: true})
const ref = core.getInput('ref')

const run0 = spawn(`echo 'hello world'`, {
  stdio: 'inherit'
})

const run0 = spawn(`gh --help`, {
  stdio: 'inherit'
})
const run = spawn(`gh workflow run ${workflow} --ref ${ref ?? '$(git rev-parse --abbrev-ref HEAD)'}`, {
  stdio: 'inherit'
})
