function eyesOpenMapValues({args, appliConfFile, testName, shouldUseBrowserHooks}) {
    const mappedArgs = {
        ...args,
        browsersInfo: args.browser
    }

    delete mappedArgs.browser

    return Object.assign(
        {testName, dontCloseBatches: !shouldUseBrowserHooks},
        appliConfFile,
        mappedArgs
    )
}

module.exports = {eyesOpenMapValues}