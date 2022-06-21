// check region by selector fully with vg
describe("Coverage tests", () => {
    it("check region by selector fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckElementFully_Fluent_VG", displayName: "check region by selector fully with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "#overflowing-div-image", isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})