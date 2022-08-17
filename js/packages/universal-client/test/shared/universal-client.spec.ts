import {ChildProcess} from 'child_process'
import {describe, it} from 'mocha'
import {expect} from 'chai'
import {UniversalClient} from '../../src/shared/universal-client'
import * as types from '@applitools/types'

type Driver = string
type Element = string
type Selector = string

class FakeUniversalClient extends UniversalClient<Driver, Element, Selector> {
  private _responses

  constructor(responses) {
    super()
    this._responses = responses
  }

  protected _transform = async x => x
}

describe('UniversalClient', () => {
  it('works', async () => {
    const driver = 'fake driver'
    const eyesConfig = {testName: 'fake test'}
    const eyesConfig2 = {testName: 'fake test 2'}
    const checkSettings = {name: 'fake step'}
    const managerConfig: types.EyesManagerConfig = {type: 'vg', concurrency: 3}

    const expectedOutput = {
      eyes: {
        manager: managerConfig,
        driver,
        config: eyesConfig,
      },
      settings: checkSettings,
      config: eyesConfig2,
    }

    const client = new FakeUniversalClient({
      'Core.makeManager': payload => payload,
      'EyesManager.openEyes': payload => payload,
      'Eyes.check': payload => payload,
    })
    const manager = await client.makeManager(managerConfig)
    const eyes = await manager.openEyes({driver, config: eyesConfig})
    const matchResult = await eyes.check({settings: checkSettings, config: eyesConfig2})
    expect(matchResult).to.eql(expectedOutput)
  })
})
