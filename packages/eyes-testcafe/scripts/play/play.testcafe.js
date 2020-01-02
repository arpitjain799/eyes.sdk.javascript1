/* global fixture */

'use strict'

const {Configuration, StitchMode} = require('@applitools/eyes-common')
const {Eyes, Target, ConsoleLogHandler} = require('../..')

/*
 * Play with configuration and test :
 */

const eyes = new Eyes()
const configuration = new Configuration({
  stitchMode: StitchMode.SCROLL,
  viewportSize: {width: 600, height: 500},
})
eyes.setConfiguration(configuration)

if (process.env.APPLITOOLS_SHOW_LOGS || process.env.LIVE) {
  eyes.setLogHandler(new ConsoleLogHandler(true))
}

fixture`Play`.page`https://applitools.com/helloworld`

test('Play', async t => {
  await eyes.open(t, 'Play Testcafe', 'play testcafe')
  await eyes.check('page play', Target.window().fully())
  const result = await eyes.close()
  console.log('Play result', result)
})

// test('Play', async t => {
//   // await t.resizeWindow(600, 500)
//   // await new Promise(r => setTimeout(r, 1000))
//   // await t.eval(() => {
//   //   document.documentElement.scrollLeft = 0
//   //   document.documentElement.scrollTop = 656
//   // })
//   const name = new Date().toISOString().replace(/:/g, '_')
//   const image = await t.takeScreenshot(`./render-${name}.png`)
//   console.log('XXXXXXXXX: image', image)
// })
