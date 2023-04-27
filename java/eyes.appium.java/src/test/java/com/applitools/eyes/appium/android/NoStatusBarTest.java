package com.applitools.eyes.appium.android;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.TouchAction;
import io.appium.java_client.touch.WaitOptions;
import io.appium.java_client.touch.offset.PointOption;
import org.testng.annotations.Test;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

public class NoStatusBarTest extends AndroidTestSetup {

    @Test
    public void testAndroidNoStatusBar() {
        driver.manage().timeouts().implicitlyWait(10_000, TimeUnit.MILLISECONDS);

        eyes.setMatchTimeout(1000);

        // Scroll down
//        TouchAction scrollAction = new TouchAction(driver);
//        scrollAction.press(new PointOption().withCoordinates(5, 1700)).waitAction(new WaitOptions().withDuration(Duration.ofMillis(1500)));
//        scrollAction.moveTo(new PointOption().withCoordinates(5, 100));
//        scrollAction.cancel();
//        driver.performTouchAction(scrollAction);

        //driver.findElementById("btn_no_status_bar").click();
        driver.findElement(AppiumBy.id("btn_no_status_bar")).click();

        eyes.open(driver, getApplicationName(), "Test RecyclerView");

        eyes.checkWindow();

        eyes.close();
    }
}
