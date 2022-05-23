const { testsSupportedVersions } = require('./versions');
const { exec } = require('child_process');
const { promisify: p } = require('util');
const pexec = p(exec);
const path = require('path');

exports.mochaHooks = {
  beforeAll: async () => {
    for (const version of testsSupportedVersions) {
      const versionDir = path.resolve(__dirname, `./${version}`);  
      process.chdir(versionDir);
      await pexec(`npm install`, {
        maxBuffer: 1000000,
      });
    }
  }
};