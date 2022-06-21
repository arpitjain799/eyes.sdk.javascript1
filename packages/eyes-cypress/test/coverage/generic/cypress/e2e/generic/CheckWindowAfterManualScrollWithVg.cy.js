// check window after manual scroll with vg
describe("Coverage tests", () => {
    it("check window after manual scroll with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Classic API", testName: "TestCheckWindowAfterScroll_VG", displayName: "check window after manual scroll with vg", viewportSize: {width: 700, height: 460}})
        cy.window().then(win => {
            const func = new win.Function("window.scrollBy(0, 350)")
            return func(...[])
          })
        cy.eyesCheckWindow({isFully: false, fully: false})
        cy.eyesClose(undefined)
    })
})