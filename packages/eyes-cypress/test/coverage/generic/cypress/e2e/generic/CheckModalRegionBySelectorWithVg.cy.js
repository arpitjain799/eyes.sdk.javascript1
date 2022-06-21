// check modal region by selector with vg
describe("Coverage tests", () => {
    it("check modal region by selector with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/ModalsPage/index.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestSimpleModal_VG", displayName: "check modal region by selector with vg", viewportSize: {width: 700, height: 460}})
        cy.get("#open_simple_modal").click()
        cy.eyesCheckWindow({region: "#simple_modal > .modal-content", target: "region"})
        cy.eyesClose(undefined)
    })
})