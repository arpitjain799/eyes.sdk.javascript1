// should work with beforeCaptureScreenshot hook with vg
describe("Coverage tests", () => {
    it("should work with beforeCaptureScreenshot hook with vg", () => {
        cy.visit("https://applitools.com/helloworld")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "ShouldWorkWithBeforeCaptureScreenshotHookWithVg", displayName: "should work with beforeCaptureScreenshot hook with vg", browser: [{name: "chrome", width: 800, height: 600}]})
        cy.eyesCheckWindow({isFully: true, hooks: {beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'"}, fully: true, scriptHooks: {beforeCaptureScreenshot: "document.body.style.backgroundColor = 'gold'"}})
        cy.eyesClose(undefined)
    })
})