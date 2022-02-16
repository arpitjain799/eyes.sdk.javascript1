'use strict';
const {describe, it, afterEach} = require('mocha');
const {expect} = require('chai');
const fetch = require('../../util/fetchWithNoCAVerify');
const {promisify: p} = require('util');
const {startApp} = require('../../../src/plugin/app');
const psetTimeout = p(setTimeout);
const https = require('https');
const fs = require('fs');
const path = require('path');

function listen(app) {
  const server = https.createServer(
    {
      key: fs.readFileSync(path.resolve(__dirname, '../../../src/pem/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../../src/pem/server.cert')),
    },
    app,
  );
  return new Promise(resolve => {
    server.listen(0, () => {
      resolve({
        port: server.address().port,
        close: server.close.bind(server),
      });
    });
  });
}

describe('app', () => {
  let close;
  const dataToSend = {someKey: 'blablabla'};

  afterEach(async () => {
    await close();
  });

  it('handles cors', async () => {
    const app = await startApp();
    const server = await listen(app);
    const {port} = server;
    close = server.close;
    const resp = await fetch(`https://localhost:${port}/hb`);
    expect(resp.status).to.equal(200);
    expect(resp.headers.get('access-control-allow-origin')).to.equal('*');
  });

});
