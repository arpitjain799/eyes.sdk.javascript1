package com.applitools.eyes.unit;
import com.applitools.eyes.DensityMetrics;
import com.applitools.eyes.config.Configuration;
import com.applitools.eyes.selenium.ElementSelector;
import com.applitools.eyes.selenium.fluent.SeleniumCheckSettings;
import com.applitools.eyes.selenium.fluent.Target;
import com.applitools.eyes.selenium.universal.dto.TargetPathLocatorDto;
import com.applitools.eyes.selenium.universal.mapper.CheckSettingsMapper;
import com.applitools.eyes.universal.dto.CheckSettingsDto;
import com.applitools.eyes.utils.ReportingTestSuite;
import org.openqa.selenium.By;
import org.openqa.selenium.support.pagefactory.ByAll;
import org.openqa.selenium.support.pagefactory.ByChained;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

public class TestSeleniumCheckSettingsMapper extends ReportingTestSuite {

    @BeforeClass
    public void setup() {
        super.setGroupName("selenium");
    }

    @Test
    public void testSeleniumByAllMapping() {
        ByAll byAll = new ByAll(
                By.id("byId"),
                By.xpath("byXpath")
        );

        SeleniumCheckSettings checkSettings = Target.region(byAll);

        CheckSettingsDto dto = CheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        ElementSelector fallback = new ElementSelector(By.xpath("byXpath"));

        ElementSelector region = new ElementSelector(By.id("byId"));
        region.setFallback(fallback);

        TargetPathLocatorDto actual = (TargetPathLocatorDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getFallback().getSelector(), fallback.getSelector());
        Assert.assertEquals(actual.getFallback().getType(), fallback.getType());
        Assert.assertNull(actual.getFallback().getFallback());
    }

    @Test
    public void testSeleniumByChainedMapping() {
        ByChained byChained = new ByChained(
                By.id("byId"),
                By.xpath("byXpath")
        );

        SeleniumCheckSettings checkSettings = Target.region(byChained);

        CheckSettingsDto dto = CheckSettingsMapper.toCheckSettingsDtoV3(checkSettings, new Configuration());

        ElementSelector child = new ElementSelector(By.xpath("byXpath"));

        ElementSelector region = new ElementSelector(By.id("byId"));
        region.setChild(child);

        TargetPathLocatorDto actual = (TargetPathLocatorDto) dto.getRegion();

        Assert.assertNotNull(dto.getRegion());
        Assert.assertEquals(actual.getSelector(), region.getSelector());
        Assert.assertEquals(actual.getType(), region.getType());
        Assert.assertEquals(actual.getChild().getSelector(), child.getSelector());
        Assert.assertEquals(actual.getChild().getType(), child.getType());
        Assert.assertNull(actual.getChild().getChild());
    }

    @Test
    public void testSeleniumDensityMetrics() {
        SeleniumCheckSettings checkSettings1 = Target.window().densityMetrics(10, 20);
        SeleniumCheckSettings checkSettings2 = Target.window().densityMetrics(10, 20, 2.0);

        CheckSettingsDto dto1 = CheckSettingsMapper.toCheckSettingsDtoV3(checkSettings1, new Configuration());
        CheckSettingsDto dto2 = CheckSettingsMapper.toCheckSettingsDtoV3(checkSettings2, new Configuration());

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