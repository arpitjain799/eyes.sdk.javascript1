// check region by coordinates in frame with vg
describe("Coverage tests", () => {
    it("check region by coordinates in frame with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckRegionByCoordinateInFrame_Fluent_VG", displayName: "check region by coordinates in frame with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: {left: 30, top: 40, width: 400, height: 1200}, frames: ["[name=\"frame1\"]"], target: "region"})
        cy.eyesClose(undefined)
    })
})