// check region by selector after manual scroll with vg
describe("Coverage tests", () => {
    it("check region by selector after manual scroll with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckRegionBySelectorAfterManualScroll_Fluent_VG", displayName: "check region by selector after manual scroll with vg", viewportSize: {width: 700, height: 460}})
        cy.window().then(win => {
            const func = new win.Function("window.scrollBy(0, 250)")
            return func(...[])
          })
        cy.eyesCheckWindow({region: "#centered", target: "region"})
        cy.eyesClose(undefined)
    })
})