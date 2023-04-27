package com.applitools.eyes.appium.unit;

import com.applitools.eyes.DensityMetrics;
import com.applitools.eyes.appium.AppiumCheckSettings;
import com.applitools.eyes.appium.AppiumCheckSettingsMapper;
import com.applitools.eyes.appium.Target;
import com.applitools.eyes.config.Configuration;
import com.applitools.eyes.universal.ManagerType;
import com.applitools.eyes.universal.dto.CheckSettingsDto;
import com.applitools.eyes.universal.dto.SelectorRegionDto;
import com.applitools.eyes.utils.ReportingTestSuite;
import com.applitools.eyes.visualgrid.model.NMGOptions;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.pagefactory.bys.builder.ByAll;
import io.appium.java_client.pagefactory.bys.builder.ByChained;
import org.openqa.selenium.By;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class TestAppiumCheckSettingsMapper extends ReportingTestSuite {

    @BeforeClass
    public void setup() {
        super.setGroupName("appium");
    }

    @Test
    public void testAppiumByAllWithSeleniumByMapping() {
        AppiumCheckSettings checkSettings = Target.region(new ByAll(
                new By[]{
                        AppiumBy.id("appiumById"),
                        By.id("seleniumById"),
                        AppiumBy.accessibilityId("appiumByAccessibilityId")
                }
        ));

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        SelectorRegionDto fallback_fallback = new SelectorRegionDto();
        fallback_fallback.setSelector("appiumByAccessibilityId");
        fallback_fallback.setType("accessibility id");

        SelectorRegionDto fallback = new SelectorRegionDto();
        fallback.setSelector("seleniumById");
        fallback.setType("id");
        fallback.setFallback(fallback_fallback);

        SelectorRegionDto region = new SelectorRegionDto();
        region.setSelector("appiumById");
        region.setType("id");
        region.setFallback(fallback);

        SelectorRegionDto actual = (SelectorRegionDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getFallback().getSelector(), fallback.getSelector());
        Assert.assertEquals(actual.getFallback().getType(), fallback.getType());
        Assert.assertEquals(actual.getFallback().getFallback().getSelector(), fallback_fallback.getSelector());
        Assert.assertEquals(actual.getFallback().getFallback().getType(), fallback_fallback.getType());
        Assert.assertNull(actual.getFallback().getFallback().getFallback());
    }

    @Test
    public void testAppiumByAllMapping() {
        AppiumCheckSettings checkSettings = Target.region(new ByAll(
                new By[]{
                        AppiumBy.id("appiumById"),
                        AppiumBy.xpath("appiumByXpath")
                }
        ));

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        SelectorRegionDto fallback = new SelectorRegionDto();
        fallback.setSelector("appiumByXpath");
        fallback.setType("xpath");
        fallback.setFallback(null);

        SelectorRegionDto region = new SelectorRegionDto();
        region.setSelector("appiumById");
        region.setType("id");
        region.setFallback(fallback);

        SelectorRegionDto actual = (SelectorRegionDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getFallback().getSelector(), fallback.getSelector());
        Assert.assertEquals(actual.getFallback().getType(), fallback.getType());
        Assert.assertNull(actual.getFallback().getFallback());
    }

    @Test
    public void testAppiumByChainedMapping() {
        AppiumCheckSettings checkSettings = Target.region(new ByChained(
                new By[]{
                        AppiumBy.id("appiumById"),
                        AppiumBy.xpath("appiumByXpath")
                }
        ));

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        SelectorRegionDto child = new SelectorRegionDto();
        child.setSelector("appiumByXpath");
        child.setType("xpath");
        child.setChild(null);

        SelectorRegionDto region = new SelectorRegionDto();
        region.setSelector("appiumById");
        region.setType("id");
        region.setChild(child);

        SelectorRegionDto actual = (SelectorRegionDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getChild().getSelector(), child.getSelector());
        Assert.assertEquals(actual.getChild().getType(), child.getType());
        Assert.assertNull(actual.getChild().getFallback());
    }

    @Test
    public void testAppiumByChainedWithSeleniumByMapping() {
        AppiumCheckSettings checkSettings = Target.region(new ByChained(
                new By[]{
                        AppiumBy.id("appiumById"),
                        By.partialLinkText("seleniumPartialLinkText"),
                        AppiumBy.xpath("appiumByXpath")
                }
        ));

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        SelectorRegionDto child_child = new SelectorRegionDto();
        child_child.setSelector("appiumByXpath");
        child_child.setType("xpath");
        child_child.setChild(null);

        SelectorRegionDto child = new SelectorRegionDto();
        child.setSelector("seleniumPartialLinkText");
        child.setType("partial link text");
        child.setChild(child_child);

        SelectorRegionDto region = new SelectorRegionDto();
        region.setSelector("appiumById");
        region.setType("id");
        region.setChild(child);

        SelectorRegionDto actual = (SelectorRegionDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getChild().getSelector(), child.getSelector());
        Assert.assertEquals(actual.getChild().getType(), child.getType());
        Assert.assertEquals(actual.getChild().getChild().getSelector(), child_child.getSelector());
        Assert.assertEquals(actual.getChild().getChild().getType(), child_child.getType());
        Assert.assertNull(actual.getChild().getChild().getChild());
    }

    @Test
    public void shouldMapNMGOptions() {
        AppiumCheckSettings checkSettings = Target.window().fully()
                .NMGOptions(
                        new NMGOptions("a1", "b1"),
                        new NMGOptions("a2", "b2"),
                        new NMGOptions("nonNMGCheck", "addToAllDevices"),
                        new NMGOptions("a3", null)
                );

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());
        Assert.assertEquals(dto.getType(), ManagerType.CLASSIC.value);
    }

    @Test
    public void shouldNotMapNMGOptionsWhenDidNotSpecify_nonNMGCheck_addToAllDevices() {
        AppiumCheckSettings checkSettings = Target.window().fully()
                .NMGOptions(
                        new NMGOptions("a1", "b1"),
                        new NMGOptions("a2", "b2"),
                        new NMGOptions("a3", "b3"),
                        new NMGOptions("a3", null)
                        );

        CheckSettingsDto dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());
        Assert.assertNull(dto.getType());

        checkSettings = Target.window();
        dto = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());
        Assert.assertNull(dto.getType());
    }

    @Test
    public void testAppiumDensityMetrics() {
        AppiumCheckSettings checkSettings1 = Target.window().densityMetrics(10, 20);
        AppiumCheckSettings checkSettings2 = Target.window().densityMetrics(10, 20, 2.0);

        CheckSettingsDto dto1 = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings1, new Configuration());
        CheckSettingsDto dto2 = AppiumCheckSettingsMapper.toCheckSettingsDtoV3(checkSettings2, new Configuration());

        DensityMetrics densityMetrics1 = dto1.getDensityMetrics();
        DensityMetrics densityMetrics2 = dto2.getDensityMetrics();

        Assert.assertEquals((int) densityMetrics1.getXdpi(), 10);
        Assert.assertEquals((int) densityMetrics1.getYdpi(), 20);
        Assert.assertNull(densityMetrics1.getScaleRatio());

        Assert.assertEquals((int) densityMetrics2.getXdpi(), 10);
        Assert.assertEquals((int) densityMetrics2.getYdpi(), 20);
        Assert.assertEquals(densityMetrics2.getScaleRatio(), 2.0);
    }
}