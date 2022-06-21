// check fixed region by selector with vg
describe("Coverage tests", () => {
    it("check fixed region by selector with vg", () => {
        cy.visit("http://applitools.github.io/demo/TestPages/fixed-position")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckFixedRegion_VG", displayName: "check fixed region by selector with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "#fixed", target: "region"})
        cy.eyesClose(undefined)
    })
})