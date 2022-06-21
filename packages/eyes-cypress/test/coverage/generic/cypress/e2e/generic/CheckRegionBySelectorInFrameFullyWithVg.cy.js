// check region by selector in frame fully with vg
describe("Coverage tests", () => {
    it("check region by selector in frame fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "TestCheckRegionInFrame_VG", displayName: "check region by selector in frame fully with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "#inner-frame-div", frames: ["[name=\"frame1\"]"], isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})