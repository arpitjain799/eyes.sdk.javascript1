package com.applitools.eyes.appium;

import com.applitools.eyes.AccessibilityRegionType;
import com.applitools.eyes.LazyLoadOptions;
import com.applitools.eyes.Region;
import com.applitools.eyes.selenium.fluent.*;
import com.applitools.eyes.fluent.CheckSettings;
import com.applitools.eyes.serializers.BySerializer;
import com.applitools.eyes.serializers.WebElementSerializer;
import com.applitools.eyes.visualgrid.model.NMGOptions;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import javax.annotation.Nonnull;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class AppiumCheckSettings extends CheckSettings {

    @JsonSerialize(using = BySerializer.class)
    private By targetSelector;
    @JsonSerialize(using = WebElementSerializer.class)
    private WebElement targetElement;
    @JsonSerialize(using = BySerializer.class)
    private By cutElementSelector;
    private ElementType cutElementType;
    private Boolean statusBarExists;
    private String scrollRootElementId;
    @JsonSerialize(using = BySerializer.class)
    private By scrollRootElementSelector;
    @JsonSerialize(using = WebElementSerializer.class)
    private WebElement scrollRootElement;
    private Boolean captureStatusBar;
    private String pageId;
    private Boolean isDefaultWebview;
    private String webview;
    private List<NMGOptions> nmgOptions = new ArrayList<>();

    protected AppiumCheckSettings() {
        super();
    }

    protected AppiumCheckSettings(Region region) {
        super(region);
    }

    protected AppiumCheckSettings(By selector) {
        this.targetSelector = selector;
    }

    protected AppiumCheckSettings(WebElement webElement) {
        this.targetElement = webElement;
    }

    protected AppiumCheckSettings(boolean isWebView) {
        this.isDefaultWebview = isWebView;
    }

    protected AppiumCheckSettings(String webview) {
        this.webview = webview;
        this.isDefaultWebview = false;
    }

    @Override
    public AppiumCheckSettings clone() {
        AppiumCheckSettings clone = new AppiumCheckSettings();
        super.populateClone(clone);
        clone.targetSelector = this.targetSelector;
        clone.targetElement = this.targetElement;
        clone.cutElementSelector = this.cutElementSelector;
        clone.cutElementType = this.cutElementType;
        clone.scrollRootElementId = this.scrollRootElementId;
        clone.scrollRootElementSelector = this.scrollRootElementSelector;
        clone.scrollRootElement = this.scrollRootElement;
        clone.captureStatusBar = this.captureStatusBar;
        clone.pageId = this.pageId;
        clone.isDefaultWebview = this.isDefaultWebview;
        clone.webview = this.webview;
        clone.nmgOptions = this.nmgOptions;
        return clone;
    }

    public AppiumCheckSettings layout(By regionSelector, By... regionSelectors) {
        AppiumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.layout_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }
    public AppiumCheckSettings layout(WebElement[] elements) {
        AppiumCheckSettings clone = this.clone();
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings layout(WebElement element, WebElement... elements) {
        AppiumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element));
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings ignore(By regionSelector, By... regionSelectors) {
        AppiumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.ignore_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

//    /**
//     * add one layout region with padding.
//     * @param element WebElement to match using the Layout method.
//     * @param padding Padding to add around the layout region.
//     * @return An updated clone of this settings object.
//     */
//    public AppiumCheckSettings layout(WebElement element, Padding padding) {
//        AppiumCheckSettings clone = this.clone();
//        clone.layout_(new SimpleRegionByElement(element, padding));
//        return clone;
//    }

    public AppiumCheckSettings ignore(WebElement element, WebElement... elements) {
        AppiumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element));
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings ignore(WebElement[] elements) {
        AppiumCheckSettings clone = this.clone();
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings strict(By regionSelector, By... regionSelectors) {
        AppiumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.strict_(new SimpleRegionBySelector(selector));
        }
        return clone;
    }

//    /**
//     * add one ignore region with padding
//     * @param element WebElement to ignore when validating the screenshot.
//     * @param padding Padding to add around the ignore region
//     * @return An updated clone of this settings object.
//     */
//    public AppiumCheckSettings ignore(WebElement element, Padding padding) {
//        AppiumCheckSettings clone = this.clone();
//        clone.ignore_(new SimpleRegionByElement(element, padding));
//        return clone;
//    }

    public AppiumCheckSettings strict(WebElement element, WebElement... elements) {
        AppiumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element));
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings strict(WebElement[] elements) {
        AppiumCheckSettings clone = this.clone();
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings content(By regionSelector, By... regionSelectors) {
        AppiumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.content_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

//    /**
//     * add one strict region with padding.
//     * @param element WebElement to match using the Strict method.
//     * @param padding Padding to add around the strict region.
//     * @return An updated clone of this settings object.
//     */
//    public AppiumCheckSettings strict(WebElement element, Padding padding) {
//        AppiumCheckSettings clone = this.clone();
//        clone.strict_(new SimpleRegionByElement(element, padding));
//        return clone;
//    }

    public AppiumCheckSettings content(WebElement element, WebElement... elements) {
        AppiumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element));
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings content(WebElement[] elements) {
        AppiumCheckSettings clone = this.clone();
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e));
        }
        return clone;
    }

    public AppiumCheckSettings floating(By regionSelector, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        AppiumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionBySelector(regionSelector, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
        return clone;
    }

//    /**
//     * add one content region with padding.
//     * @param element WebElement to match using the Content method.
//     * @param padding Padding to add around the content region.
//     * @return An updated clone of this settings object.
//     */
//    public AppiumCheckSettings content(WebElement element, Padding padding) {
//        AppiumCheckSettings clone = this.clone();
//        clone.content_(new SimpleRegionByElement(element, padding));
//        return clone;
//    }

    public AppiumCheckSettings floating(WebElement element, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        AppiumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionByElement(element, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
        return clone;
    }

    public AppiumCheckSettings accessibility(By regionSelector, AccessibilityRegionType regionType) {
        AppiumCheckSettings clone = clone();
        clone.accessibility_(new AccessibilityRegionBySelector(regionSelector, regionType));
        return clone;
    }

    public AppiumCheckSettings accessibility(WebElement element, AccessibilityRegionType regionType) {
        AppiumCheckSettings clone = clone();
        clone.accessibility(new AccessibilityRegionByElement(element, regionType));
        return clone;
    }

    public AppiumCheckSettings accessibility(AccessibilityRegionType regionType, WebElement[] elementsToIgnore) {
        AppiumCheckSettings clone = clone();
        for (WebElement element : elementsToIgnore) {
            clone.accessibility(new AccessibilityRegionByElement(element, regionType));
        }
        return clone;
    }

    public AppiumCheckSettings cut(@Nonnull ElementType type, @Nonnull By selector) {
        AppiumCheckSettings clone = this.clone();
        clone.cutElementSelector = selector;
        clone.cutElementType = type;
        return clone;
    }

    public ElementType getCutElementType() {
        return cutElementType;
    }

    public By getCutElementSelector() {
        return cutElementSelector;
    }

    public AppiumCheckSettings statusBarExists() {
        AppiumCheckSettings clone = this.clone();
        clone.statusBarExists = true;
        return clone;
    }

    public AppiumCheckSettings statusBarExists(boolean statusBarExists) {
        AppiumCheckSettings clone = this.clone();
        clone.statusBarExists = statusBarExists;
        return clone;
    }

    public Boolean getStatusBarExists() {
        return statusBarExists;
    }

    public By getTargetSelector() {
        return this.targetSelector;
    }

    public WebElement getTargetElement() {
        return this.targetElement;
    }

    @Override
    public AppiumCheckSettings fully() {
        return (AppiumCheckSettings) super.fully();
    }

    @Override
    public AppiumCheckSettings fully(Boolean fully) {
        return (AppiumCheckSettings) super.fully(fully);
    }

    public AppiumCheckSettings scrollRootElement(String elementId) {
        AppiumCheckSettings clone = this.clone();
        clone.scrollRootElementId = elementId;
        return clone;
    }

    public AppiumCheckSettings scrollRootElement(By selector) {
        AppiumCheckSettings clone = this.clone();
        clone.scrollRootElementSelector = selector;
        return clone;
    }

    public AppiumCheckSettings scrollRootElement(WebElement element) {
        AppiumCheckSettings clone = this.clone();
        clone.scrollRootElement = element;
        return clone;
    }

    public AppiumCheckSettings captureStatusBar() {
        AppiumCheckSettings clone = this.clone();
        clone.captureStatusBar = true;
        return clone;
    }

    public AppiumCheckSettings captureStatusBar(boolean captureStatusBar) {
        AppiumCheckSettings clone = this.clone();
        clone.captureStatusBar = captureStatusBar;
        return clone;
    }

    public String getScrollRootElementId() {
        return this.scrollRootElementId;
    }

    public By getScrollRootElementSelector() {
        return this.scrollRootElementSelector;
    }

    public WebElement getScrollRootElement() {
        return this.scrollRootElement;
    }

    public Boolean getCaptureStatusBar() {
        return this.captureStatusBar;
    }

    public boolean isNotRegion() {
        return getTargetRegion() == null && getTargetElement() == null && getTargetSelector()== null;
    }

    public AppiumCheckSettings pageId(String pageId) {
        AppiumCheckSettings clone = this.clone();
        clone.pageId = pageId;
        return clone;
    }

    public String getPageId() {
        return this.pageId;
    }

    @Override
    public AppiumCheckSettings lazyLoad() {
        return (AppiumCheckSettings) super.lazyLoad();
    }

    @Override
    public AppiumCheckSettings lazyLoad(LazyLoadOptions lazyLoadOptions) {
        return (AppiumCheckSettings) super.lazyLoad(lazyLoadOptions);
    }

    @Override
    public LazyLoadOptions getLazyLoadOptions() {
        return super.getLazyLoadOptions();
    }

    @Override
    public AppiumCheckSettings densityMetrics(int xDpi, int yDpi) {
        return (AppiumCheckSettings) super.densityMetrics(xDpi, yDpi);
    }

    @Override
    public AppiumCheckSettings densityMetrics(int xDpi, int yDpi, Double scaleRatio) {
        return (AppiumCheckSettings) super.densityMetrics(xDpi, yDpi, scaleRatio);
    }

    public AppiumCheckSettings webview() {
        AppiumCheckSettings clone = this.clone();
        clone.isDefaultWebview = true;
        return clone;
    }

    public AppiumCheckSettings webview(Boolean isWebView) {
        AppiumCheckSettings clone = this.clone();
        clone.isDefaultWebview = isWebView;
        return clone;
    }

    public AppiumCheckSettings webview(String webView) {
        AppiumCheckSettings clone = this.clone();
        clone.isDefaultWebview = false;
        clone.webview = webView;
        return clone;
    }

    public Boolean getIsDefaultWebview() {
        return this.isDefaultWebview;
    }

    public String getWebview() {
        return this.webview;
    }

    public List<NMGOptions> getNMGOptions() {
        return nmgOptions;
    }

    public AppiumCheckSettings NMGOptions(NMGOptions... options) {
        AppiumCheckSettings clone = this.clone();
        clone.nmgOptions.clear();
        if (options != null) {
            clone.nmgOptions.addAll(Arrays.asList(options));
            clone.nmgOptions.remove(null);
        }
        return clone;
    }
}
