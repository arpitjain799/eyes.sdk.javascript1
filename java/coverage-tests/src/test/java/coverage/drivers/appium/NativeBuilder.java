package coverage.drivers.appium;

import org.openqa.selenium.WebDriver;

import java.net.MalformedURLException;

public interface NativeBuilder {
    WebDriver build(String app, String orientation, boolean legacy) throws MalformedURLException;
}
