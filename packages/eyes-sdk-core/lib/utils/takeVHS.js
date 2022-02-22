const utils = require('@applitools/utils')

async function takeVHS({context, apiKey, waitBeforeCapture, logger}) {
  if (waitBeforeCapture) await waitBeforeCapture()

  if (context.driver.isAndroid) {
    const apiKeyInput = await context.element({type: 'accessibility id', selector: 'UFG_Apikey'})
    await apiKeyInput.type(apiKey)
    const ready = await context.element({type: 'accessibility id', selector: 'UFG_ApikeyReady'})
    await ready.click()
  }

  const trigger = await context.element({type: 'accessibility id', selector: 'UFG_TriggerArea'})
  await trigger.click()

  const label = await context.waitFor({type: 'accessibility id', selector: 'UFG_SecondaryLabel'})
  const info = JSON.parse(await label.getText())
  console.log(info)

  let content
  if (context.driver.isIOS) {
    content = await extractVHS()
  } else if (info.mode === 'labels') {
    content = await collectChunkedVHS({count: info.partsCount})
  }

  const clear = await context.element({type: 'accessibility id', selector: 'UFG_ClearArea'})
  await clear.click()

  const vhs = {value: content}

  if (context.driver.isAndroid) {
    vhs.hash = info.vhsHash
  } else if (context.driver.isIOS) {
    vhs.options = {
      UIKitLinkTimeVersionNumber: info.UIKitLinkTimeVersionNumber,
      UIKitRunTimeVersionNumber: info.UIKitRunTimeVersionNumber,
    }
  }

  return vhs

  async function extractVHS() {
    const label = await context.element({type: 'accessibility id', selector: 'UFG_Label'})
    return await label.getText()
  }

  async function collectChunkedVHS({count}) {
    const labels = [
      await context.element({type: 'accessibility id', selector: 'UFG_Label_0'}),
      await context.element({type: 'accessibility id', selector: 'UFG_Label_1'}),
      await context.element({type: 'accessibility id', selector: 'UFG_Label_2'}),
    ]

    let vhs = ''
    for (let chunk = 0; chunk < count / labels.length; ++chunk) {
      for (let label = 0; label < Math.min(labels.length, count - chunk * labels.length); ++label) {
        vhs += await labels[label].getText()
      }

      if (chunk * labels.length < count) {
        await trigger.click()
      }
    }
    return vhs
  }
}

module.exports = takeVHS
