// check fixed region by selector fully with vg
describe("Coverage tests", () => {
    it("check fixed region by selector fully with vg", () => {
        cy.visit("http://applitools.github.io/demo/TestPages/fixed-position")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckFixedRegion_Fully_VG", displayName: "check fixed region by selector fully with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "#fixed", isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})