// check frame with vg
describe("Coverage tests", () => {
    it("check frame with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "TestCheckFrame_VG", displayName: "check frame with vg", viewportSize: {width: 700, height: 460}, branchName: "universal-sdk"})
        cy.eyesCheckWindow({frames: ["[name=\"frame1\"]"]})
        cy.eyesClose(undefined)
    })
})