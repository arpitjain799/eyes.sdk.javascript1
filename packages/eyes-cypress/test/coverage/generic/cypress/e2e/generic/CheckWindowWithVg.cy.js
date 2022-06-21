// check window with vg
describe("Coverage tests", () => {
    it("check window with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "TestCheckWindow_VG", displayName: "check window with vg", viewportSize: {width: 700, height: 460}, branchName: "universal-sdk"})
        cy.eyesCheckWindow({isFully: false, fully: false})
        cy.eyesClose(undefined)
    })
})