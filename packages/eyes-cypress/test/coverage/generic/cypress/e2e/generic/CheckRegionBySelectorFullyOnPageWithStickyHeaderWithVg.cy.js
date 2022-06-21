// check region by selector fully on page with sticky header with vg
describe("Coverage tests", () => {
    it("check region by selector fully on page with sticky header with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/PageWithHeader/index.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Page With Header", testName: "TestCheckPageWithHeader_Region_Fully_VG", displayName: "check region by selector fully on page with sticky header with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({region: "div.page", isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})