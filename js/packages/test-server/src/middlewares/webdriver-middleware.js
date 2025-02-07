const express = require('express')
const body = require('body-parser')

const state = {}

module.exports = (req, res) => {
  const app = express()

  app.use(body.json())

  app.post('/session', (_req, res) => {
    res.status(201).send({value: {sessionId: 'session_id', capabilities: {browserName: 'test'}}})
  })

  app.post('/session/session_id/url', (req, res) => {
    state.url = req.body.url
    res.status(200).send({value: null})
  })

  app.get('/session/session_id/url', (_req, res) => {
    res.status(200).send({value: state.url})
  })

  app.delete('/session/session_id', (_req, res) => {
    res.status(200).send({value: null})
  })

  app(req, res)
}
