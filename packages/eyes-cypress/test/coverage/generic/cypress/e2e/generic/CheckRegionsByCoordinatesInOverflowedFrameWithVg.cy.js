// check regions by coordinates in overflowed frame with vg
describe("Coverage tests", () => {
    it("check regions by coordinates in overflowed frame with vg", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/FramesTestPage/")
        cy.eyesOpen({appName: "Eyes Selenium SDK - Fluent API", testName: "TestCheckLongOutOfBoundsIFrameModal_VG", displayName: "check regions by coordinates in overflowed frame with vg", viewportSize: {width: 700, height: 460}})
        cy.get("#hidden_click").click()
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 0, width: 385, height: 5000}, isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 5000, width: 385, height: 5000}, isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 10000, width: 385, height: 5000}, isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 15000, width: 385, height: 5000}, isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 20000, width: 385, height: 5000}, isFully: true, target: "region", fully: true})
        cy.eyesCheckWindow({scrollRootElement: "#modal3", frames: [{type: "css", selector: "#modal3 iframe"}], region: {left: 0, top: 25000, width: 385, height: 4072}, isFully: true, target: "region", fully: true})
        cy.eyesClose(undefined)
    })
})