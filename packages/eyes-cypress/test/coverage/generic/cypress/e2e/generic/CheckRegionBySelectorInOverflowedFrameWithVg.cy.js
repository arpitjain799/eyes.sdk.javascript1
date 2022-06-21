// check region by selector in overflowed frame with vg
describe("Coverage tests", () => {
    it("check region by selector in overflowed frame with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/WixLikeTestPage/index.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Special Cases", testName: "TestCheckRegionInAVeryBigFrame_VG", displayName: "check region by selector in overflowed frame with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "img", frames: ["[name=\"frame1\"]"], target: "region"})
        cy.eyesClose(undefined)
    })
})