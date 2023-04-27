package com.applitools.eyes.selenium.universal.mapper;

import com.applitools.eyes.EyesException;
import com.applitools.eyes.universal.dto.SelectorRegionDto;
import com.applitools.utils.GeneralUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.support.pagefactory.ByAll;
import org.openqa.selenium.support.pagefactory.ByChained;

import java.lang.reflect.Field;

/**
 * selector region mapper
 */
public class SelectorRegionMapper {

  public static SelectorRegionDto toSelectorRegionDto(By by) {
    if (by == null) {
      return null;
    }

    if (by instanceof ByAll) {
      return toSelectorRegionDto((ByAll) by);
    } else if (by instanceof ByChained) {
      return toSelectorRegionDto((ByChained) by);
    }
    return toDto(by);
  }

  private static SelectorRegionDto toDto(By by) {
    SelectorRegionDto selectorRegionDto = new SelectorRegionDto();
    String selector = GeneralUtils.getLastWordOfStringWithRegex(by.toString(), ":");
    selectorRegionDto.setSelector(selector);

    if (by instanceof By.ById) {
      selectorRegionDto.setType("id");
    } else if (by instanceof By.ByXPath) {
      selectorRegionDto.setType("xpath");
    } else if (by instanceof By.ByLinkText) {
      selectorRegionDto.setType("link text");
    } else if (by instanceof By.ByPartialLinkText) {
      selectorRegionDto.setType("partial link text");
    } else if (by instanceof By.ByName) {
      selectorRegionDto.setType("name");
    } else if (by instanceof By.ByTagName) {
      selectorRegionDto.setType("tag name");
    } else if (by instanceof By.ByClassName) {
      selectorRegionDto.setType("class name");
    } else if (by instanceof By.ByCssSelector){
      selectorRegionDto.setType("css selector");
    }

    return selectorRegionDto;
  }

  public static SelectorRegionDto toSelectorRegionDto(ByAll byAll) {
    try {
      Field bys_ = byAll.getClass().getDeclaredField("bys");
      bys_.setAccessible(true);

      By[] bys = (By[]) bys_.get(byAll);

      SelectorRegionDto fallback = null;
      SelectorRegionDto region = null;
      for (int i = bys.length-1; i >= 0; i--) {
        region = toDto(bys[i]);
        region.setType(region.getType());
        region.setFallback(fallback);
        fallback = region;
      }

      return region;
    } catch (NoSuchFieldException | IllegalAccessException e) {
      System.out.println("Got a failure trying to find By[] using reflection! Error " + e.getMessage());
      throw new EyesException("Got a failure trying to find By[] using reflection! Error " + e.getMessage());
    }
  }

  public static SelectorRegionDto toSelectorRegionDto(ByChained byChained) {
    try {
      Field bys_ = byChained.getClass().getDeclaredField("bys");
      bys_.setAccessible(true);

      By[] bys = (By[]) bys_.get(byChained);

      SelectorRegionDto child = null;
      SelectorRegionDto region;
      for (int i = bys.length-1; i >= 0; i--) {
        region = toDto(bys[i]);
        region.setType(region.getType());
        region.setChild(child);
        child = region;
      }

      return child;
    } catch (NoSuchFieldException | IllegalAccessException e) {
      System.out.println("Got a failure trying to find By[] using reflection! Error " + e.getMessage());
      throw new EyesException("Got a failure trying to find By[] using reflection! Error " + e.getMessage());
    }
  }
}