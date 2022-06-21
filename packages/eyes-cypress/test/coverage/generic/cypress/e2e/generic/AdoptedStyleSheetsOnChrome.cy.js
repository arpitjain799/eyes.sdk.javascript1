// adopted styleSheets on chrome
describe("Coverage tests", () => {
    it("adopted styleSheets on chrome", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/AdoptedStyleSheets/index.html")
        cy.eyesOpen({appName: "Applitools Eyes SDK", testName: "AdoptedStyleSheetsOnChrome", displayName: "adopted styleSheets on chrome", viewportSize: {width: 700, height: 460}, browser: [{name: "chrome", width: 640, height: 480}]})
        cy.eyesCheckWindow({isFully: false, fully: false})
        cy.eyesClose(undefined)
    })
})