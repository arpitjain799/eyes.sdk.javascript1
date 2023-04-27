package com.applitools.eyes.universal.dto;

/**
 * Browser info dto
 */
public class BrowserInfoDto {
  private ChromeEmulationInfoDto chromeEmulationInfo;
  private IosDeviceInfoDto iosDeviceInfo;
  private AndroidDeviceInfoDto androidDeviceInfo;
  private String name;
  private Integer width;
  private Integer height;

  public BrowserInfoDto() {
  }

  public BrowserInfoDto(ChromeEmulationInfoDto chromeEmulationInfo, IosDeviceInfoDto iosDeviceInfo, String name, Integer width,
      Integer height) {
    this.chromeEmulationInfo = chromeEmulationInfo;
    this.iosDeviceInfo = iosDeviceInfo;
    this.name = name;
    this.width = width;
    this.height = height;
  }

  public ChromeEmulationInfoDto getChromeEmulationInfo() {
    return chromeEmulationInfo;
  }

  public void setChromeEmulationInfo(ChromeEmulationInfoDto chromeEmulationInfo) {
    this.chromeEmulationInfo = chromeEmulationInfo;
  }

  public IosDeviceInfoDto getIosDeviceInfo() {
    return iosDeviceInfo;
  }

  public void setIosDeviceInfo(IosDeviceInfoDto iosDeviceInfo) {
    this.iosDeviceInfo = iosDeviceInfo;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Integer getWidth() {
    return width;
  }

  public void setWidth(Integer width) {
    this.width = width;
  }

  public Integer getHeight() {
    return height;
  }

  public void setHeight(Integer height) {
    this.height = height;
  }

  public AndroidDeviceInfoDto getAndroidDeviceInfo() {
    return androidDeviceInfo;
  }

  public void setAndroidDeviceInfo(AndroidDeviceInfoDto androidDeviceInfo) {
    this.androidDeviceInfo = androidDeviceInfo;
  }
}
