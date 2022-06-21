// check overflowed region by coordinates with vg
describe("Coverage tests", () => {
    it("check overflowed region by coordinates with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckOverflowingRegionByCoordinates_Fluent_VG", displayName: "check overflowed region by coordinates with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: {left: 50, top: 110, width: 90, height: 550}, target: "region"})
        cy.eyesClose(undefined)
    })
})