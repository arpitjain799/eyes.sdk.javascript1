'use strict';
const {describe, it, before, after} = require('mocha');
const cypress = require('cypress')
const path = require('path');
const {exec} = require('child_process');
const {promisify: p} = require('util');
const pexec = p(exec);
const {expect} = require('chai');

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

    it('works for executeScript', async () => {
        await runCypress('executeScript')
        .then((results) => {
            expect(results.runs[0].tests[0].state).to.equal( 'passed');
          })
          .catch((err) => {
            console.error(err)
          })
    })

    it.only('works for findElement', async () => {
        await runCypress('findElement')
        .then((results) => {
            for(const test of results.runs[0].tests) {
                expect(test.state).to.equal( 'passed');
            }
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
        pluginsFile: path.resolve(__dirname, '../setup/fixtures/cypress/plugins/index-bla-plugin.js'),
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
        pluginsFile: path.resolve(__dirname, '../setup/fixtures/cypress/plugins/index-bla-plugin.js'),
        supportFile: path.resolve(__dirname, '../setup/fixtures/cypress/support/spec-driver.js'),
        integrationFolder: path.resolve(__dirname, '../setup/fixtures/cypress/integrations')
        },
    })
}