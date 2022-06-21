// check scrollable modal region by selector fully with vg
describe("Coverage tests", () => {
    it("check scrollable modal region by selector fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckScrollableModal_VG", displayName: "check scrollable modal region by selector fully with vg", viewportSize: {width: 700, height: 460}})
        cy.get("#centered").click()
        cy.eyesCheckWindow({region: "#modal-content", scrollRootElement: "#modal1", isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})