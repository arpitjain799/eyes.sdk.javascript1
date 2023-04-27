import {makeDriver, type SpecType, type Driver} from '@applitools/driver'
import {MockDriver, spec} from '@applitools/driver/fake'
import {makeLogger} from '@applitools/logger'
import {takeDomCapture} from '../../../src/classic/utils/take-dom-capture'
import nock from 'nock'
import assert from 'assert'

describe('take-dom-capture', () => {
  const logger = makeLogger()
  let mock: MockDriver, driver: Driver<SpecType<MockDriver>>

  function createDomCapture(domCapture: string) {
    const tokens = {
      separator: '-----',
      cssStartToken: '#####',
      cssEndToken: '#####',
      iframeStartToken: '@@@@@',
      iframeEndToken: '@@@@@',
    }

    const result = [
      JSON.stringify(tokens),
      extract(tokens.cssStartToken, tokens.cssEndToken).join('\n'),
      tokens.separator,
      extract(tokens.iframeStartToken, tokens.iframeEndToken).join('\n'),
      tokens.separator,
      domCapture,
    ]

    return result.join('\n')

    function extract(start: string, end: string) {
      const regexp = new RegExp(`${start}(.*?)${end}`, 'g')
      const matches = []
      let match
      while ((match = regexp.exec(domCapture))) {
        matches.push(match[1])
      }
      return matches
    }
  }

  beforeEach(async () => {
    mock = new MockDriver()
    mock.mockElements([
      {
        selector: 'frame1',
        frame: true,
        isCORS: true,
        children: [{selector: 'frame1-1', frame: true, isCORS: true}],
      },
      {
        selector: 'frame2',
        frame: true,
        children: [{selector: 'frame2-2', frame: true, isCORS: true}],
      },
    ])
    driver = await makeDriver({spec, driver: mock})
  })

  it('works', async () => {
    mock.mockScript('dom-capture', () => {
      return JSON.stringify({status: 'SUCCESS', value: createDomCapture('dom capture')})
    })

    const result = await takeDomCapture({driver, logger})

    assert.strictEqual(result, 'dom capture')
  })

  it('works with polling', async () => {
    mock.mockScript('dom-capture', function (this: any) {
      this.poll = this.poll || 0
      if (this.poll === 0) {
        this.domCapture = createDomCapture('dom capture')
      }
      const result =
        this.poll <= 3 ? JSON.stringify({status: 'WIP'}) : JSON.stringify({status: 'SUCCESS', value: this.domCapture})
      this.poll += 1
      return result
    })

    const result = await takeDomCapture({driver, logger})

    assert.strictEqual(result, 'dom capture')
  })

  it('handles frames', async () => {
    mock.mockScript('dom-capture', function (this: any) {
      let value
      if (this.name === null) {
        value = createDomCapture('main frame dom capture [@@@@@frame1@@@@@] [@@@@@frame2,frame2-2@@@@@]')
      } else if (this.name === 'frame1') {
        value = createDomCapture('frame1 dom capture [@@@@@frame1-1@@@@@]')
      } else if (this.name === 'frame1-1') {
        value = createDomCapture('frame1-1 dom capture')
      } else if (this.name === 'frame2-2') {
        value = createDomCapture('frame2-2 dom capture')
      }
      return JSON.stringify({status: 'SUCCESS', value})
    })

    const result = await takeDomCapture({driver, logger})

    assert.strictEqual(
      result,
      'main frame dom capture [frame1 dom capture [frame1-1 dom capture]] [frame2-2 dom capture]',
    )
  })

  it('handles error response', async () => {
    mock.mockScript('dom-capture', () => {
      return JSON.stringify({status: 'ERROR', error: 'Oops! Something went wrong!'})
    })

    assert.rejects(
      takeDomCapture({driver, logger}),
      `Error during capture dom and pull script: 'Oops! Something went wrong!'`,
    )
  })

  it('stops execution if timeout is reached', async () => {
    mock.mockScript('dom-capture', () => {
      return JSON.stringify({status: 'WIP'})
    })

    assert.rejects(takeDomCapture({driver, settings: {executionTimeout: 1000}, logger}), 'dom-capture Timed out')
  })

  it('handles css', async () => {
    nock('http://css.com').get('/main.css').delay(1000).reply(200, 'very big css file')

    mock.mockScript('dom-capture', () => {
      return JSON.stringify({
        status: 'SUCCESS',
        value: createDomCapture('dom capture (#####http://css.com/main.css#####)'),
      })
    })

    const result = await takeDomCapture({driver, logger})

    assert.strictEqual(result, 'dom capture (very big css file)')
  })

  it('stops fetching css if fetch timeout is reached', async () => {
    nock('http://css.com').get('/main.css').delay(500).reply(200, 'css content')

    mock.mockScript('dom-capture', () => {
      return JSON.stringify({
        status: 'SUCCESS',
        value: createDomCapture('dom capture (#####http://css.com/main.css#####)'),
      })
    })

    const result = await takeDomCapture({driver, settings: {fetchTimeout: 100}, logger})

    assert.strictEqual(result, 'dom capture ()')
  })
})
