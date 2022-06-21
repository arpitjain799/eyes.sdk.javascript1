// should render special characters
describe("Coverage tests", () => {
    it("should render special characters", () => {
        cy.visit("https://applitools.github.io/demo/TestPages/SpecialCharacters/index.html")
        cy.eyesOpen({appName: "Special Characters Test", testName: "Special Characters", displayName: "should render special characters", branchName: "default", browser: [{name: "chrome", width: 800, height: 600}]})
        cy.eyesCheckWindow({isFully: true, fully: true})
        cy.eyesClose(undefined)
    })
})