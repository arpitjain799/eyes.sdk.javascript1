package com.applitools.eyes.examples;

import com.applitools.eyes.RectangleSize;
import com.applitools.eyes.TestResults;
import com.applitools.eyes.playwright.Eyes;
import com.applitools.eyes.playwright.fluent.Target;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import org.testng.annotations.*;

public class PlaywrightDemo {

    // Shared between all tests in this class.
    private static Playwright playwright;
    private static Browser browser;

    // New instance for each test method.
    private BrowserContext context;
    private Page page;
    private Eyes eyes;


    @BeforeTest
    public void setup() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch();

        eyes = new Eyes();
        eyes.setApiKey(System.getenv("APPLITOOLS_API_KEY"));
    }

    @BeforeMethod
    public void beforeEach() {
        context = browser.newContext();
        page = context.newPage();
    }

    @AfterMethod
    public void afterEach() {
        context.close();
    }

    @AfterTest
    public void teardown() {
        playwright.close();
    }

    @Test
    public void test() {
        page.navigate("https://demo.applitools.com");

        eyes.open(page, "Playwright Java", "Test Playwright Java"
                 , new RectangleSize(1400, 700));
        eyes.check(Target.window().fully(true));
        TestResults res = eyes.close(true);
        System.out.println(res);
    }


}