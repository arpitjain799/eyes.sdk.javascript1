package com.applitools.eyes.selenium;

import com.applitools.ICheckSettings;
import com.applitools.eyes.*;
import com.applitools.eyes.config.Configuration;
import com.applitools.eyes.config.ConfigurationProvider;
import com.applitools.eyes.debug.DebugScreenshotsProvider;
import com.applitools.eyes.exceptions.TestFailedException;
import com.applitools.eyes.locators.*;
import com.applitools.eyes.positioning.PositionProvider;
import com.applitools.eyes.selenium.fluent.SeleniumCheckSettings;
import com.applitools.eyes.selenium.fluent.Target;
import com.applitools.eyes.selenium.positioning.ImageRotation;
import com.applitools.eyes.selenium.universal.dto.DriverTargetDto;
import com.applitools.eyes.selenium.universal.mapper.CheckSettingsMapper;
import com.applitools.eyes.selenium.universal.mapper.DriverMapper;
import com.applitools.eyes.selenium.universal.mapper.OCRExtractSettingsDtoMapper;
import com.applitools.eyes.settings.GetResultsSettings;
import com.applitools.eyes.universal.CommandExecutor;
import com.applitools.eyes.universal.Reference;
import com.applitools.eyes.universal.dto.*;
import com.applitools.eyes.universal.dto.response.CommandEyesGetResultsResponseDto;
import com.applitools.eyes.universal.mapper.*;
import com.applitools.eyes.visualgrid.model.IDebugResourceWriter;
import com.applitools.eyes.visualgrid.services.VisualGridRunner;
import com.applitools.utils.ArgumentGuard;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * The type Eyes.
 */
public class Eyes implements IEyesBase {

    private static final int USE_DEFAULT_MATCH_TIMEOUT = -1;

    private boolean isVisualGridEyes = false;
    private EyesRunner runner;
    private Configuration configuration = new Configuration();
    private ImageRotation rotation;
    private WebDriver driver;
    ConfigurationProvider configurationProvider = new ConfigurationProvider() {
        @Override
        public Configuration get() {
            return configuration;
        }
    };

    /**
     * this reference has to be used in eyes related requests (Eyes.check, Eyes.locate, Eyes.extractTextRegions, Eyes.extractText, Eyes.close, Eyes.abort)
     */
    private Reference eyesRef;

    // used to check abort after close
    private boolean isClosed;

    private static CommandExecutor commandExecutor;


    /**
     * Get the Execution Cloud URL.
     *
     * @return the Execution Cloud URL using default params
     */
    public static String getExecutionCloudURL() {
        // start the universal server earlier than normally
        commandExecutor = new ClassicRunner().getCommandExecutor();

        MakeECClientResponsePayload payload = commandExecutor.coreMakeECClient();
        return payload.getUrl();
    }

    /**
     * Instantiates a new Eyes.
     */
    public Eyes() {
        this(new ClassicRunner());
    }

    /**
     * Instantiates a new Eyes.
     * @param runner0 the runner
     */
    public Eyes(EyesRunner runner0) {
        this.runner = runner0 == null ? new ClassicRunner() : runner0;
        commandExecutor = runner.getCommandExecutor();

        if (runner instanceof VisualGridRunner) {
            AutProxySettings autProxy = ((VisualGridRunner) runner).getAutProxy();
            AbstractProxySettings proxySettings = runner.getProxy();
            if (autProxy != null)
                configurationProvider.get().setAutProxy(autProxy);
            if (proxySettings != null)
                configurationProvider.get().setProxy(proxySettings);

        }

    }


    /**
     * Open web driver.
     * @param webDriver the web driver
     * @return the web driver
     */
    public WebDriver open(WebDriver webDriver) {
        return open(webDriver, configuration.getAppName(), configuration.getTestName());
    }

    /**
     * Starts a test.
     * @param driver   The web driver that controls the browser hosting the application under test.
     * @param appName  The name of the application under test.
     * @param testName The test name. (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     * @return A wrapped WebDriver which enables SeleniumEyes trigger recording and frame handling.
     */
    public WebDriver open(WebDriver driver, String appName, String testName) {
        return open(driver, appName, testName, configuration.getViewportSize());
    }

    /**
     * Starts a test without a driver
     * @param appName  The name of the application under test.
     * @param testName The test name. (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     */
    public void open(String appName, String testName) {
        this.open(appName, testName, null);
    }

    /**
     * Starts a test without a driver
     * @param appName  The name of the application under test.
     * @param testName The test name. (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     * @param viewportSize The required browser's viewport size (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     */
    public void open(String appName, String testName, RectangleSize viewportSize) {
        if (getIsDisabled()) {
            return;
        }

        configuration.setAppName(appName).setTestName(testName);
        if (viewportSize != null && !viewportSize.isEmpty()) {
            configuration.setViewportSize(new RectangleSize(viewportSize));
        }

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        OpenSettingsDto settingsDto = SettingsMapper.toOpenSettingsDto(configuration, runner.isDontCloseBatches());
        DriverTargetDto driverTargetDto = DriverMapper.toDriverTargetDto(getDriver(), configuration.getWebDriverProxy());

        eyesRef = commandExecutor.managerOpenEyes(runner.getManagerRef(), driverTargetDto, settingsDto, configurationDto);
    }

    /**
     * Starts a test.
     * @param driver       The web driver that controls the browser hosting the application under test.
     * @param appName      The name of the application under test.
     * @param testName     The test name.
     * @param viewportSize The required browser's viewport size (i.e., the visible part of the document's body) or {@code null} to use the current window's viewport.
     * @return A wrapped WebDriver which enables SeleniumEyes trigger recording and frame handling. {@code sessionType} defaults to {@code null}.
     */
    public WebDriver open(WebDriver driver, String appName, String testName,
                          RectangleSize viewportSize) {
        if (getIsDisabled()) {
            return driver;
        }

        DriverTargetDto driverTargetDto = DriverMapper.toDriverTargetDto(driver, configuration.getWebDriverProxy());

        configurationProvider.get().setAppName(appName).setTestName(testName);

        if (viewportSize != null && !viewportSize.isEmpty()) {
            configurationProvider.get().setViewportSize(new RectangleSize(viewportSize));
        }

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        OpenSettingsDto settingsDto = SettingsMapper.toOpenSettingsDto(configuration, runner.isDontCloseBatches());

        eyesRef = commandExecutor.managerOpenEyes(runner.getManagerRef(), driverTargetDto, settingsDto, configurationDto);
        this.driver = driver;
        return driver;
    }

    /**
     * Sets server url.
     * @param serverUrl the server url
     */
    public void setServerUrl(String serverUrl) {
        configuration.setServerUrl(serverUrl);
    }

    /**
     * Sets server url.
     * @param serverUri the server URI
     */
    public void setServerUrl(URI serverUri) {
        configuration.setServerUrl(serverUri.toString());
    }

    /**
     * Sets the proxy settings to be used by the rest client.
     * @param proxySettings The proxy settings to be used by the rest client.
     *                      If {@code null} then no proxy is set.
     */
    public void setProxy(AbstractProxySettings proxySettings) {
        this.configuration.setProxy(proxySettings);

    }

    /**
     * Sets is disabled.
     * @param isDisabled If true, all interactions with this API will be silently ignored.
     */
    public void setIsDisabled(Boolean isDisabled) {
        this.configuration.setIsDisabled(isDisabled);
    }

    /**
     * Check.
     * @param checkSettings the check settings
     */
    public void check(ICheckSettings checkSettings) {
        check(null, checkSettings);
    }

    /**
     * See {@link #close(boolean)}.
     * {@code throwEx} defaults to {@code true}.
     * @return The test results.
     */
    public TestResults close() {
        return this.close(true);
    }

    /**
     * If a test is running, aborts it. Otherwise, does nothing.
     */
    public TestResults abortIfNotClosed() {
        return abort();
    }

    public TestResults abort() {
        if (!isClosed && getIsOpen()) {
            CloseSettingsDto settings = SettingsMapper.toCloseSettingsDto(getConfiguration());
            commandExecutor.abort(eyesRef, settings);

            GetResultsSettings getResultsSettings = new GetResultsSettings(false);
            List<CommandEyesGetResultsResponseDto> getResultsResponse = commandExecutor.eyesGetResults(eyesRef, getResultsSettings);

            eyesRef = null;

            List<TestResults> testResults = TestResultsMapper.toTestResultsList(getResultsResponse, getApiKey(), getServerUrl(), getProxy());
            if (testResults != null) {
                return testResults.isEmpty() ? null : testResults.get(0);
            }
        }
        return null;
    }

    public void abortAsync() {
        if (!isClosed && getIsOpen()) {
            CloseSettingsDto settings = SettingsMapper.toCloseSettingsDto(getConfiguration());
            commandExecutor.abort(eyesRef, settings);

            eyesRef = null;
        }
    }

    /**
     * Gets is disabled.
     * @return Whether eyes is disabled.
     */
    public Boolean getIsDisabled() {
        return this.configuration.getIsDisabled();
    }

    /**
     * Gets api key.
     * @return the api key
     */
    public String getApiKey() {
        return configuration.getApiKey();
    }

    /**
     * Sets api key.
     * @param apiKey the api key
     */
    public void setApiKey(String apiKey) {
        this.configuration.setApiKey(apiKey);
    }

    /**
     * Sets branch name.
     * @param branchName the branch name
     */
    public void setBranchName(String branchName) {
        this.configuration.setBranchName(branchName);
    }


    /**
     * Sets parent branch name.
     * @param branchName the branch name
     */
    public void setParentBranchName(String branchName) {
        configuration.setParentBranchName(branchName);
    }


    /**
     * Sets hide caret.
     * @param hideCaret the hide caret
     */
    public void setHideCaret(boolean hideCaret) {
        configuration.setHideCaret(hideCaret);
    }

    /**
     * Sets the maximum time (in ms) a match operation tries to perform a match.
     * @param ms Total number of ms to wait for a match.
     */
    public void setMatchTimeout(int ms) {
        this.configuration.setMatchTimeout(ms);
    }

    /**
     * Gets match timeout.
     * @return The maximum time in ms waits for a match.
     */
    public int getMatchTimeout() {
        return this.configuration.getMatchTimeout();
    }

    /**
     * Set whether or not new tests are saved by default.
     * @param saveNewTests True if new tests should be saved by default. False otherwise.
     */
    public void setSaveNewTests(boolean saveNewTests) {
        this.configuration.setSaveNewTests(saveNewTests);
    }


    /**
     * Gets save new tests.
     * @return True if new tests are saved by default.
     */
    public boolean getSaveNewTests() {
        return this.configuration.getSaveNewTests();
    }

    /**
     * Set whether or not failed tests are saved by default.
     * @param saveFailedTests True if failed tests should be saved by default, false otherwise.
     */
    public void setSaveFailedTests(boolean saveFailedTests) {
        this.configuration.setSaveFailedTests(saveFailedTests);
    }

    /**
     * Gets save failed tests.
     * @return True if failed tests are saved by default.
     */
    public boolean getSaveFailedTests() {
        return this.configuration.getSaveNewTests();
    }

    /**
     * Sets the batch in which context future tests will run or {@code null}
     * if tests are to run standalone.
     * @param batch The batch info to set.
     */
    public void setBatch(BatchInfo batch) {
        this.configuration.setBatch(batch);
    }

    /**
     * Gets batch.
     * @return The currently set batch info.
     */
    public BatchInfo getBatch() {
        return configuration.getBatch();
    }


    /**
     * Sets failure reports.
     * @param failureReports The failure reports setting.
     * @see FailureReports
     */
    public void setFailureReports(FailureReports failureReports) {
        configuration.setFailureReports(failureReports);
    }


    /**
     * Gets failure reports.
     * @return the failure reports setting.
     */
    public FailureReports getFailureReports() {
        return this.configuration.getFailureReports();
    }

    /**
     * Updates the match settings to be used for the session.
     * @param defaultMatchSettings The match settings to be used for the session.
     */
    public void setDefaultMatchSettings(ImageMatchSettings defaultMatchSettings) {
        configuration.setDefaultMatchSettings(defaultMatchSettings);
    }

    /**
     * Gets default match settings.
     * @return The match settings used for the session.
     */
    public ImageMatchSettings getDefaultMatchSettings() {
        return this.configuration.getDefaultMatchSettings();
    }

    /**
     * This function is deprecated. Please use {@link #setDefaultMatchSettings} instead.
     * <p>
     * The test-wide match level to use when checking application screenshot
     * with the expected output.
     * @param matchLevel The match level setting.
     * @see com.applitools.eyes.MatchLevel
     */
    public void setMatchLevel(MatchLevel matchLevel) {
        this.configuration.getDefaultMatchSettings().setMatchLevel(matchLevel);
    }

    /**
     * Gets match level.
     * @return The test-wide match level.
     * @deprecated Please use{@link #getDefaultMatchSettings} instead.
     */
    public MatchLevel getMatchLevel() {
        return this.configuration.getDefaultMatchSettings().getMatchLevel();
    }

    /**
     * Gets full agent id.
     * @return The full agent id composed of both the base agent id and the user given agent id.
     */
    public String getFullAgentId() {
        return this.configuration.getAgentId();
    }

    /**
     * Gets is open.
     * @return Whether a session is open.
     */
    public boolean getIsOpen() {
        return eyesRef != null;
    }

    /**
     * Gets default server url.
     * @return the default server url
     */
    public static URI getDefaultServerUrl() {
        try {
            return new URI(IEyesBase.APPLITOOLS_PUBLIC_CLOUD_URL);
        } catch (URISyntaxException ex) {
            throw new EyesException(ex.getMessage(), ex);
        }
    }

    /**
     * Sets a handler of log messages generated by this API.
     * @param logHandler Handles log messages generated by this API.
     */
    public void setLogHandler(LogHandler logHandler) {
        // For backward compatibility
    }

    /**
     * Gets log handler.
     * @return The currently set log handler.
     */
    public LogHandler getLogHandler() {
        return new NullLogHandler();
    }

    /**
     * Gets logger.
     * @return the logger
     */
    public Logger getLogger() {
        return new Logger();
    }

    /**
     * Manually set the the sizes to cut from an image before it's validated.
     * @param cutProvider the provider doing the cut.
     */
    public void setImageCut(CutProvider cutProvider) {
        this.configuration.setCutProvider(cutProvider);
    }

    /**
     * Gets is cut provider explicitly set.
     * @return the is cut provider explicitly set
     */
    public boolean getIsCutProviderExplicitlySet() {
        //return this.seleniumEyes.getIsCutProviderExplicitlySet();
        return false;
    }

    /**
     * Check.
     * @param tag           the tag
     * @param checkSettings the check settings
     */
    public void check(String tag, ICheckSettings checkSettings) {
        if (tag != null) {
            checkSettings = checkSettings.withName(tag);
        }

        CheckSettingsDto checkSettingsDto = CheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, configure());
        DriverTargetDto driverTargetDto = DriverMapper.toDriverTargetDto(getDriver(), configuration.getWebDriverProxy());
        checkDto(checkSettingsDto, driverTargetDto);
    }

    private void checkDto(CheckSettingsDto checkSettingsDto, DriverTargetDto target) {
        if (this.getIsDisabled()) {
            return;
        }

        if (!getIsOpen()) {
            this.abort();
            throw new EyesException("you must call open() before checking");
        }

        ArgumentGuard.notNull(checkSettingsDto, "checkSettings");

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        //TODO add image target
        commandExecutor.eyesCheck(eyesRef, null, checkSettingsDto, configurationDto);
    }
    /**
     * Close test results.
     * @param shouldThrowException the should throw exception
     * @return the test results
     */
    public TestResults close(boolean shouldThrowException) {

        if (getIsDisabled()) {
            return null;
        }

        if (!getIsOpen()) {
            throw new EyesException("Eyes not open");
        }

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        CloseSettingsDto settings = SettingsMapper.toCloseSettingsDto(getConfiguration());

        commandExecutor.close(eyesRef, settings, configurationDto);
        GetResultsSettings getResultsSettings = new GetResultsSettings(shouldThrowException);
        List<CommandEyesGetResultsResponseDto> getResultsResponse = commandExecutor.eyesGetResults(eyesRef, getResultsSettings);

        eyesRef = null;
        isClosed = true;

        List<TestResults> testResults = TestResultsMapper.toTestResultsList(getResultsResponse, getApiKey(), getServerUrl(), getProxy());
        if (testResults == null)
            return null;
        testResults.forEach(testResults1 -> runner.logSessionResultsAndThrowException(shouldThrowException, testResults1));
        return testResults.get(0);
    }

//    /**
//     * Check and Close test results.
//     * @param target the target.
//     * @param checkSettingsDto the check settings.
//     * @param closeSettingsDto the close settings.
//     * @param shouldThrowException should throw exception if visual differences were found.
//     * @return
//     */
//    private TestResults checkAndCloseDto(ITargetDto target, CheckSettingsDto checkSettingsDto,
//                                         CloseSettingsDto closeSettingsDto, Boolean shouldThrowException) {
//        if (getIsDisabled()) {
//            return null;
//        }
//
//        if (!getIsOpen()) {
//            throw new EyesException("Eyes not open");
//        }
//
//        ConfigurationDto configurationDto = ConfigurationMapper
//                .toConfigurationDto(configuration, runner.isDontCloseBatches());
//
//        List<CommandCloseResponseDto> closeResponse = commandExecutor.eyesCheckAndClose(eyesRef, target,
//                checkSettingsDto, closeSettingsDto, configurationDto);
//        this.eyesRef = null;
//        isClosed = true;
//        List<TestResults> testResults = TestResultsMapper.toTestResultsList(closeResponse);
//        testResults.forEach(testResults1 -> runner.logSessionResultsAndThrowException(shouldThrowException, testResults1));
//        return testResults.get(0);
//    }

    /**
     * Manually set the scale ratio for the images being validated.
     * @param scaleRatio The scale ratio to use, or {@code null} to reset                   back to automatic scaling.
     */
    public void setScaleRatio(Double scaleRatio) {
        this.configuration.setScaleRatio(scaleRatio);
    }

    /**
     * Gets scale ratio.
     * @return The ratio used to scale the images being validated.
     */
    public Double getScaleRatio() {
        return this.configuration.getScaleRatio();
    }

    /**
     * Adds a property to be sent to the server.
     * @param name  The property name.
     * @param value The property value.
     */
    public void addProperty(String name, String value) {
        this.configuration.addProperty(name, value);
    }

    /**
     * Clears the list of custom properties.
     */
    public void clearProperties() {
        this.configuration.clearProperties();
    }

    /**
     * Sets save debug screenshots.
     * @param saveDebugScreenshots If true, will save all screenshots to local directory.
     */
    public void setSaveDebugScreenshots(Boolean saveDebugScreenshots) {
        this.configuration.setSaveDebugScreenshots(saveDebugScreenshots);
    }

    /**
     * Gets save debug screenshots.
     * @return True if screenshots saving enabled.
     */
    public Boolean getSaveDebugScreenshots() {
        return this.configuration.getSaveDebugScreenshots();
    }

    /**
     * Sets debug screenshots path.
     * @param pathToSave Path where you want to save the debug screenshots.
     */
    public void setDebugScreenshotsPath(String pathToSave) {
        this.configuration.setDebugScreenshotsPath(pathToSave);
    }

    /**
     * Gets debug screenshots path.
     * @return The path where you want to save the debug screenshots.
     */
    public String getDebugScreenshotsPath() {
        return this.configuration.getDebugScreenshotsPath();
    }

    /**
     * Sets debug screenshots prefix.
     * @param prefix The prefix for the screenshots' names.
     */
    public void setDebugScreenshotsPrefix(String prefix) {
        this.configuration.setDebugScreenshotsPrefix(prefix);
    }

    /**
     * Gets debug screenshots prefix.
     * @return The prefix for the screenshots' names.
     */
    public String getDebugScreenshotsPrefix() {
        return this.configuration.getDebugScreenshotsPrefix();
    }

    /**
     * Gets debug screenshots provider.
     * @return the debug screenshots provider
     */
    public DebugScreenshotsProvider getDebugScreenshotsProvider() {
        //return this.seleniumEyes.getDebugScreenshotsProvider();
        return null;
    }

    /**
     * Gets ignore caret.
     * @return Whether to ignore or the blinking caret or not when comparing images.
     */
    public boolean getIgnoreCaret() {
        return this.configuration.getIgnoreCaret();
    }

    /**
     * Sets the ignore blinking caret value.
     * @param value The ignore value.
     */
    public void setIgnoreCaret(boolean value) {
        this.configuration.setIgnoreCaret(value);
    }

    /**
     * Gets stitch overlap.
     * @return Returns the stitching overlap in pixels.
     */
    public int getStitchOverlap() {
        return this.configuration.getStitchOverlap();
    }

    /**
     * Sets the stitching overlap in pixels.
     * @param pixels The width (in pixels) of the overlap.
     */
    public void setStitchOverlap(int pixels) {
        this.configuration.setStitchOverlap(pixels);
    }

    /**
     * Check region.
     * @param region the region the check. See {@link #checkRegion(Region, int, String)}. {@code tag} defaults to {@code null}. Default match timeout is used.
     */
    public void checkRegion(Region region) {
        checkRegion(region, USE_DEFAULT_MATCH_TIMEOUT, null);
    }

    /**
     * Takes a snapshot of the application under test and matches a specific region within it with the expected output.
     * @param region       A non empty region representing the screen region to check.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the snapshot.
     * @throws TestFailedException Thrown if a mismatch is detected and immediate failure reports are enabled.
     */
    public void checkRegion(final Region region, int matchTimeout, String tag) throws TestFailedException {
        if (getIsDisabled()) {
            return;
        }

        ArgumentGuard.notNull(region, "region");
        check(Target.region(region).timeout(matchTimeout).withName(tag));
    }

    /**
     * See {@link #checkRegion(WebElement, String)}.
     * {@code tag} defaults to {@code null}.
     * @param element The element which represents the region to check.
     */
    public void checkRegion(WebElement element) {
        checkRegion(element, USE_DEFAULT_MATCH_TIMEOUT, null, true);
    }

    /**
     * If {@code stitchContent} is {@code false} then behaves the same as
     * {@link #checkRegion(WebElement)}, otherwise
     * behaves the same as {@link #checkElement(WebElement)}.
     * @param element       The element which represents the region to check.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(WebElement element, boolean stitchContent) {
        checkRegion(element, USE_DEFAULT_MATCH_TIMEOUT, null, stitchContent);
    }

    /**
     * See {@link #checkRegion(WebElement, int, String)}.
     * Default match timeout is used.
     * @param element The element which represents the region to check.
     * @param tag     An optional tag to be associated with the snapshot.
     */
    public void checkRegion(WebElement element, String tag) {
        checkRegion(element, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * if {@code stitchContent} is {@code false} then behaves the same {@link
     * #checkRegion(WebElement, String)}***. Otherwise
     * behaves the same as {@link #checkElement(WebElement, String)}.
     * @param element       The element which represents the region to check.
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(WebElement element, String tag, boolean stitchContent) {
        checkRegion(element, USE_DEFAULT_MATCH_TIMEOUT, tag, stitchContent);
    }

    /**
     * Takes a snapshot of the application under test and matches a region of
     * a specific element with the expected region output.
     * @param element      The element which represents the region to check.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the snapshot.
     * @throws TestFailedException if a mismatch is detected and                             immediate failure reports are enabled
     */
    public void checkRegion(final WebElement element, int matchTimeout, String tag) {
        checkRegion(element, matchTimeout, tag, true);
    }

    /**
     * if {@code stitchContent} is {@code false} then behaves the same {@link
     * #checkRegion(WebElement, int, String)}***. Otherwise
     * behaves the same as {@link #checkElement(WebElement, String)}.
     * @param element       The element which represents the region to check.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(WebElement element, int matchTimeout, String tag, boolean stitchContent) {
        if (getIsDisabled()) {
            return;
        }

        ArgumentGuard.notNull(element, "element");
        check(Target.region(element).timeout(matchTimeout).withName(tag).fully(stitchContent));
    }

    /**
     * See {@link #checkRegion(By, String)}.
     * {@code tag} defaults to {@code null}.
     * @param selector The selector by which to specify which region to check.
     */
    public void checkRegion(By selector) {
        checkRegion(selector, USE_DEFAULT_MATCH_TIMEOUT, null, false);
    }

    /**
     * If {@code stitchContent} is {@code false} then behaves the same as
     * {@link #checkRegion(By)}. Otherwise, behaves the
     * same as {@code #checkElement(org.openqa.selenium.By)}
     * @param selector      The selector by which to specify which region to check.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(By selector, boolean stitchContent) {
        checkRegion(selector, USE_DEFAULT_MATCH_TIMEOUT, null, stitchContent);
    }

    /**
     * See {@link #checkRegion(By, int, String)}.
     * Default match timeout is used.
     * @param selector The selector by which to specify which region to check.
     * @param tag      An optional tag to be associated with the screenshot.
     */
    public void checkRegion(By selector, String tag) {
        checkRegion(selector, USE_DEFAULT_MATCH_TIMEOUT, tag, true);
    }

    /**
     * If {@code stitchContent} is {@code false} then behaves the same as
     * {@link #checkRegion(By, String)}. Otherwise,
     * behaves the same as {@link #checkElement(By, String)}.
     * @param selector      The selector by which to specify which region to check.
     * @param tag           An optional tag to be associated with the screenshot.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(By selector, String tag, boolean stitchContent) {
        checkRegion(selector, USE_DEFAULT_MATCH_TIMEOUT, tag, stitchContent);
    }

    /**
     * Takes a snapshot of the application under test and matches a region
     * specified by the given selector with the expected region output.
     * @param selector     The selector by which to specify which region to check.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the screenshot.
     * @throws TestFailedException if a mismatch is detected and                             immediate failure reports are enabled
     */
    public void checkRegion(By selector, int matchTimeout, String tag) {
        checkRegion(selector, matchTimeout, tag, true);
    }

    /**
     * If {@code stitchContent} is {@code true} then behaves the same as
     * {@link #checkRegion(By, int, String)}. Otherwise,
     * behaves the same as {@link #checkElement(By, int, String)}.
     * @param selector      The selector by which to specify which region to check.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the screenshot.
     * @param stitchContent Whether to take a screenshot of the whole region and stitch if needed.
     */
    public void checkRegion(By selector, int matchTimeout, String tag, boolean stitchContent) {
        check(tag, Target.region(selector).timeout(matchTimeout).fully(stitchContent));
    }

    /**
     * See {@link #checkRegionInFrame(int, By, String)}.
     * {@code tag} defaults to {@code null}.
     * @param frameIndex The index of the frame to switch to. (The same index                   as would be used in a call to                   driver.switchTo().frame()).
     * @param selector   The selector by which to specify which region to check inside the frame.
     */
    public void checkRegionInFrame(int frameIndex, By selector) {
        checkRegionInFrame(frameIndex, selector, null);
    }

    /**
     * Switches into the given frame, takes a snapshot of the application under
     * test and matches a region specified by the given selector.
     * @param framePath     The path to the frame to check. This is a list of                      frame names/IDs (where each frame is nested in the previous frame).
     * @param selector      A Selector specifying the region to check.
     * @param matchTimeout  The amount of time to retry matching (milliseconds).
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent Whether or not to stitch the internal content of the                      region (i.e., perform {@link #checkElement(By, int, String)} on the region.
     */
    public void checkRegionInFrame(String[] framePath, By selector,
                                   int matchTimeout, String tag,
                                   boolean stitchContent) {

        SeleniumCheckSettings settings = Target.frame(framePath[0]);
        for (int i = 1; i < framePath.length; i++) {
            settings = settings.frame(framePath[i]);
        }
        check(tag, settings.region(selector).timeout(matchTimeout).fully(stitchContent));
    }

    /**
     * Switches into the given frame, takes a snapshot of the application under
     * test and matches a region specified by the given selector.
     * @param frameIndex    The index of the frame to switch to. (The same index                      as would be used in a call to                      driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent If {@code true}, stitch the internal content of                      the region (i.e., perform                      {@link #checkElement(By, int, String)} on the                      region.
     */
    public void checkRegionInFrame(int frameIndex, By selector,
                                   int matchTimeout, String tag,
                                   boolean stitchContent) {
        check(tag, Target.frame(frameIndex).region(selector).timeout(matchTimeout).fully(stitchContent));
    }

    /**
     * See {@link #checkRegionInFrame(int, By, String)}.
     * {@code tag} defaults to {@code null}.
     * @param frameIndex    The index of the frame to switch to. (The same index
     *                      as would be used in a call to
     *                      driver.switchTo().frame()).
     * @param selector      The selector by which to specify which region to check inside the frame.
     * @param stitchContent If {@code true}, stitch the internal content of
     *                      the region (i.e., perform
     *                      {@link #checkElement(By, int, String)} on the
     *                      region.
     */
    public void checkRegionInFrame(int frameIndex, By selector, boolean stitchContent) {
        checkRegionInFrame(frameIndex, selector, null, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(int, By, String, boolean)}.
     * {@code stitchContent} defaults to {@code true}.
     * @param frameIndex The index of the frame to switch to. (The same index
     *                   as would be used in a call to
     *                   driver.switchTo().frame()).
     * @param selector   The selector by which to specify which region to check inside the frame.
     * @param tag        An optional tag to be associated with the screenshot.
     */
    public void checkRegionInFrame(int frameIndex, By selector, String tag) {
        checkRegionInFrame(frameIndex, selector, USE_DEFAULT_MATCH_TIMEOUT, tag);

    }

    /**
     * See {@link #checkRegionInFrame(int, By, int, String, boolean)}.
     * Default match timeout is used.
     * @param frameIndex    The index of the frame to switch to. (The same index
     *                      as would be used in a call to
     *                      driver.switchTo().frame()).
     * @param selector      The selector by which to specify which region to check inside the frame.
     * @param tag           An optional tag to be associated with the screenshot.
     * @param stitchContent If {@code true}, stitch the internal content of
     *                      the region (i.e., perform
     *                      {@link #checkElement(By, int, String)} on the
     *                      region.
     */
    public void checkRegionInFrame(int frameIndex, By selector, String tag, boolean stitchContent) {
        checkRegionInFrame(frameIndex, selector, USE_DEFAULT_MATCH_TIMEOUT, tag, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(int, By, int, String, boolean)}.
     * {@code stitchContent} defaults to {@code true}.
     * @param frameIndex   The index of the frame to switch to. (The same index
     *                     as would be used in a call to
     *                     driver.switchTo().frame()).
     * @param selector     The selector by which to specify which region to check inside the frame.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the screenshot.
     */
    public void checkRegionInFrame(int frameIndex, By selector, int matchTimeout, String tag) {
        checkRegionInFrame(frameIndex, selector, matchTimeout, tag, true);
    }


    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * {@code stitchContent} defaults to {@code null}.
     * @param frameNameOrId The name or id of the frame to switch to. (as would
     *                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector) {
        checkRegionInFrame(frameNameOrId, selector, true);
    }

    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * {@code tag} defaults to {@code null}.
     * @param frameNameOrId The name or id of the frame to switch to. (as would
     *                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     * @param stitchContent If {@code true}, stitch the internal content of
     *                      the region (i.e., perform
     *                      {@link #checkElement(By, int, String)} on the
     *                      region.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector, boolean stitchContent) {
        checkRegionInFrame(frameNameOrId, selector, USE_DEFAULT_MATCH_TIMEOUT, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * {@code tag} defaults to {@code null}.
     * @param frameNameOrId The name or id of the frame to switch to. (as would
     *                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param stitchContent If {@code true}, stitch the internal content of
     *                      the region (i.e., perform
     *                      {@link #checkElement(By, int, String)} on the
     *                      region.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector, int matchTimeout, boolean stitchContent) {
        checkRegionInFrame(frameNameOrId, selector, matchTimeout, null, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * {@code stitchContent} defaults to {@code null}.
     * @param frameNameOrId The name or id of the frame to switch to. (as would
     *                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     * @param tag           An optional tag to be associated with the snapshot.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector, String tag) {
        checkRegionInFrame(frameNameOrId, selector, USE_DEFAULT_MATCH_TIMEOUT, tag, true);
    }

    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * Default match timeout is used
     * @param frameNameOrId The name or id of the frame to switch to. (as would
     *                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check.
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent If {@code true}, stitch the internal content of
     *                      the region (i.e., perform
     *                      {@link #checkElement(By, int, String)} on the
     *                      region.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector, String tag, boolean stitchContent) {
        checkRegionInFrame(frameNameOrId, selector, USE_DEFAULT_MATCH_TIMEOUT, tag, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(String, By, int, String, boolean)}.
     * {@code stitchContent} defaults to {@code true}.
     * @param frameNameOrId The name or id of the frame to switch to. (as would                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check inside the frame.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the snapshot.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector,
                                   int matchTimeout, String tag) {
        checkRegionInFrame(frameNameOrId, selector, matchTimeout, tag, true);
    }

    /**
     * Switches into the given frame, takes a snapshot of the application under
     * test and matches a region specified by the given selector.
     * @param frameNameOrId The name or id of the frame to switch to. (as would                      be used in a call to driver.switchTo().frame()).
     * @param selector      A Selector specifying the region to check inside the frame.
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the snapshot.
     * @param stitchContent If {@code true}, stitch the internal content of                      the region (i.e., perform                      {@link #checkElement(By, int, String)} on the region.
     */
    public void checkRegionInFrame(String frameNameOrId, By selector,
                                   int matchTimeout, String tag,
                                   boolean stitchContent) {
        check(tag, Target.frame(frameNameOrId).region(selector).timeout(matchTimeout).fully(stitchContent));
    }

    /**
     * See {@link #checkRegionInFrame(WebElement, By, boolean)}.
     * {@code stitchContent} defaults to {@code null}.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check inside the frame.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector) {
        checkRegionInFrame(frameReference, selector, USE_DEFAULT_MATCH_TIMEOUT, null);
    }

    /**
     * See {@link #checkRegionInFrame(WebElement, By, String, boolean)}.
     * {@code tag} defaults to {@code null}.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check inside the frame.
     * @param stitchContent  If {@code true}, stitch the internal content of                       the region (i.e., perform                       {@link #checkElement(By, int, String)} on the                       region.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector, boolean stitchContent) {
        checkRegionInFrame(frameReference, selector, USE_DEFAULT_MATCH_TIMEOUT, null, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(WebElement, By, String, boolean)}.
     * {@code stitchContent} defaults to {@code true}.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check inside the frame.
     * @param tag            An optional tag to be associated with the snapshot.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector, String tag) {
        checkRegionInFrame(frameReference, selector, USE_DEFAULT_MATCH_TIMEOUT, tag, true);
    }

    /**
     * See {@link #checkRegionInFrame(WebElement, By, int, String, boolean)}.
     * Default match timeout is used.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check inside the frame.
     * @param tag            An optional tag to be associated with the snapshot.
     * @param stitchContent  If {@code true}, stitch the internal content of                       the region (i.e., perform                       {@link #checkElement(By, int, String)} on the                       region.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector,
                                   String tag, boolean stitchContent) {
        checkRegionInFrame(frameReference, selector, USE_DEFAULT_MATCH_TIMEOUT, tag, stitchContent);
    }

    /**
     * See {@link #checkRegionInFrame(WebElement, By, int, String, boolean)}.
     * {@code stitchContent} defaults to {@code true}.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check inside the frame.
     * @param matchTimeout   The amount of time to retry matching. (Milliseconds)
     * @param tag            An optional tag to be associated with the snapshot.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector,
                                   int matchTimeout, String tag) {
        checkRegionInFrame(frameReference, selector, matchTimeout, tag, true);
    }

    /**
     * Switches into the given frame, takes a snapshot of the application under
     * test and matches a region specified by the given selector.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame()).
     * @param selector       A Selector specifying the region to check.
     * @param matchTimeout   The amount of time to retry matching. (Milliseconds)
     * @param tag            An optional tag to be associated with the snapshot.
     * @param stitchContent  If {@code true}, stitch the internal content of                       the region (i.e., perform                       {@link #checkElement(By, int, String)} on the                       region.
     */
    public void checkRegionInFrame(WebElement frameReference, By selector,
                                   int matchTimeout, String tag,
                                   boolean stitchContent) {
        check(tag, Target.frame(frameReference).region(selector).timeout(matchTimeout).fully(stitchContent));
    }

    /**
     * See {@link #checkElement(WebElement, String)}.
     * {@code tag} defaults to {@code null}.
     * @param element the element
     */
    public void checkElement(WebElement element) {
        checkElement(element, null);
    }

    /**
     * Check element.
     * @param element the element to check
     * @param tag     See {@link #checkElement(WebElement, int, String)}.                Default match timeout is used.
     */
    public void checkElement(WebElement element, String tag) {
        checkElement(element, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * Takes a snapshot of the application under test and matches a specific
     * element with the expected region output.
     * @param element      The element to check.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the snapshot.
     * @throws TestFailedException if a mismatch is detected and immediate failure reports are enabled
     */
    public void checkElement(WebElement element, int matchTimeout, String tag) {
        check(tag, Target.region(element).timeout(matchTimeout).fully());
    }

    /**
     * Check element.
     * @param selector the selector                 See {@link #checkElement(By, String)}.                 {@code tag} defaults to {@code null}.
     */
    public void checkElement(By selector) {
        checkElement(selector, USE_DEFAULT_MATCH_TIMEOUT, null);
    }

    /**
     * Check element.
     * @param selector selector
     * @param tag      tg                 See {@link #checkElement(By, int, String)}.                 Default match timeout is used.
     */
    public void checkElement(By selector, String tag) {
        checkElement(selector, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * Takes a snapshot of the application under test and matches an element
     * specified by the given selector with the expected region output.
     * @param selector     Selects the element to check.
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the screenshot.
     * @throws TestFailedException if a mismatch is detected and                             immediate failure reports are enabled
     */
    public void checkElement(By selector, int matchTimeout, String tag) {
        check(tag, Target.region(selector).timeout(matchTimeout).fully());
    }

    /**
     * Use this method only if you made a previous call to {@link #open
     * (WebDriver, String, String)}*** or one of its variants.
     * <p>
     * {@inheritDoc}
     * @return the viewport size
     */
    public RectangleSize getViewportSize() {
        return null;
    }

    /**
     * Call this method if for some
     * reason you don't want to call {@link #open(WebDriver, String, String)}
     * (or one of its variants) yet.
     * @param driver The driver to use for getting the viewport.
     * @return The viewport size of the current context.
     */
    public static RectangleSize getViewportSize(WebDriver driver) {
        DriverTargetDto driverTargetDto = DriverMapper.toDriverTargetDto(driver, null);
        RectangleSizeDto rectangleSizeDto = CommandExecutor.getViewportSize(driverTargetDto);
        return RectangleSizeMapper.toRectangleSize(rectangleSizeDto);
    }


    /**
     * Set the viewport size using the driver. Call this method if for some
     * reason you don't want to call {@link #open(WebDriver, String, String)}
     * (or one of its variants) yet.
     * @param driver The driver to use for setting the viewport.
     * @param size   The required viewport size.
     */
    public static void setViewportSize(WebDriver driver, RectangleSize size) {
        ArgumentGuard.notNull(driver, "driver");
//        EyesDriverUtils.setViewportSize(new Logger(), driver, size);
    }

    /**
     * Gets hide caret.
     * @return gets the hide caret flag
     */
    public boolean getHideCaret() {
        return configuration.getHideCaret();
    }

    /**
     * Should stitch content boolean.
     * @return the should stitch flag
     */
    public boolean shouldStitchContent() {
        //return seleniumEyes.shouldStitchContent();
        return false;
    }

    /**
     * Forces a full page screenshot (by scrolling and stitching) if the
     * browser only supports viewport screenshots).
     * @param shouldForce Whether to force a full page screenshot or not.
     */
    public void setForceFullPageScreenshot(boolean shouldForce) {
        configuration.setForceFullPageScreenshot(shouldForce);
    }

    /**
     * Gets force full page screenshot.
     * @return Whether SeleniumEyes should force a full page screenshot.
     */
    public boolean getForceFullPageScreenshot() {
        Boolean forceFullPageScreenshot = configuration.getForceFullPageScreenshot();
        if (forceFullPageScreenshot == null) {
            return isVisualGridEyes;
        }
        return forceFullPageScreenshot;
    }

    /**
     * Sets the time to wait just before taking a screenshot (e.g., to allow
     * positioning to stabilize when performing a full page stitching).
     * @param waitBeforeScreenshots The time to wait (Milliseconds). Values smaller or equal to 0, will cause the
     * default value to be used.
     */
    public void setWaitBeforeScreenshots(int waitBeforeScreenshots) {
        this.configuration.setWaitBeforeScreenshots(waitBeforeScreenshots);
    }

    /**
     * Gets wait before screenshots.
     * @return The time to wait just before taking a screenshot.
     */
    public int getWaitBeforeScreenshots() {
        return this.configuration.getWaitBeforeScreenshots();
    }


    /**
     * Turns on/off the automatic scrolling to a region being checked by
     * {@code checkRegion}.
     * @param shouldScroll Whether to automatically scroll to a region being validated.
     */
    public void setScrollToRegion(boolean shouldScroll) {
        // For backward compatibility
    }

    /**
     * Gets scroll to region.
     * @return Whether to automatically scroll to a region being validated.
     */
    @SuppressWarnings("BooleanMethodIsAlwaysInverted")
    public boolean getScrollToRegion() {
        return false;
    }

    /**
     * Set the type of stitching used for full page screenshots. When the
     * page includes fixed position header/sidebar, use {@link StitchMode#CSS}.
     * Default is {@link StitchMode#SCROLL}.
     * @param mode The stitch mode to set.
     */
    public void setStitchMode(StitchMode mode) {
        this.configuration.setStitchMode(mode);
    }

    /**
     * Gets stitch mode.
     * @return The current stitch mode settings.
     */
    public StitchMode getStitchMode() {
        return this.configuration.getStitchMode();
    }

    /**
     * Hide the scrollbars when taking screenshots.
     * @param shouldHide Whether to hide the scrollbars or not.
     */
    public void setHideScrollbars(boolean shouldHide) {
        this.configuration.setHideScrollbars(shouldHide);
    }

    /**
     * Gets hide scrollbars.
     * @return Whether or not scrollbars are hidden when taking screenshots.
     */
    public boolean getHideScrollbars() {
        return this.configuration.getHideScrollbars();
    }

    /**
     * Gets rotation.
     * @return The image rotation model.
     */
    public ImageRotation getRotation() {
        return rotation;
    }

    /**
     * Sets rotation.
     * @param rotation The image rotation model.
     */
    public void setRotation(ImageRotation rotation) {
        this.configuration.setRotation(rotation.getRotation());
        this.rotation = rotation;
    }

    /**
     * Gets device pixel ratio.
     * @return The device pixel ratio, or if the DPR is not known yet or if it wasn't possible to extract it.
     */
    public double getDevicePixelRatio() {
        //return this.seleniumEyes.getDevicePixelRatio();
        return 0;
    }

    /**
     * See {@link #checkWindow(String)}.
     * {@code tag} defaults to {@code null}.
     * Default match timeout is used.
     */
    public void checkWindow() {
        checkWindow(null);
    }

    /**
     * See {@link #checkWindow(int, String)}.
     * Default match timeout is used.
     * @param tag An optional tag to be associated with the snapshot.
     */
    public void checkWindow(String tag) {
        check(tag, Target.window());
    }

    /**
     * Takes a snapshot of the application under test and matches it with
     * the expected output.
     * @param matchTimeout The amount of time to retry matching (Milliseconds).
     * @param tag          An optional tag to be associated with the snapshot.
     * @throws TestFailedException Thrown if a mismatch is detected and                             immediate failure reports are enabled.
     */
    public void checkWindow(int matchTimeout, String tag) {
        check(tag, Target.window().timeout(matchTimeout));
    }

    public void checkWindow(String tag, boolean fully) {
        check(tag, Target.window().fully(fully));

    }

    /**
     * Takes multiple screenshots at once (given all <code>ICheckSettings</code> objects are on the same level).
     * @param checkSettings Multiple <code>ICheckSettings</code> object representing different regions in the viewport.
     */
    public void check(ICheckSettings... checkSettings) {
        for (ICheckSettings checkSettings1 : checkSettings) {
            check(checkSettings1);
        }
    }

    /**
     * Check frame.
     * @param frameNameOrId frame to check(name or id) See {@link #checkFrame(String, int, String)}.
     *                      {@code tag} defaults to {@code null}. Default match timeout is used.
     */
    public void checkFrame(String frameNameOrId) {
        checkFrame(frameNameOrId, null);
    }

    /**
     * Check frame.
     * @param frameNameOrId frame to check(name or id)
     * @param tag           See {@link #checkFrame(String, int, String)}.                      Default match timeout is used.
     */
    public void checkFrame(String frameNameOrId, String tag) {
        checkFrame(frameNameOrId, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * Matches the frame given as parameter, by switching into the frame and
     * using stitching to get an image of the frame.
     * @param frameNameOrId The name or id of the frame to check. (The same                      name/id as would be used in a call to                      driver.switchTo().frame()).
     * @param matchTimeout  The amount of time to retry matching. (Milliseconds)
     * @param tag           An optional tag to be associated with the match.
     */
    public void checkFrame(String frameNameOrId, int matchTimeout, String tag) {
        check(tag, Target.frame(frameNameOrId).fully().timeout(matchTimeout));
    }

    /**
     * Check frame.
     * @param frameIndex index of frame                   See {@link #checkFrame(int, int, String)}.                   {@code tag} defaults to {@code null}. Default match timeout is used.
     */
    public void checkFrame(int frameIndex) {
        checkFrame(frameIndex, null);
    }

    /**
     * Check frame.
     * @param frameIndex index of frame
     * @param tag        See {@link #checkFrame(int, int, String)}.                   Default match timeout is used.
     */
    public void checkFrame(int frameIndex, String tag) {
        checkFrame(frameIndex, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * Matches the frame given as parameter, by switching into the frame and
     * using stitching to get an image of the frame.
     * @param frameIndex   The index of the frame to switch to. (The same index                     as would be used in a call to                     driver.switchTo().frame()).
     * @param matchTimeout The amount of time to retry matching. (Milliseconds)
     * @param tag          An optional tag to be associated with the match.
     */
    public void checkFrame(int frameIndex, int matchTimeout, String tag) {
        check(tag, Target.frame(frameIndex).timeout(matchTimeout).fully());
    }

    /**
     * Check frame.
     * @param frameReference web element to check                       See {@link #checkFrame(WebElement, int, String)}.                       {@code tag} defaults to {@code null}.                       Default match timeout is used.
     */
    public void checkFrame(WebElement frameReference) {
        checkFrame(frameReference, USE_DEFAULT_MATCH_TIMEOUT, null);
    }

    /**
     * Check frame.
     * @param frameReference web element to check
     * @param tag            tag                       See {@link #checkFrame(WebElement, int, String)}.                       Default match timeout is used.
     */
    public void checkFrame(WebElement frameReference, String tag) {
        checkFrame(frameReference, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * Matches the frame given as parameter, by switching into the frame and
     * using stitching to get an image of the frame.
     * @param frameReference The element which is the frame to switch to. (as                       would be used in a call to                       driver.switchTo().frame() ).
     * @param matchTimeout   The amount of time to retry matching (milliseconds).
     * @param tag            An optional tag to be associated with the match.
     */
    public void checkFrame(WebElement frameReference, int matchTimeout, String tag) {
        check(tag, Target.frame(frameReference).timeout(matchTimeout).fully());
    }

    /**
     * Matches the frame given by the frames path, by switching into the frame
     * and using stitching to get an image of the frame.
     * @param framePath    The path to the frame to check. This is a list of                     frame names/IDs (where each frame is nested in the                     previous frame).
     * @param matchTimeout The amount of time to retry matching (milliseconds).
     * @param tag          An optional tag to be associated with the match.
     */
    public void checkFrame(String[] framePath, int matchTimeout, String tag) {

        SeleniumCheckSettings settings = Target.frame(framePath[0]);
        for (int i = 1; i < framePath.length; i++) {
            settings = settings.frame(framePath[i]);
        }
        check(tag, settings.timeout(matchTimeout));
    }

    /**
     * See {@link #checkFrame(String[], int, String)}.
     * Default match timeout is used.
     * @param framesPath the frames path
     * @param tag        the tag
     */
    public void checkFrame(String[] framesPath, String tag) {
        this.checkFrame(framesPath, USE_DEFAULT_MATCH_TIMEOUT, tag);
    }

    /**
     * See {@link #checkFrame(String[], int, String)}.
     * Default match timeout is used.
     * {@code tag} defaults to {@code null}.
     * @param framesPath the frames path
     */
    public void checkFrame(String[] framesPath) {
        this.checkFrame(framesPath, null);
    }

    /**
     * Gets server url.
     * @return The URI of the eyes server.
     */
    public URI getServerUrl() {
        return this.configuration.getServerUrl();
    }

    /**
     * Sets the user given agent id of the SDK. {@code null} is referred to
     * as no id.
     * @param agentId The agent ID to set.
     */
    public void setAgentId(String agentId) {
        this.configuration.setAgentId(agentId);
    }

    /**
     * Gets agent id.
     * @return The user given agent id of the SDK.
     */
    public String getAgentId() {
        return this.configuration.getAgentId();
    }

    /**
     * Gets proxy.
     * @return The current proxy settings used by the server connector, or {@code null} if no proxy is set.
     */
    public AbstractProxySettings getProxy() {
        return this.configuration.getProxy();
    }


    /**
     * Sets app name.
     * @param appName The name of the application under test.
     */
    public void setAppName(String appName) {
        this.configuration.setAppName(appName);
    }

    /**
     * Gets app name.
     * @return The name of the application under test.
     */
    public String getAppName() {
        return configuration.getAppName();
    }


    /**
     * Gets host os.
     * @return the host os
     */
    public String getHostOS() {
        return this.configuration.getHostOS();
    }

    /**
     * Gets host app.
     * @return The application name running the AUT.
     */
    public String getHostApp() {
        return this.configuration.getHostApp();
    }

    /**
     * Sets baseline name.
     * @param baselineName If specified, determines the baseline to compare                     with and disables automatic baseline inference.
     * @deprecated Only available for backward compatibility. See {@link #setBaselineEnvName(String)}.
     */
    public void setBaselineName(String baselineName) {
        setBaselineEnvName(baselineName);
    }

    /**
     * Gets baseline name.
     * @return The baseline name, if specified.
     * @deprecated Only available for backward compatibility. See {@link #getBaselineEnvName()}.
     */
    @SuppressWarnings("UnusedDeclaration")
    public String getBaselineName() {
        return getBaselineEnvName();
    }

    /**
     * If not {@code null}, determines the name of the environment of the baseline.
     * @param baselineEnvName The name of the baseline's environment.
     */
    public void setBaselineEnvName(String baselineEnvName) {
        this.configuration.setBaselineEnvName(baselineEnvName);
    }

    /**
     * If not {@code null}, determines the name of the environment of the baseline.
     * @return The name of the baseline's environment, or {@code null} if no such name was set.
     */
    public String getBaselineEnvName() {
        return configuration.getBaselineEnvName();
    }


    /**
     * If not {@code null} specifies a name for the environment in which the application under test is running.
     * @param envName The name of the environment of the baseline.
     */
    public void setEnvName(String envName) {
        this.configuration.setEnvironmentName(envName);
    }

    /**
     * If not {@code null} specifies a name for the environment in which the application under test is running.
     * @return The name of the environment of the baseline, or {@code null} if no such name was set.
     */
    public String getEnvName() {
        return this.configuration.getEnvironmentName();
    }


    /**
     * Gets position provider.
     * @return The currently set position provider.
     */
    @Deprecated
    public PositionProvider getPositionProvider() {
        return null;
    }

    /**
     * Sets position provider.
     * @param positionProvider The position provider to be used.
     */
    @Deprecated
    public void setPositionProvider(PositionProvider positionProvider) {
        //this.seleniumEyes.setPositionProvider(positionProvider);
    }

    /**
     * Sets explicit viewport size.
     * @param explicitViewportSize sets the viewport
     */
    @Deprecated
    public void setExplicitViewportSize(RectangleSize explicitViewportSize) {
        //this.seleniumEyes.setExplicitViewportSize(explicitViewportSize);
    }

    /**
     * Log.
     * @param message the massage to log
     */
    public void log(String message) {
        //activeEyes.getLogger().log(TraceLevel.Notice, Stage.GENERAL,message);
    }

    /**
     * Is send dom boolean.
     * @return sendDom flag
     */
    public boolean isSendDom() {
        return this.configuration.isSendDom();
    }

    /**
     * Sets send dom.
     * @param isSendDom should send dom flag
     */
    public void setSendDom(boolean isSendDom) {
        this.configuration.setSendDom(isSendDom);
    }

    /**
     * Sets host os.
     * @param hostOS the hosting host
     */
    public void setHostOS(String hostOS) {
        this.configuration.setHostOS(hostOS);
    }

    /**
     * Sets host app.
     * @param hostApp The application running the AUT (e.g., Chrome).
     */
    public void setHostApp(String hostApp) {
        this.configuration.setHostApp(hostApp);
    }

    /**
     * Gets branch name.
     * @return The current branch (see {@link #setBranchName(String)}).
     */
    public String getBranchName() {
        return configuration.getBranchName();
    }

    /**
     * Gets parent branch name.
     * @return The name of the current parent branch under which new branches will be created. (see {@link #setParentBranchName(String)}).
     */
    public String getParentBranchName() {
        return configuration.getParentBranchName();
    }

    /**
     * Sets the branch under which new branches are created. (see {@link
     * #setBranchName(String)}***.
     * @param branchName Branch name or {@code null} to specify the default branch.
     */
    public void setBaselineBranchName(String branchName) {
        this.configuration.setBaselineBranchName(branchName);
    }

    /**
     * Gets baseline branch name.
     * @return The name of the current parent branch under which new branches will be created. (see {@link #setBaselineBranchName(String)}).
     */
    public String getBaselineBranchName() {
        return configuration.getBaselineBranchName();
    }

    /**
     * Automatically save differences as a baseline.
     * @param saveDiffs Sets whether to automatically save differences as baseline.
     */
    public void setSaveDiffs(Boolean saveDiffs) {
        this.configuration.setSaveDiffs(saveDiffs);
    }

    /**
     * Returns whether to automatically save differences as a baseline.
     * @return Whether to automatically save differences as baseline.
     */
    public Boolean getSaveDiffs() {
        return this.configuration.getSaveDiffs();
    }

    public void setIgnoreDisplacements(boolean isIgnoreDisplacements) {
        this.configuration.setIgnoreDisplacements(isIgnoreDisplacements);
    }

    public boolean getIgnoreDisplacements() {
        return this.configuration.getIgnoreDisplacements();
    }

    @Deprecated
    public void setDebugResourceWriter(IDebugResourceWriter debugResourceWriter) {
        this.configuration.setDebugResourceWriter(debugResourceWriter);
    }

    /**
     * Superseded by {@link #setHostOS(String)} and {@link #setHostApp(String)}.
     * Sets the OS (e.g., Windows) and application (e.g., Chrome) that host the application under test.
     * @param hostOS  The name of the OS hosting the application under test or {@code null} to auto-detect.
     * @param hostApp The name of the application hosting the application under test or {@code null} to auto-detect.
     */
    @Deprecated
    public void setAppEnvironment(String hostOS, String hostApp) {
        setHostOS(hostOS);
        setHostApp(hostApp);
    }

    /**
     * Gets driver.
     * @return the driver
     */
    public WebDriver getDriver() {
        return driver;
    }

    /**
     * Gets current frame position provider.
     * @return get Current Frame Position Provider
     */
    @Deprecated
    public PositionProvider getCurrentFramePositionProvider() {
        return null;
    }

    /**
     * Gets region to check.
     * @return the region to check
     */
    @Deprecated
    public Region getRegionToCheck() {
        return null;
    }

    /**
     * Sets region to check.
     * @param regionToCheck the region to check
     */
    @Deprecated
    public void setRegionToCheck(Region regionToCheck) {
    }

    /**
     * Gets current frame scroll root element.
     * @return the current scroll root web element
     */
    @Deprecated
    public WebElement getCurrentFrameScrollRootElement() {
        return null;
    }

    public com.applitools.eyes.selenium.Configuration getConfiguration() {
        return new com.applitools.eyes.selenium.Configuration(configuration);
    }

    public void setConfiguration(Configuration configuration) {
        ArgumentGuard.notNull(configuration, "configuration");
        String apiKey = configuration.getApiKey();
        if (apiKey != null) {
            this.setApiKey(apiKey);
        }
        URI serverUrl = configuration.getServerUrl();
        if (serverUrl != null) {
            this.setServerUrl(serverUrl.toString());
        }
        AbstractProxySettings proxy = configuration.getProxy();
        if (proxy != null) {
            this.setProxy(proxy);
        }
        this.configuration = new Configuration(configuration);
    }

    public void closeAsync() {

        if (Boolean.TRUE.equals(getIsDisabled())) {
            return;
        }

        if (!getIsOpen()) {
            throw new EyesException("Eyes not open");
        }

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        CloseSettingsDto settings = SettingsMapper.toCloseSettingsDto(getConfiguration());

        commandExecutor.close(eyesRef, settings, configurationDto);
        eyesRef = null;
        isClosed = true;
    }

    public Map<String, List<Region>> locate(VisualLocatorSettings visualLocatorSettings) {
        ArgumentGuard.notNull(visualLocatorSettings, "visualLocatorSettings");
        VisualLocatorSettingsDto visualLocatorSettingsDto = VisualLocatorSettingsMapper
            .toVisualLocatorSettingsDto(visualLocatorSettings);

        if (!getIsOpen()) {
            this.abort();
            throw new EyesException("you must call open() before locate");
        }

        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        DriverTargetDto target = DriverMapper.toDriverTargetDto(getDriver(), configuration.getWebDriverProxy());

        return this.locateDto(target, visualLocatorSettingsDto, configurationDto);
    }

    private Map<String, List<Region>> locateDto(ITargetDto target, VisualLocatorSettingsDto settings, ConfigurationDto config) {
        Map<String, List<RegionDto>> response = commandExecutor.locate(target, settings, config);
        return LocateMapper.toLocateFromDto(response);
    }

    // in v3 this was changed to 'locateText'.
    public Map<String, List<TextRegion>> extractTextRegions(TextRegionSettings textRegionSettings) {
        OCRSearchSettingsDto ocrSearchSettingsDto = OCRSearchSettingsMapper.toOCRSearchSettingsDto(textRegionSettings);
        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        ITargetDto target = DriverMapper.toDriverTargetDto(getDriver(), configuration.getWebDriverProxy());
        return locateTextDto(target, ocrSearchSettingsDto, configurationDto);
    }

    private Map<String, List<TextRegion>> locateTextDto(ITargetDto target, OCRSearchSettingsDto settings, ConfigurationDto config) {
        return commandExecutor.locateText(target, settings, config);
    }

    public List<String> extractText(BaseOcrRegion... ocrRegions) {
        List<OCRExtractSettingsDto> ocrExtractSettingsDtoList = OCRExtractSettingsDtoMapper
            .toOCRExtractSettingsDtoList(Arrays.asList(ocrRegions));
        ConfigurationDto configurationDto = ConfigurationMapper
                .toConfigurationDto(configuration, runner.isDontCloseBatches());
        DriverTargetDto target = DriverMapper.toDriverTargetDto(getDriver(), configuration.getWebDriverProxy());
        return extractTextDto(target, ocrExtractSettingsDtoList, configurationDto);

    }

    private List<String> extractTextDto(ITargetDto target, List<OCRExtractSettingsDto> settings, ConfigurationDto config) {
        return commandExecutor.extractText(target, settings, config);
    }

    public Reference getEyesRef() {
        return eyesRef;
    }

    public Configuration configure() {
        return this.configuration;
    }
}
