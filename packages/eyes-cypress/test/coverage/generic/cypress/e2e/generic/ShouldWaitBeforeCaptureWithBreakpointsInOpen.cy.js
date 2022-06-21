// should waitBeforeCapture with breakpoints in open
describe("Coverage tests", () => {
    it("should waitBeforeCapture with breakpoints in open", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/waitBeforeCapture")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "ShouldWaitBeforeCaptureWithBreakpointsInOpen", displayName: "should waitBeforeCapture with breakpoints in open", viewportSize: {width: 600, height: 600}, browser: [{name: "chrome", width: 1200, height: 800}], layoutBreakpoints: true, waitBeforeCapture: 2000})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})