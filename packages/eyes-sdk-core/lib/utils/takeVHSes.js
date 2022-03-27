async function takeVHSes({driver, browsers, apiKey, waitBeforeCapture, logger}) {
  logger.log('taking VHS')
  if (waitBeforeCapture) await waitBeforeCapture()

  const context = driver.currentContext

  if (driver.isAndroid) {
    const apiKeyInput = await context.element({type: 'accessibility id', selector: 'UFG_Apikey'})
    if (!apiKeyInput) {
      throwError('UFG_Apikey element could not be found')
    }
    await apiKeyInput.type(apiKey)
    const ready = await context.element({type: 'accessibility id', selector: 'UFG_ApikeyReady'})
    if (!ready) {
      throwError('UFG_ApikeyReady element could not be found')
    }
    await ready.click()
  }

  const trigger = await context.element({type: 'accessibility id', selector: 'UFG_TriggerArea'})
  if (!trigger) {
    throwError('UFG_TriggerArea element could not be found')
  }
  await trigger.click()

  const label = await context.waitFor({type: 'accessibility id', selector: 'UFG_SecondaryLabel'})
  if (!label) {
    throwError('UFG_SecondaryLabel element could not be found')
  }
  const info = JSON.parse(await label.getText())

  logger.log('VHS info', info)

  if (info.error) {
    throwError(info.error)
  }

  let vhs
  if (driver.isIOS) {
    vhs = await extractVHS()
  } else if (info.mode === 'labels') {
    vhs = await collectChunkedVHS({count: info.partsCount})
  } else if (info.mode === 'network') {
    // TODO
  } else {
    throwError(`unknown mode for android: ${info.mode}`)
  }

  const clear = await context.element({type: 'accessibility id', selector: 'UFG_ClearArea'})
  if (!clear) {
    throwError('UFG_ClearArea element could not be found')
  }
  await clear.click()

  const snapshot = {vhs}

  if (driver.isAndroid) {
    snapshot.platformName = 'android'
    snapshot.vhsType = info.flavorName
    snapshot.vhsHash = {
      hashFormat: 'sha256',
      hash: info.vhsHash,
      contentType: `x-applitools-vhs/${snapshot.vhsType}`,
    }
  } else if (driver.isIOS) {
    snapshot.platformName = 'ios'
    snapshot.resourceContents = {
      vhs: {
        value: Buffer.from(vhs, 'base64'),
        type: 'x-applitools-vhs/ios',
      },
    }
    snapshot.vhsCompatibilityParams = {
      UIKitLinkTimeVersionNumber: info.UIKitLinkTimeVersionNumber,
      UIKitRunTimeVersionNumber: info.UIKitRunTimeVersionNumber,
    }
  }

  return {snapshots: Array(browsers.length).fill(snapshot)}

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

function throwError(msg) {
  throw new Error(`Error while taking VHS - ${msg}`)
}

module.exports = takeVHSes
