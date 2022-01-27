'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

function startApp({managersUtils, logger = console} = {}) {
  const app = express();
  app.use(cors());
  app.get('/hb', (_req, res) => res.sendStatus(200));
  app.get('/err', (_req, res) => res.status(500).send('this is a test error'));

  app.post('/eyes/sendManager', express.json({limit: '100mb'}), async (req, res) => {
    try {
      managersUtils.setManager(req.body);
      res.status(200).send({success: true});
    } catch (ex) {
      logger.log('[server] error in eyes api:', ex);
      res.status(200).send({success: false, error: ex.message});
    }
  });

  app.get('/eyes/getAllManagers', async (req, res) => {
    try {
      res.status(200).send({success: true, managers: managersUtils.getAllManagers()});
    } catch (ex) {
      logger.log('[server] error in eyes api:', ex);
      res.status(200).send({success: false, error: ex.message});
    }
  });

  return app;
}

module.exports = {startApp};
