package com.applitools.eyes.appium;

import com.applitools.ICheckSettings;
import com.applitools.eyes.*;
import com.applitools.eyes.config.Configuration;
import com.applitools.eyes.exceptions.TestFailedException;
import com.applitools.eyes.locators.BaseOcrRegion;
import com.applitools.eyes.locators.TextRegion;
import com.applitools.eyes.locators.TextRegionSettings;
import com.applitools.eyes.locators.VisualLocatorSettings;
import com.applitools.eyes.positioning.PositionProvider;
import com.applitools.eyes.selenium.ClassicRunner;
import com.applitools.eyes.selenium.positioning.ImageRotation;
import com.applitools.eyes.selenium.universal.dto.DriverTargetDto;
import com.applitools.eyes.selenium.universal.mapper.DriverMapper;
import com.applitools.eyes.universal.dto.CheckSettingsDto;
import com.applitools.utils.ArgumentGuard;
import com.applitools.utils.GeneralUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.DesiredCapabilities;
import java.lang.reflect.Method;
import java.net.URI;
import java.util.List;
import java.util.Map;

public class Eyes implements IEyesBase {
    private com.applitools.eyes.selenium.Eyes originEyes;

    public static void setNMGCapabilities(DesiredCapabilities caps) {
        setNMGCapabilities(caps, null, null, null);
    }

    public static void setNMGCapabilities(DesiredCapabilities caps, String apiKey) {
        setNMGCapabilities(caps, apiKey, null, null);
    }

    public static void setNMGCapabilities(DesiredCapabilities caps, String apiKey, String eyesServerUrl) {
        setNMGCapabilities(caps, apiKey, eyesServerUrl, null);
    }

    public static void setNMGCapabilities(DesiredCapabilities caps, String apiKey,
                                          String eyesServerUrl, ProxySettings proxySettings) {

        String iosCapsKey = "processArguments";
        String iosCapValue = "{\"args\": [], \"env\":"
                + "{\"DYLD_INSERT_LIBRARIES\":\"@executable_path/Frameworks/UFG_lib.xcframework/ios-arm64/UFG_lib.framework/UFG_lib"
                + ":"
                + "@executable_path/Frameworks/UFG_lib.xcframework/ios-arm64_x86_64-simulator/UFG_lib.framework/UFG_lib\"";

        String iosCapValueSuffix = "}}";

        String androidCapKey = "optionalIntentArguments";
        String androidCapValue = "--es APPLITOOLS \'{";
        String androidCapValueSuffix = "}\'";

        // Take the API key from the environment if it's not explicitly given.
        if (apiKey == null) {
            apiKey = GeneralUtils.getEnvString(("APPLITOOLS_API_KEY"));
            if (apiKey == null || apiKey.equalsIgnoreCase("")) {
                throw new EyesException("No API key was given, or is an empty string.");
            }
        }

        androidCapValue += "\"NML_API_KEY\":\"" + apiKey + "\"";
        iosCapValue += ",\"NML_API_KEY\":\"" + apiKey + "\"";

        // Check for the server URL in the env variable. Defaults to Applitools public cloud.
        if (eyesServerUrl == null) {
            String envVar = GeneralUtils.getEnvString(("APPLITOOLS_SERVER_URL"));
            eyesServerUrl = envVar != null? envVar : IEyesBase.APPLITOOLS_PUBLIC_CLOUD_URL;

        }

        if (eyesServerUrl != null && !eyesServerUrl.equalsIgnoreCase("")) {
            androidCapValue += ",\"NML_SERVER_URL\":\"" + eyesServerUrl + "\"";
            iosCapValue += ",\"NML_SERVER_URL\":\"" + eyesServerUrl + "\"";
        }

        if (proxySettings == null) {
            String proxyFromEnv = GeneralUtils.getEnvString("APPLITOOLS_HTTP_PROXY");
            if (proxyFromEnv != null && !proxyFromEnv.equalsIgnoreCase("")) {
                proxySettings = new ProxySettings(proxyFromEnv);
            }
        }

        if (proxySettings != null) {
            androidCapValue += ",\"NML_PROXY_URL\":\"" + proxySettings + "\"";
            iosCapValue += ",\"NML_PROXY_URL\":\"" + proxySettings + "\"";
        }

        androidCapValue += androidCapValueSuffix;
        iosCapValue += iosCapValueSuffix;

        caps.setCapability(androidCapKey, androidCapValue);
        caps.setCapability(iosCapsKey, iosCapValue);
    }

    /**
     * Instantiates a new Eyes.
     */
    public Eyes() {
        this.originEyes = new com.applitools.eyes.selenium.Eyes(new AppiumRunner());
    }

    /**
     * Instantiates a new Eyes.
     * @param runner0 the runner
     */
    public Eyes(EyesRunner runner0) {
        if (runner0 instanceof ClassicRunner) {
            String warning = GeneralUtils.createEyesMessageWithLevel("Eyes Appium was run with ClassicRunner. " +
                    "We recommend using AppiumRunner for full compatibility.", "warning");
            System.out.println(warning);
        }
        this.originEyes = new com.applitools.eyes.selenium.Eyes(runner0);
    }

    public com.applitools.eyes.selenium.Configuration getConfiguration() {
        return originEyes.getConfiguration();
    }

    public void setConfiguration(Configuration configuration) {
        configuration.setUseCeilForViewportSize(true);
        originEyes.setConfiguration(configuration);
    }

    public Configuration configure() {
        return this.originEyes.configure();
    }

    /**
     * Gets api key.
     *
     * @return the api key
     */
    public String getApiKey() {
        return configure().getApiKey();
    }

    /**
     * Sets api key.
     *
     * @param apiKey the api key
     */
    public void setApiKey(String apiKey) {
        configure().setApiKey(apiKey);
    }

    public URI getServerUrl() {
        return originEyes.getServerUrl();
    }

    /**
     * Sets server url.
     *
     * @param serverUrl the server url
     */
    public void setServerUrl(String serverUrl) {
        configure().setServerUrl(serverUrl);
    }

    /**
     * Sets server url.
     *
     * @param serverUri the server URI
     */
    public void setServerUrl(URI serverUri) {
        configure().setServerUrl(serverUri.toString());
    }

    /**
     * Sets the proxy settings to be used by the server.
     *
     * @param proxySettings The proxy settings to be used by the server.
     *                      If {@code null} then no proxy is set.
     */
    public void setProxy(AbstractProxySettings proxySettings) {
        originEyes.setProxy(proxySettings);
    }

    /**
     * Gets proxy.
     * @return The current proxy settings used by the server, or {@code null} if no proxy is set.
     */
    public AbstractProxySettings getProxy() {
        return this.originEyes.getProxy();
    }

    /**
     * Sets is disabled.
     *
     * @param isDisabled If true, all interactions with this API will be silently ignored.
     */
    public void setIsDisabled(Boolean isDisabled) {
        configure().setIsDisabled(isDisabled);
    }

    /**
     * Gets is disabled.
     *
     * @return Whether eyes is disabled.
     */
    public Boolean getIsDisabled() {
        return configure().getIsDisabled();
    }

    /**
     * @return The image rotation data.
     */
    public ImageRotation getRotation() {
        return originEyes.getRotation();
    }

    /**
     * @param rotation The image rotation data.
     */
    public void setRotation(ImageRotation rotation) {
        originEyes.setRotation(rotation);
    }

    public void setForceFullPageScreenshot(boolean shouldForce) {
        configure().setForceFullPageScreenshot(shouldForce);
    }

    public Boolean getForceFullPageScreenshot() {
        return originEyes.getForceFullPageScreenshot();
    }


    /**
     * Sets the maximum time (in ms) a match operation tries to perform a match.
     *
     * @param ms Total number of ms to wait for a match.
     */
    public void setMatchTimeout(int ms) {
        originEyes.setMatchTimeout(ms);
    }

    /**
     * @return The maximum time in ms
     * (RegionProvider, String, boolean, int)} waits for a match.
     */
    public Integer getMatchTimeout() {
        return configure().getMatchTimeout();
    }

    /**
     * Set whether or not new tests are saved by default.
     *
     * @param saveNewTests True if new tests should be saved by default. False otherwise.
     */
    public void setSaveNewTests(boolean saveNewTests) {
        configure().setSaveNewTests(saveNewTests);
    }

    /**
     * Gets save new tests.
     *
     * @return True if new tests are saved by default.
     */
    public Boolean getSaveNewTests() {
        return configure().getSaveNewTests();
    }

    public void setSaveDiffs(Boolean saveDiffs) {
        configure().setSaveDiffs(saveDiffs);
    }

    public Boolean getSaveDiffs() {
        return configure().getSaveDiffs();
    }

    public void setDefaultMatchSettings(ImageMatchSettings defaultMatchSettings) {
        configure().setDefaultMatchSettings(defaultMatchSettings);
    }

    public ImageMatchSettings getDefaultMatchSettings() {
        return configure().getDefaultMatchSettings();
    }

    /**
     * Gets stitch overlap.
     *
     * @return Returns the stitching overlap in pixels.
     */
    public Integer getStitchOverlap() {
        return configure().getStitchOverlap();
    }

    /**
     * Sets the stitching overlap in pixels.
     *
     * @param pixels The width (in pixels) of the overlap.
     */
    public void setStitchOverlap(int pixels) {
        configure().setStitchOverlap(pixels);
    }

    public void setBranchName(String branchName) {
        configure().setBranchName(branchName);
    }

    public String getBranchName() {
        return configure().getBranchName();
    }

    public void setParentBranchName(String branchName) {
        configure().setParentBranchName(branchName);
    }

    public String getParentBranchName() {
        return configure().getParentBranchName();
    }

    public Configuration setBatch(BatchInfo batch) {
        return configure().setBatch(batch);
    }

    public BatchInfo getBatch() {
        return configure().getBatch();
    }

    public void setAgentId(String agentId) {
        configure().setAgentId(agentId);
    }

    public String getAgentId() {
        return configure().getAgentId();
    }

    /**
     * Gets full agent id.
     *
     * @return The full agent id composed of both the base agent id and the user given agent id.
     */
    public String getFullAgentId() {
        return originEyes.getFullAgentId();
    }

    public void setHostOS(String hostOS) {
        configure().setHostOS(hostOS);
    }

    public String getHostOS() {
        return configure().getHostOS();
    }

    public void setHostApp(String hostApp) {
        configure().setHostApp(hostApp);
    }

    public String getHostApp() {
        return configure().getHostOS();
    }

    public Boolean getIgnoreCaret() {
        return configure().getIgnoreCaret();
    }

    public void setIgnoreCaret(boolean value) {
        configure().setIgnoreCaret(value);
    }

    public void setMatchLevel(MatchLevel matchLevel) {
        configure().getDefaultMatchSettings().setMatchLevel(matchLevel);
    }

    public MatchLevel getMatchLevel() {
        return configure().getDefaultMatchSettings().getMatchLevel();
    }

    public void setEnvName(String envName) {
        configure().setEnvironmentName(envName);
    }

    public String getEnvName() {
        return configure().getEnvironmentName();
    }

    public void setBaselineEnvName(String baselineEnvName) {
        configure().setBaselineEnvName(baselineEnvName);
    }

    public String getBaselineEnvName() {
        return configure().getBaselineEnvName();
    }

    public void setBaselineBranchName(String branchName) {
        configure().setBaselineBranchName(branchName);
    }

    public String getBaselineBranchName() {
        return configure().getBaselineBranchName();
    }

    public void setIgnoreDisplacements(boolean isIgnoreDisplacements) {
        configure().setIgnoreDisplacements(isIgnoreDisplacements);
    }

    public Boolean getIgnoreDisplacements() {
        return configure().getIgnoreDisplacements();
    }


    public WebDriver open(WebDriver driver, Configuration configuration) {
        originEyes.setConfiguration(configuration);
        return originEyes.open(driver);
    }

    /**
     * See {@link #open(WebDriver, String, String, RectangleSize, SessionType)}.
     * {@code sessionType} defaults to {@code null}.
     *
     * * @param driver   The web driver that controls the browser hosting the application under test.
     * @param appName  The name of the application under test.
     * @param testName The test name. (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     * @return A wrapped WebDriver which enables SeleniumEyes trigger recording and frame handling.
     */
    public WebDriver open(WebDriver driver, String appName, String testName,
                          RectangleSize viewportSize) {
        return originEyes.open(driver, appName, testName);
    }

    public WebDriver open(WebDriver driver, String appName, String testName) {
        return originEyes.open(driver, appName, testName);
    }


    /**
     * Starts a test.
     *
     * @param driver       The web driver that controls the browser hosting
     *                     the application under test.
     * @param appName      The name of the application under test.
     * @param testName     The test name.
     * @param viewportSize The required browser's viewport size
     *                     (i.e., the visible part of the document's body) or
     *                     {@code null} to use the current window's viewport.
     * @param sessionType Should always be {@code SEQUENTIAL}
     * @return A wrapped WebDriver which enables Eyes trigger recording and
     * frame handling.
     */
    protected WebDriver open(WebDriver driver, String appName, String testName,
                             RectangleSize viewportSize, SessionType sessionType) {
        return originEyes.open(driver, appName, testName, viewportSize);
    }

    /**
     * Gets is open.
     *
     * @return Whether a session is open.
     */
    public boolean getIsOpen() {
        return originEyes.getIsOpen();
    }

    public void checkWindow() {
        checkWindow(null);
    }

    public void checkWindow(String tag) {
        check(tag, Target.window());
    }

    public void checkWindow(int matchTimeout, String tag) {
        check(tag, Target.window().timeout(matchTimeout));
    }

    public void checkWindow(String tag, boolean fully) {
        check(tag, Target.window().fully(fully));

    }

    public void check(String name, ICheckSettings checkSettings) {
        if (Boolean.TRUE.equals(getIsDisabled())) {
            return;
        }

        ArgumentGuard.notNull(checkSettings, "checkSettings");
        checkSettings = checkSettings.withName(name);
        this.check(checkSettings);
    }

    @Deprecated
    public void setScrollToRegion(boolean shouldScroll) {
        // For backward compatibility
    }

    /**
     * Gets scroll to region.
     *
     * @return Whether to automatically scroll to a region being validated.
     */
    @SuppressWarnings("BooleanMethodIsAlwaysInverted")
    @Deprecated
    public boolean getScrollToRegion() {
        return originEyes.getScrollToRegion();
    }

    public boolean shouldStitchContent() {
        return originEyes.shouldStitchContent();
    }

    /**
     * Gets position provider.
     *
     * @return The currently set position provider.
     */
    public PositionProvider getPositionProvider() {
        return originEyes.getPositionProvider();
    }

    /**
     * Sets position provider.
     *
     * @param positionProvider The position provider to be used.
     */
    public void setPositionProvider(PositionProvider positionProvider) {
        originEyes.setPositionProvider(positionProvider);
    }

    /**
     * Sets a handler of log messages generated by this API.
     *
     * @param logHandler Handles log messages generated by this API.
     */
    public void setLogHandler(LogHandler logHandler) {
        originEyes.setLogHandler(logHandler);
    }

    /**
     * Gets log handler.
     *
     * @return The currently set log handler.
     */
    public LogHandler getLogHandler() {
        return originEyes.getLogHandler();
    }

    /**
     * Gets logger.
     *
     * @return the logger
     */
    public Logger getLogger() {
        return originEyes.getLogger();
    }

    /**
     * Adds a property to be sent to the server.
     *
     * @param name  The property name.
     * @param value The property value.
     */
    public void addProperty(String name, String value) {
        originEyes.addProperty(name, value);
    }

    /**
     * Clears the list of custom properties.
     */
    public void clearProperties() {
        originEyes.clearProperties();
    }

    /**
     * Sets save debug screenshots.
     *
     * @param saveDebugScreenshots If true, will save all screenshots to local directory.
     */
    public void setSaveDebugScreenshots(Boolean saveDebugScreenshots) {
        originEyes.setSaveDebugScreenshots(saveDebugScreenshots);
    }

    /**
     * Gets save debug screenshots.
     *
     * @return True if screenshots saving enabled.
     */
    public Boolean getSaveDebugScreenshots() {
        return originEyes.getSaveDebugScreenshots();
    }

    public String getBaseAgentId() {
        return configure().getAgentId();
    }


    public WebDriver getDriver() {
        return originEyes.getDriver();
    }


    public double getDevicePixelRatio() {
        return originEyes.getDevicePixelRatio();
    }


    public void check(ICheckSettings... checkSettings) {
        originEyes.check(checkSettings);
    }


    public void check(ICheckSettings checkSettings) {
        CheckSettingsDto checkSettingsDto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, configure());
        DriverTargetDto driverTargetDto = DriverMapper.toDriverTargetDto(getDriver(), configure().getWebDriverProxy());
        this.checkDto(checkSettingsDto, driverTargetDto);
    }

    private void checkDto(CheckSettingsDto checkSettingsDto, DriverTargetDto driverTargetDto) throws EyesException {
        try {
            Method checkDto = originEyes.getClass().getDeclaredMethod("checkDto", CheckSettingsDto.class, DriverTargetDto.class);
            checkDto.setAccessible(true);
            checkDto.invoke(originEyes, checkSettingsDto, driverTargetDto);
        } catch (NoSuchMethodException | IllegalAccessException e) {
            System.out.println("Got a failure trying to activate checkDTO using reflection! Error " + e.getMessage());
            throw new EyesException("Got a failure trying to activate checkDTO using reflection! Error " + e.getMessage());
        } catch (Exception e) {
            String errorMessage = GeneralUtils.createErrorMessageFromExceptionWithText(e, "Got a failure trying to perform a 'check'!");
            System.out.println(errorMessage);
            throw new EyesException(errorMessage, e);
        }
    }

    public void checkElement(WebElement element) {
        originEyes.checkElement(element);
    }

    public void checkElement(WebElement element, String tag) {
        originEyes.checkElement(element, tag);
    }

    public void checkElement(WebElement element, int matchTimeout, String tag) {
        originEyes.checkElement(element, matchTimeout, tag);
    }

    public void checkElement(By selector) {
        originEyes.checkElement(selector);
    }

    public void checkElement(By selector, String tag) {
        originEyes.checkElement(selector, tag);
    }

    public void checkElement(By selector, int matchTimeout, String tag) {
        originEyes.checkElement(selector, matchTimeout, tag);
    }

    public void checkRegion(Region region) {
        originEyes.checkRegion(region);
    }

    public void checkRegion(final Region region, int matchTimeout, String tag) throws TestFailedException {
        originEyes.checkRegion(region, matchTimeout, tag);
    }

    public void checkRegion(WebElement element) {
        originEyes.checkRegion(element);
    }

    public void checkRegion(WebElement element, String tag, boolean stitchContent) {
        originEyes.checkRegion(element, tag, stitchContent);
    }

    public void checkRegion(final WebElement element, int matchTimeout, String tag) {
        originEyes.checkRegion(element, matchTimeout, tag);
    }

    public void checkRegion(WebElement element, int matchTimeout, String tag, boolean stitchContent) {
        originEyes.checkRegion(element, matchTimeout, tag, stitchContent);
    }

    public void checkRegion(By selector) {
        originEyes.checkRegion(selector);
    }

    public void checkRegion(By selector, boolean stitchContent) {
        originEyes.checkRegion(selector, stitchContent);
    }

    public void checkRegion(By selector, String tag) {
        originEyes.checkRegion(selector, tag);
    }

    public void checkRegion(By selector, String tag, boolean stitchContent) {
        originEyes.checkRegion(selector, tag, stitchContent);
    }

    public void checkRegion(By selector, int matchTimeout, String tag) {
        originEyes.checkRegion(selector, matchTimeout, tag);
    }

    public void checkRegion(By selector, int matchTimeout, String tag, boolean stitchContent) {
        originEyes.checkRegion(selector, matchTimeout, tag, stitchContent);
    }

    public Map<String, List<Region>> locate(VisualLocatorSettings visualLocatorSettings) {
        return originEyes.locate(visualLocatorSettings);
    }

    public Map<String, List<TextRegion>> extractTextRegions(TextRegionSettings textRegionSettings) {
        return originEyes.extractTextRegions(textRegionSettings);
    }

    public List<String> extractText(BaseOcrRegion... ocrRegions) {
        return originEyes.extractText(ocrRegions);
    }

    /**
     * See {@link #close(boolean)}.
     * {@code throwEx} defaults to {@code true}.
     *
     * @return The test results.
     */
    public TestResults close() {
        return originEyes.close();
    }

    /**
     * Close test results.
     *
     * @param shouldThrowException the should throw exception
     * @return the test results
     */
    public TestResults close(boolean shouldThrowException) {
        return originEyes.close(shouldThrowException);
    }

    public void closeAsync() {
        originEyes.closeAsync();
    }

    /**
     * If a test is running, aborts it. Otherwise, does nothing.
     */
    public TestResults abortIfNotClosed() {
        return abort();
    }

    public TestResults abort() {
        return originEyes.abort();
    }

    public void abortAsync() {
        originEyes.abortAsync();
    }

    @Deprecated
    protected Configuration getConfigurationInstance() {
        return configure();
    }

    /**
     * Manually set the scale ratio for the images being validated.
     * @param scaleRatio The scale ratio to use, or {@code null} to reset back to automatic scaling.
     */
    public void setScaleRatio(Double scaleRatio) {
        this.originEyes.setScaleRatio(scaleRatio);
    }

    /**
     * Gets scale ratio.
     * @return The ratio used to scale the images being validated.
     */
    public Double getScaleRatio() {
        return this.originEyes.getScaleRatio();
    }

}

