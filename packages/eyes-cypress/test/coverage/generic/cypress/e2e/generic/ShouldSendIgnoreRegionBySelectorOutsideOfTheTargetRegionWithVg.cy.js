// should send ignore region by selector outside of the target region with vg
describe("Coverage tests", () => {
    it("should send ignore region by selector outside of the target region with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckElementWithIgnoreRegionByElementOutsideTheViewport_Fluent_VG", displayName: "should send ignore region by selector outside of the target region with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "#overflowing-div-image", ignoreRegions: ["#overflowing-div"], target: "region"})
        cy.eyesClose(undefined)
    })
})