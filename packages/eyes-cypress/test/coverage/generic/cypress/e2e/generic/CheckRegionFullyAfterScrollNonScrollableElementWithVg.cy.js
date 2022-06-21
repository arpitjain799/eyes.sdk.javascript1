// check region fully after scroll non scrollable element with vg
describe("Coverage tests", () => {
    it("check region fully after scroll non scrollable element with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/SimpleTestPage/index.html")
        cy.eyesOpen({appName: "Eyes Selenium SDK - check non scrollable element", testName: "TestCheckElementFullyAfterScrollNonScrollableElement_VG", displayName: "check region fully after scroll non scrollable element with vg", viewportSize: {width: 700, height: 460}})
        cy.window().then(win => {
            const func = new win.Function("window.scrollBy(0, 500)")
            return func(...[])
          })
        cy.eyesCheckWindow({region: "#overflowing-div", isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})