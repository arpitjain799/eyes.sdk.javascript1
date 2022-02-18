'use strict';
const {describe, it, before, after} = require('mocha');
const cypress = require('cypress')
const path = require('path');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const pexec = p(exec);
const {assert} = require('chai');

describe('spec-driver', () => {
    before(async () => {
        try {
            process.chdir(path.resolve(__dirname, '../setup/fixtures/cypress'));
            await pexec(`npm install`, {
                maxBuffer: 1000000,
            });
        } catch(ex){
            console.log(ex)
        }

      });

    it('works for spec-driver.spec.js', async () => {
        await runCypress('spec-driver')
        .then((results) => {
            const tests = results.runs[0].tests
            for(const res of tests){
                if(res.state != 'passed'){
                    throw `${res.title[0]} finished with status ${res.state}`
                }
            }
            assert(true)
          })
          .catch((err) => {
            console.error(err)
          })
    })

    it.skip('playground', async () => {
        await openCypress()
    })
})

function runCypress(spec){
    return cypress.run({
        reporter: 'junit',
        browser: 'chrome',
        headless: true,
        spec: `./integrations/${spec}.spec.js`,
        config: {
        video: false,
        pluginsFile: path.resolve(__dirname, '../setup/fixtures/cypress/plugins/index-spec-driver-plugin.js'),
        supportFile: path.resolve(__dirname, '../setup/fixtures/cypress/support/spec-driver.js'),
        integrationFolder: path.resolve(__dirname, '../setup/fixtures/cypress/integrations')
        },
    })
}

function openCypress(){
    return cypress.open({
        reporter: 'junit',
        browser: 'chrome',
        config: {
        video: false,
        pluginsFile: path.resolve(__dirname, '../setup/fixtures/cypress/plugins/index-spec-driver-plugin.js'),
        supportFile: path.resolve(__dirname, '../setup/fixtures/cypress/support/spec-driver.js'),
        integrationFolder: path.resolve(__dirname, '../setup/fixtures/cypress/integrations')
        },
    })
}