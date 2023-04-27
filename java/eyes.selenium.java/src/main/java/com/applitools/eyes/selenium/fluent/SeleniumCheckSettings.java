package com.applitools.eyes.selenium.fluent;

import com.applitools.eyes.*;
import com.applitools.eyes.fluent.CheckSettings;
import com.applitools.eyes.fluent.ICheckSettingsInternal;
import com.applitools.eyes.positioning.PositionProvider;
import com.applitools.eyes.selenium.TargetPathLocator;
import com.applitools.eyes.serializers.BySerializer;
import com.applitools.eyes.serializers.WebElementSerializer;
import com.applitools.utils.ArgumentGuard;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class SeleniumCheckSettings extends CheckSettings implements ISeleniumCheckTarget, Cloneable {
    public static final String FULL_PAGE = "full-page";
    public static final String VIEWPORT = "viewport";
    public static final String REGION = "region";
    public static final String SELECTOR = "selector";
    public static final String FULL_SELECTOR = "full-selector";

    // We'll use TargetPathLocator instead of Selector / WebElement.
    private TargetPathLocator targetLocator;
    private final List<FrameLocator> frameChain = new ArrayList<>();
    // FIXME - remove scrollRootElement/Selector
    @JsonSerialize(using = WebElementSerializer.class)
    private WebElement scrollRootElement;
    @JsonSerialize(using = BySerializer.class)
    private By scrollRootSelector;
    private Boolean isDefaultLayoutBreakpointsSet;
    private final List<Integer> layoutBreakpoints = new ArrayList<>();

    public SeleniumCheckSettings() {
    }

    public SeleniumCheckSettings(Region region) {
        super(region);
    }

    public SeleniumCheckSettings(String tag) {
        this.name = tag;
    }

    public SeleniumCheckSettings(TargetPathLocator targetLocator) {
        this.targetLocator = targetLocator;
    }

    @Override
    public List<FrameLocator> getFrameChain() {
        return this.frameChain;
    }

    @SuppressWarnings("MethodDoesntCallSuperMethod")
    @Override
    public SeleniumCheckSettings clone() {
        SeleniumCheckSettings clone = new SeleniumCheckSettings();
        super.populateClone(clone);
        clone.targetLocator = this.targetLocator;
        clone.frameChain.addAll(this.frameChain);
        clone.scrollRootElement = this.scrollRootElement;
        clone.scrollRootSelector = this.scrollRootSelector;
        clone.sendDom = this.sendDom;
        clone.isDefaultLayoutBreakpointsSet = this.isDefaultLayoutBreakpointsSet;
        clone.layoutBreakpoints.addAll(this.layoutBreakpoints);
//        clone.pageId = this.pageId;
        return clone;
    }

    public SeleniumCheckSettings frame(By by) {
        SeleniumCheckSettings clone = this.clone();
        FrameLocator fl = new FrameLocator();
        fl.setFrameSelector(by);
        clone.frameChain.add(fl);
        return clone;
    }

    public SeleniumCheckSettings frame(String frameNameOrId) {
        SeleniumCheckSettings clone = this.clone();
        FrameLocator fl = new FrameLocator();
        fl.setFrameNameOrId(frameNameOrId);
        clone.frameChain.add(fl);
        return clone;
    }

    public SeleniumCheckSettings frame(int index) {
        SeleniumCheckSettings clone = this.clone();
        FrameLocator fl = new FrameLocator();
        fl.setFrameIndex(index);
        clone.frameChain.add(fl);
        return clone;
    }

    public SeleniumCheckSettings frame(WebElement frameReference) {
        SeleniumCheckSettings clone = this.clone();
        FrameLocator fl = new FrameLocator();
        fl.setFrameReference(frameReference);
        clone.frameChain.add(fl);
        return clone;
    }

    public SeleniumCheckSettings region(Region region) {
        SeleniumCheckSettings clone = this.clone();
        clone.updateTargetRegion(region);
        return clone;
    }

    public SeleniumCheckSettings region(WebElement element) {
        SeleniumCheckSettings clone = this.clone();
        clone.targetLocator = TargetPath.region(element);
        return clone;
    }

    public SeleniumCheckSettings region(By by) {
        return region(TargetPath.region(by));
    }

    public SeleniumCheckSettings region(TargetPathLocator targetPathLocator) {
        SeleniumCheckSettings clone = this.clone();
        clone.targetLocator = targetPathLocator;
        return clone;
    }

    public SeleniumCheckSettings ignore(By regionSelector, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.ignore_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(By regionSelector, String regionId, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(regionSelector).regionId(regionId));
        for (By selector : regionSelectors) {
            clone.ignore_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement element, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement element, String regionId, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element).regionId(regionId));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(By[] regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.ignore_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(By[] regionSelectors, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.ignore_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement[] elements) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement[] elements, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.ignore_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    /**
     * add one ignore region with padding
     * @param selector By selector to ignore when validating the screenshot.
     * @param padding Padding to add around the ignore region
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings ignore(By selector, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(selector, padding));
        return clone;
    }

    /**
     * add one ignore region with padding and a region ID
     * @param selector By selector to ignore when validating the screenshot.
     * @param padding Padding to add around the ignore region.
     * @param regionId The region ID
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings ignore(By selector, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(selector, padding).regionId(regionId));
        return clone;
    }

    /**
     * add one ignore region with padding
     * @param element WebElement to ignore when validating the screenshot.
     * @param padding Padding to add around the ignore region
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings ignore(WebElement element, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element, padding));
        return clone;
    }

    /**
     * add one ignore region with padding and a region ID
     * @param element WebElement to ignore when validating the screenshot.
     * @param padding Padding to add around the ignore region.
     * @param regionId The region ID
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings ignore(WebElement element, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element, padding).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings ignore(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings ignore(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings ignore(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings layout(By regionSelector, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.layout_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(By regionSelector, String regionId, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(regionSelector).regionId(regionId));
        for (By selector : regionSelectors) {
            clone.layout_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(WebElement element, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(WebElement element, String regionId, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element).regionId(regionId));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(By[] regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.layout_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(By[] regionSelectors, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.layout_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(WebElement[] elements) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings layout(WebElement[] elements, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.layout_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    /**
     * add one layout region with padding.
     * @param selector By selector to match using the Layout method.
     * @param padding Padding to add around the layout region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings layout(By selector, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(selector, padding));
        return clone;
    }

    /**
     * add one layout region with padding and a region ID.
     * @param selector By selector to match using the Layout method.
     * @param padding Padding to add around the layout region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings layout(By selector, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(selector, padding).regionId(regionId));
        return clone;
    }

    /**
     * add one layout region with padding.
     * @param element WebElement to match using the Layout method.
     * @param padding Padding to add around the layout region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings layout(WebElement element, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element, padding));
        return clone;
    }

    /**
     * add one layout region with padding and a region ID
     * @param element WebElement to match using the Layout method.
     * @param padding Padding to add around the layout region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings layout(WebElement element, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignore_(new SimpleRegionByElement(element, padding).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings layout(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings layout(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings layout(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings layout(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.layout_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings strict(By regionSelector, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.strict_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(By regionSelector, String regionId, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(regionSelector).regionId(regionId));
        for (By selector : regionSelectors) {
            clone.strict_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(WebElement element, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(WebElement element, String regionId, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element).regionId(regionId));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(By[] regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.strict_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(By[] regionSelectors, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.strict_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(WebElement[] elements) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings strict(WebElement[] elements, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.strict_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    /**
     * add one strict region with padding.
     * @param selector By selector to match using the Strict method.
     * @param padding Padding to add around the strict region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings strict(By selector, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(selector, padding));
        return clone;
    }

    /**
     * add one strict region with padding and a region ID.
     * @param selector By selector to match using the Strict method.
     * @param padding Padding to add around the strict region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings strict(By selector, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(selector, padding).regionId(regionId));
        return clone;
    }

    /**
     * add one strict region with padding.
     * @param element WebElement to match using the Strict method.
     * @param padding Padding to add around the strict region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings strict(WebElement element, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element, padding));
        return clone;
    }

    /**
     * add one strict region with padding and a region ID
     * @param element WebElement to match using the Strict method.
     * @param padding Padding to add around the strict region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings strict(WebElement element, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element, padding).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings strict(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings strict(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings strict(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings strict(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.strict_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings content(By regionSelector, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(regionSelector));
        for (By selector : regionSelectors) {
            clone.content_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings content(By regionSelector, String regionId, By... regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(regionSelector).regionId(regionId));
        for (By selector : regionSelectors) {
            clone.content_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings content(WebElement element, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings content(WebElement element, String regionId, WebElement... elements) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element).regionId(regionId));
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings content(By[] regionSelectors) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.content_(new SimpleRegionBySelector(selector));
        }

        return clone;
    }

    public SeleniumCheckSettings content(By[] regionSelectors, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        for (By selector : regionSelectors) {
            clone.content_(new SimpleRegionBySelector(selector).regionId(regionId));
        }

        return clone;
    }

    public SeleniumCheckSettings content(WebElement[] elements) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e));
        }

        return clone;
    }

    public SeleniumCheckSettings content(WebElement[] elements, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        //TODO - FIXME - BUG - this is wrong in case of a cropped image!
        for (WebElement e : elements) {
            clone.content_(new SimpleRegionByElement(e).regionId(regionId));
        }

        return clone;
    }

    /**
     * add one content region with padding.
     * @param selector By selector to match using the Content method.
     * @param padding Padding to add around the content region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings content(By selector, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(selector, padding));
        return clone;
    }

    /**
     * add one content region with padding and a region ID.
     * @param selector By selector to match using the Content method.
     * @param padding Padding to add around the content region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings content(By selector, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(selector, padding).regionId(regionId));
        return clone;
    }

    /**
     * add one content region with padding.
     * @param element WebElement to match using the Content method.
     * @param padding Padding to add around the content region.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings content(WebElement element, Padding padding) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element, padding));
        return clone;
    }

    /**
     * add one content region with padding and a region ID
     * @param element WebElement to match using the Content method.
     * @param padding Padding to add around the content region.
     * @param regionId The region ID.
     * @return An updated clone of this settings object.
     */
    public SeleniumCheckSettings content(WebElement element, Padding padding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element, padding).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings content(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings content(By selector, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionBySelector(selector, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings content(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)));
        return clone;
    }

    public SeleniumCheckSettings content(WebElement element, int leftPadding, int topPadding, int rightPadding, int bottomPadding, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.content_(new SimpleRegionByElement(element, new Padding(topPadding, rightPadding, bottomPadding, leftPadding)).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings floating(By regionSelector, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        SeleniumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionBySelector(regionSelector, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
        return clone;
    }

    public SeleniumCheckSettings floating(By regionSelector, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionBySelector(regionSelector, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings floating(WebElement element, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        SeleniumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionByElement(element, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset));
        return clone;
    }

    public SeleniumCheckSettings floating(WebElement element, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset, String regionId) {
        SeleniumCheckSettings clone = this.clone();
        clone.floating(new FloatingRegionByElement(element, maxUpOffset, maxDownOffset, maxLeftOffset, maxRightOffset).regionId(regionId));
        return clone;
    }

    public SeleniumCheckSettings scrollRootElement(By selector) {
        SeleniumCheckSettings clone = this.clone();
        if (frameChain.size() == 0) {
           clone.scrollRootSelector = selector;
        } else {
            frameChain.get(frameChain.size() - 1).setScrollRootSelector(selector);
        }
        return clone;
    }

    public SeleniumCheckSettings scrollRootElement(WebElement element) {
        SeleniumCheckSettings clone = this.clone();
        if (frameChain.size() == 0) {
            clone.scrollRootElement = element;
        } else {
            frameChain.get(frameChain.size() - 1).setScrollRootElement(element);
        }
        return clone;
    }

    @Override
    public SeleniumCheckSettings fully() {
        return (SeleniumCheckSettings) super.fully();
    }

    @Override
    public SeleniumCheckSettings fully(Boolean fully) {
        return (SeleniumCheckSettings) super.fully(fully);
    }

    @Override
    public SeleniumCheckSettings withName(String name) {
        return (SeleniumCheckSettings) super.withName(name);
    }

    @Override
    public SeleniumCheckSettings ignoreCaret(Boolean ignoreCaret) {
        return (SeleniumCheckSettings) super.ignoreCaret(ignoreCaret);
    }

    @Override
    public SeleniumCheckSettings ignoreCaret() {
        return (SeleniumCheckSettings) super.ignoreCaret();
    }

    @Override
    public SeleniumCheckSettings matchLevel(MatchLevel matchLevel) {
        return (SeleniumCheckSettings) super.matchLevel(matchLevel);
    }

    @Override
    public SeleniumCheckSettings content() {
        return (SeleniumCheckSettings) super.content();
    }

    @Override
    public SeleniumCheckSettings strict() {
        return (SeleniumCheckSettings) super.strict();
    }

    @Override
    public SeleniumCheckSettings layout() {
        return (SeleniumCheckSettings) super.layout();
    }

    @Override
    public SeleniumCheckSettings exact() {
        return (SeleniumCheckSettings) super.exact();
    }

    @Override
    public SeleniumCheckSettings timeout(Integer timeoutMilliseconds) {
        return (SeleniumCheckSettings) super.timeout(timeoutMilliseconds);
    }

    @Override
    public SeleniumCheckSettings ignore(Region region, Region... regions) {
        return (SeleniumCheckSettings) super.ignore(region, regions);
    }

    @Override
    public SeleniumCheckSettings ignore(Region[] regions) {
        return (SeleniumCheckSettings) super.ignore(regions);
    }

    @Override
    public SeleniumCheckSettings layout(Region region, Region... regions) {
        return (SeleniumCheckSettings) super.layout(region, regions);
    }

    @Override
    public SeleniumCheckSettings layout(Region[] regions) {
        return (SeleniumCheckSettings) super.layout(regions);
    }

    @Override
    public SeleniumCheckSettings strict(Region region, Region... regions) {
        return (SeleniumCheckSettings) super.strict(region, regions);
    }

    @Override
    public SeleniumCheckSettings strict(Region[] regions) {
        return (SeleniumCheckSettings) super.strict(regions);
    }

    @Override
    public SeleniumCheckSettings content(Region region, Region... regions) {
        return (SeleniumCheckSettings) super.content(region, regions);
    }

    @Override
    public SeleniumCheckSettings content(Region[] regions) {
        return (SeleniumCheckSettings) super.content(regions);
    }

    @Override
    public WebElement getScrollRootElement() {
        return scrollRootElement;
    }

    @Override
    public By getScrollRootSelector() {
        return scrollRootSelector;
    }

    public SeleniumCheckSettings(Region region, boolean isSendDom) {
        super(region);
        this.sendDom = isSendDom;
    }

    @JsonProperty("sizeMode")
    public String getSizeMode() {
        ICheckSettingsInternal checkSettingsInternal = this;
        Boolean stitchContent = checkSettingsInternal.getStitchContent();
        if (stitchContent == null) {
            stitchContent = false;
        }
        Region region = checkSettingsInternal.getTargetRegion();

        if (region == null) {
            return stitchContent ? FULL_PAGE : VIEWPORT;
        } else if (region != null) {
            return REGION;
        } else if (stitchContent) {
            return FULL_SELECTOR;
        } else {
            return SELECTOR;
        }
    }

    @Override
    public Map<String, String> getScriptHooks() {
        return scriptHooks;
    }

    @Deprecated
    @Override
    public SeleniumCheckSettings scriptHook(String hook) {
        return beforeRenderScreenshotHook(hook);
    }

    @Override
    public SeleniumCheckSettings beforeRenderScreenshotHook(String hook) {
        SeleniumCheckSettings clone = this.clone();
        clone.scriptHooks.put(BEFORE_CAPTURE_SCREENSHOT, hook);
        return clone;
    }

    public SeleniumCheckSettings ignoreDisplacements(boolean ignoreDisplacements) {
        SeleniumCheckSettings clone = this.clone();
        clone.ignoreDisplacements = ignoreDisplacements;
        return clone;
    }

    public SeleniumCheckSettings ignoreDisplacements() {
        return this.ignoreDisplacements(true);
    }

    public SeleniumCheckSettings accessibility(By regionSelector, AccessibilityRegionType regionType) {
        SeleniumCheckSettings clone = clone();
        clone.accessibility_(new AccessibilityRegionBySelector(regionSelector, regionType));
        return clone;
    }

    public SeleniumCheckSettings accessibility(WebElement element, AccessibilityRegionType regionType) {
        SeleniumCheckSettings clone = clone();
        clone.accessibility(new AccessibilityRegionByElement(element, regionType));
        return clone;
    }

    public SeleniumCheckSettings accessibility(AccessibilityRegionType regionType, WebElement[] elementsToIgnore) {
        SeleniumCheckSettings clone = clone();
        for (WebElement element : elementsToIgnore) {
            clone.accessibility(new AccessibilityRegionByElement(element, regionType));
        }
        return clone;
    }

    public SeleniumCheckSettings layoutBreakpoints(Boolean shouldSet) {
        this.isDefaultLayoutBreakpointsSet = shouldSet;
        layoutBreakpoints.clear();
        return this;
    }

    public Boolean isDefaultLayoutBreakpointsSet() {
        return isDefaultLayoutBreakpointsSet;
    }

    public SeleniumCheckSettings layoutBreakpoints(Integer... breakpoints) {
        isDefaultLayoutBreakpointsSet = false;
        layoutBreakpoints.clear();
        if (breakpoints == null || breakpoints.length == 0) {
            return this;
        }

        for (int breakpoint : breakpoints) {
            ArgumentGuard.greaterThanZero(breakpoint, "breakpoint");
            layoutBreakpoints.add(breakpoint);
        }

        Collections.sort(layoutBreakpoints);
        return this;
    }

    public List<Integer> getLayoutBreakpoints() {
        return layoutBreakpoints;
    }


    @Override
    @Deprecated
    public PositionProvider getStepPositionProvider() {
        return null;
    }

    @Override
    public SeleniumCheckSettings lazyLoad() {
        return (SeleniumCheckSettings) super.lazyLoad();
    }

    @Override
    public SeleniumCheckSettings lazyLoad(LazyLoadOptions lazyLoadOptions) {
        return (SeleniumCheckSettings) super.lazyLoad(lazyLoadOptions);
    }

    @Override
    public LazyLoadOptions getLazyLoadOptions() {
        return super.getLazyLoadOptions();
    }

    @Override
    public SeleniumCheckSettings densityMetrics(int xDpi, int yDpi) {
        return (SeleniumCheckSettings) super.densityMetrics(xDpi, yDpi);
    }

    @Override
    public SeleniumCheckSettings densityMetrics(int xDpi, int yDpi, Double scaleRatio) {
        return (SeleniumCheckSettings) super.densityMetrics(xDpi, yDpi, scaleRatio);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public SeleniumCheckSettings stitchOverlap(Integer overlap) {
        return (SeleniumCheckSettings) super.stitchOverlap(overlap);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public SeleniumCheckSettings stitchOverlap(StitchOverlap stitchOverlap) {
        return (SeleniumCheckSettings) super.stitchOverlap(stitchOverlap);
    }

    public TargetPathLocator getTargetPathLocator() {
        return this.targetLocator;
    }


}

