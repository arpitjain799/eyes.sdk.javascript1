// check window fully with wrong scroll root with vg
describe("Coverage tests", () => {
    it("check window fully with wrong scroll root with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/SimpleTestPage/scrollablebody.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Scroll Root Element", testName: "TestCheckWindow_Html_VG", displayName: "check window fully with wrong scroll root with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({scrollRootElement: "html", isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})