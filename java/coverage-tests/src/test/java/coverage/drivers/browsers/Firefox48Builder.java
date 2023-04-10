package coverage.drivers.browsers;

import coverage.drivers.CapabilitiesHelper;
import coverage.drivers.SELENIUM;
import org.openqa.selenium.Capabilities;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.MalformedURLException;
import java.net.URL;

public class Firefox48Builder implements Builder{
    public WebDriver build(boolean headless, boolean legacy, boolean executionGrid) throws MalformedURLException {
        Capabilities caps = CapabilitiesHelper.getFirefox48();
        return new RemoteWebDriver(new URL(SELENIUM.SAUCE.url), caps);
    }
}
