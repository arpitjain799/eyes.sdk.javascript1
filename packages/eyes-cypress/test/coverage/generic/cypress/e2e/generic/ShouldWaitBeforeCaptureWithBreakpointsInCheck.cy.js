// should waitBeforeCapture with breakpoints in check
describe("Coverage tests", () => {
    it("should waitBeforeCapture with breakpoints in check", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/waitBeforeCapture")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "ShouldWaitBeforeCaptureWithBreakpointsInCheck", displayName: "should waitBeforeCapture with breakpoints in check", viewportSize: {width: 600, height: 600}, browser: [{name: "chrome", width: 1200, height: 800}]})
        cy.eyesCheckWindow({isFully: true, layoutBreakpoints: true, waitBeforeCapture: 2000, fully: true})
        cy.eyesClose(undefined)
    })
})