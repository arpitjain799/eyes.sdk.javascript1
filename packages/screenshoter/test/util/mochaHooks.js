const {makeDriver} = require('../e2e/e2e')

const drivers = new Map()

exports.mochaHooks = {
  async beforeAll() {
    global.getDriver = async function(args) {
      const key = JSON.stringify(args)
      let {driver, cleanup} = drivers.get(key) || {}
      if (!driver) {
        ;[driver, cleanup] = await makeDriver(args)
        drivers.set(key, {driver, cleanup})
      }
      return driver
    }
  },

  async afterAll() {
    for (const {cleanup} of drivers.values()) {
      await cleanup()
    }
  },
}
