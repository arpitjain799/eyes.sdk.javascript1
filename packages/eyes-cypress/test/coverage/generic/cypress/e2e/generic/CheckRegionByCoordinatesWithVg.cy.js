// check region by coordinates with vg
describe("Coverage tests", () => {
    it("check region by coordinates with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckRegionByCoordinates_Fluent_VG", displayName: "check region by coordinates with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: {left: 50, top: 70, width: 90, height: 110}, target: "region"})
        cy.eyesClose(undefined)
    })
})