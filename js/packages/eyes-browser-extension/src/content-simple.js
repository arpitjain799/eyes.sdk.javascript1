import browser from 'webextension-polyfill'

const apiScript = document.createElement('script')
apiScript.src = browser.runtime.getURL('api-simple.js')
window.document.body.appendChild(apiScript)
