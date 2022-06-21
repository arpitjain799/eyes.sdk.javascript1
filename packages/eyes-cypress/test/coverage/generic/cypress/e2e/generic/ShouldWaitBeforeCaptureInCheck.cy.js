// should waitBeforeCapture in check
describe("Coverage tests", () => {
    it("should waitBeforeCapture in check", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/SimpleTestPage/index.html")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "ShouldWaitBeforeCaptureInCheck", displayName: "should waitBeforeCapture in check", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({name: "session opening is finished", isFully: false, tag: "session opening is finished", fully: false})
        cy.visit("https://applitools.github.io/demo/TestPages/waitBeforeCapture/dynamicDelay.html?delay=5000")
        cy.eyesCheckWindow({name: "should show smurf", isFully: true, waitBeforeCapture: 6000, tag: "should show smurf", fully: true})
        cy.visit("https://applitools.github.io/demo/TestPages/waitBeforeCapture/dynamicDelay.html?delay=5000")
        cy.eyesCheckWindow({name: "should be blank", isFully: true, tag: "should be blank", fully: true})
        cy.eyesClose(undefined)
    })
})