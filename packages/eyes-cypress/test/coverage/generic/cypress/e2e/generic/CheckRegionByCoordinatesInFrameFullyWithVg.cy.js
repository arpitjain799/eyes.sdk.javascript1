// check region by coordinates in frame fully with vg
describe("Coverage tests", () => {
    it("check region by coordinates in frame fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckRegionByCoordinateInFrameFully_Fluent_VG", displayName: "check region by coordinates in frame fully with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: {left: 30, top: 40, width: 400, height: 1200}, frames: ["[name=\"frame1\"]"], isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})