// check window with default fully with vg
describe("Coverage tests", () => {
    it("check window with default fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "CheckWindowDefaultFully_VG", displayName: "check window with default fully with vg", viewportSize: {width: 700, height: 460}, branchName: "universal-sdk"})
        cy.eyesCheckWindow({})
        cy.eyesClose(undefined)
    })
})