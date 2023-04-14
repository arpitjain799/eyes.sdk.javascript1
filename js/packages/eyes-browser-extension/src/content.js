import browser from 'webextension-polyfill'
import {makeRefer} from '@applitools/spec-driver-browser-extension'
import {makeMessenger} from './messenger'
import {makeUnmark} from './marker'
import {makeLog} from './logger'

const log = makeLog()

const apiScript = document.createElement('script')
apiScript.src = browser.runtime.getURL('api.js')
window.document.body.appendChild(apiScript)
log('Injected api.js into the AUT')

window.refer = makeRefer({
  check: element => element instanceof Node,
  validate: element => {
    if (!element || !element.isConnected) {
      throw new Error('StaleElementReferenceError')
    }
  },
})
log('Created element refer')

Node.toJSON = function () {
  return window.refer.ref(this)
}
log('Prepared alternative toJSON function')

const originalParse = JSON.parse.bind(JSON)
JSON.parse = function (string, reviver) {
  return originalParse(string, (key, value) => {
    if (window.refer.isRef(value)) return window.refer.deref(value)
    return reviver ? reviver(key, value) : value
  })
}
log('Prepared alternative JSON.parse function')

const unmark = makeUnmark({refer: window.refer})
log('Created element unmarker')

// These messengers are required because user API cannot directly communicate with background script
const apiMessenger = makeMessenger({
  onMessage: fn => window.addEventListener('applitools-message', ({detail}) => fn(unmark(detail))),
  sendMessage: detail => window.dispatchEvent(new CustomEvent('applitools-message', {detail})),
})
log('Prepared api event listener')
const frameMessenger = makeMessenger({
  onMessage: fn => window.addEventListener('message', ({data}) => data.isApplitools && fn(data)),
  sendMessage: data => window.postMessage({...data, isApplitools: true}, '*'),
})
log('Prepared frame event listener')
const backgroundMessenger = makeMessenger({
  onMessage: fn => browser.runtime.onMessage.addListener(message => fn(message)),
  sendMessage: message => browser.runtime.sendMessage(message),
})
log('Prepared background event listener')

// NOTE: Listen for commands from page/api script.
apiMessenger.command(async (name, payload) => backgroundMessenger.request(name, payload))

// NOTE: Listen for one single command triggered from childContext in spec driver
// This is a workaround to get frameId of cross origin iframe
frameMessenger.on('*', (_, type) => backgroundMessenger.emit(type))

// NOTE: Listen for events initiated by the background script
backgroundMessenger.on('*', async (payload, name) => apiMessenger.emit(name, payload))
log('Configured listeners')

/*
To use, run the following command from the dev tools console on the page being tested:

  window.postMessage({type: 'ping'})

For a successful run you should see the following console output:

  Content script received (from the page): ping
  Content script received (from the background worker): pong
*/
window.addEventListener(
  'message',
  async event => {
    // We only accept messages from ourselves
    if (event.source !== window) {
      return
    }

    if (event.data.type && event.data.type === 'ping') {
      console.log('Content script received (from the page):', event.data.type)
      const result = await backgroundMessenger.request('ping')
      console.log('Content script received (from the background worker):', result)
    }
  },
  false,
)
log('Created health check listener')

log('Done')
