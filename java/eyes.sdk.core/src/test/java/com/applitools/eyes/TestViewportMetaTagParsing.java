package com.applitools.eyes;

import com.applitools.eyes.utils.ReportingTestSuite;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class TestViewportMetaTagParsing extends ReportingTestSuite {

    public TestViewportMetaTagParsing() {
        super.setGroupName("core");
    }

    @DataProvider(name = "dp")
    public static Object[][] dp() {
        return new Object[][]{
                {"width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1.0",true, 0f, 1.0f},
                {"initial-scale=1,width=device-width,      user-scalable=no", true, 0f, 1.0f},
                {"initial-scale=1.3,width=500,    user-scalable=yes", false, 500f, 1.3f},
                {"width=960px", false, 960, 0.0f},
                {"width=device-width", true, 0, 0.0f},
                {"", false, 0f, 0.0f}
        };
    }

    @Test(dataProvider = "dp")
    public void TestParseViewportMetaTag(String viewportMetaTag, boolean expectedFollowDeviceWidth, float expectedDeviceWidth, float expectedInitialScale) {
        super.addSuiteArg("viewportMetaTag", viewportMetaTag);
        super.addSuiteArg("expectedFollowDeviceWidth", expectedFollowDeviceWidth);
        super.addSuiteArg("expectedDeviceWidth", expectedDeviceWidth);
        super.addSuiteArg("expectedInitialScale", expectedInitialScale);
        ViewportMetaTag data = ViewportMetaTag.parseViewportMetaTag(viewportMetaTag);
        Assert.assertEquals( data.getFollowDeviceWidth(), expectedFollowDeviceWidth, "FollowDeviceWidth");
        Assert.assertEquals( data.getDeviceWidth(), expectedDeviceWidth, "DeviceWidth");
        Assert.assertEquals( data.getInitialScale(), expectedInitialScale, "InitialScale");
    }
}
