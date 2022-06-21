// should hide and restore scrollbars with vg
describe("Coverage tests", () => {
    it("should hide and restore scrollbars with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestScrollbarsHiddenAndReturned_Fluent_VG", displayName: "should hide and restore scrollbars with vg", viewportSize: {width: 700, height: 460}})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesCheckWindow({region: "#inner-frame-div", frames: ["[name=\"frame1\"]"], isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})