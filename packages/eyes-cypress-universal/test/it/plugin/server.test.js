'use strict';
const {describe, it} = require('mocha');
const {expect} = require('chai');
const makeStartServer = require('../../../src/plugin/server');

describe('plugin server', () => {
  it('starts at a random port', async () => {
    const startServer = makeStartServer();
    const {port, server} = await startServer();
    expect(port).to.not.be.NaN
    server.close()
  });
});
