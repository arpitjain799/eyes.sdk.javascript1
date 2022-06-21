// check window on page with sticky header with vg
describe("Coverage tests", () => {
    it("check window on page with sticky header with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/PageWithHeader/index.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Page With Header", testName: "TestCheckPageWithHeader_Window_VG", displayName: "check window on page with sticky header with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({isFully: false, fully: false})
        cy.eyesClose(undefined)
    })
})