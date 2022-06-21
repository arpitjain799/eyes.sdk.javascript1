// should waitBeforeCapture in open
describe("Coverage tests", () => {
    it("should waitBeforeCapture in open", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/waitBeforeCapture/dynamicDelay.html?delay=1000")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "ShouldWaitBeforeCaptureInOpen", displayName: "should waitBeforeCapture in open", viewportSize: {width: 700, height: 460}, waitBeforeCapture: 2000})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})