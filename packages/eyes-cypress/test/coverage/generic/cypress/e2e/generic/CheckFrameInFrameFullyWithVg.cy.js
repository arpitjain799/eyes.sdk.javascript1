// check frame in frame fully with vg
describe("Coverage tests", () => {
    it("check frame in frame fully with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckFrameInFrame_Fully_Fluent_VG", displayName: "check frame in frame fully with vg", viewportSize: {width: 700, height: 460}, branchName: "universal-sdk"})
        cy.eyesCheckWindow({frames: ["[name=\"frame1\"]", "[name=\"frame1-1\"]"], isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})