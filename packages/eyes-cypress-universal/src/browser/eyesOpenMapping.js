function eyesOpenMapValues({args, appliConfFile, testName, shouldUseBrowserHooks}) {
    
    let browsersInfo = args.browser || appliConfFile.browser

    if(!Array.isArray(browsersInfo))
        browsersInfo = [browsersInfo]
    
    const mappedArgs = {
        ...args,
        browsersInfo
    }

    delete mappedArgs.browser
    delete appliConfFile.browser

    return Object.assign(
        {testName, dontCloseBatches: !shouldUseBrowserHooks},
        appliConfFile,
        mappedArgs
    )
}

module.exports = {eyesOpenMapValues}