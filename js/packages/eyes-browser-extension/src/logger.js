export function makeLog({isDisabled} = {}) {
  return function (message) {
    if (isDisabled) return
    console.log('eyes-browser-extension:', message)
  }
}
