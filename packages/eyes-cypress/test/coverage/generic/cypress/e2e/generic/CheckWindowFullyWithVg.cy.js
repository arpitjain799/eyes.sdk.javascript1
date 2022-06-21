// check window fully with vg
describe("Coverage tests", () => {
    it("check window fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "TestCheckWindowFully_VG", displayName: "check window fully with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})