package com.applitools.eyes.appium;

import com.applitools.eyes.fluent.FloatingRegionByRectangle;
import com.applitools.eyes.fluent.GetRegion;
import com.applitools.eyes.selenium.fluent.FloatingRegionByElement;
import com.applitools.eyes.selenium.fluent.FloatingRegionBySelector;
import com.applitools.eyes.selenium.universal.dto.ElementFloatingRegionDto;
import com.applitools.eyes.selenium.universal.dto.ElementRegionDto;
import com.applitools.eyes.universal.dto.*;
import com.applitools.eyes.selenium.universal.mapper.ElementRegionMapper;
import com.applitools.eyes.universal.mapper.RectangleRegionMapper;
import java.util.List;
import java.util.stream.Collectors;

public class AppiumTFloatingRegionMapper {

    public static TFloatingRegion toTFloatingRegionDto(GetRegion getFloatingRegion) {
        if (getFloatingRegion == null) {
            return null;
        }

        if (getFloatingRegion instanceof FloatingRegionByRectangle) {
            FloatingRegionByRectangle floatingRegionByRectangle = (FloatingRegionByRectangle) getFloatingRegion;

            RectangleRegionDto rectangleRegionDto = RectangleRegionMapper
                    .toRectangleRegionDto(((FloatingRegionByRectangle) getFloatingRegion).getRegion());

            RectangleFloatingRegionDto response = new RectangleFloatingRegionDto();
            response.setRegion(rectangleRegionDto);
            response.setMaxUpOffset(floatingRegionByRectangle.getMaxUpOffset());
            response.setMaxDownOffset(floatingRegionByRectangle.getMaxDownOffset());
            response.setMaxLeftOffset(floatingRegionByRectangle.getMaxLeftOffset());
            response.setMaxRightOffset(floatingRegionByRectangle.getMaxRightOffset());
            response.setRegionId(floatingRegionByRectangle.getRegion().getRegionId());

            return response;
        } else if (getFloatingRegion instanceof FloatingRegionByElement) {
            FloatingRegionByElement floatingRegionByElement = (FloatingRegionByElement) getFloatingRegion;

            ElementRegionDto elementRegionDto = ElementRegionMapper.toElementRegionDto(floatingRegionByElement.getElement());

            ElementFloatingRegionDto elementFloatingRegionDto = new ElementFloatingRegionDto();
            elementFloatingRegionDto.setRegion(elementRegionDto);
            elementFloatingRegionDto.setMaxUpOffset(floatingRegionByElement.getMaxUpOffset());
            elementFloatingRegionDto.setMaxDownOffset(floatingRegionByElement.getMaxDownOffset());
            elementFloatingRegionDto.setMaxLeftOffset(floatingRegionByElement.getMaxLeftOffset());
            elementFloatingRegionDto.setMaxRightOffset(floatingRegionByElement.getMaxRightOffset());
            elementFloatingRegionDto.setRegionId(floatingRegionByElement.getRegionId());

            return elementFloatingRegionDto;
        } else if (getFloatingRegion instanceof FloatingRegionBySelector) {
            FloatingRegionBySelector floatingRegionBySelector = (FloatingRegionBySelector) getFloatingRegion;

            SelectorRegionDto selectorRegionDto = AppiumSelectorRegionMapper
                    .toAppiumSelectorRegionDto(floatingRegionBySelector.getSelector());

            SelectorFloatingRegionDto selectorFloatingRegionDto = new SelectorFloatingRegionDto();
            selectorFloatingRegionDto.setRegion(selectorRegionDto);
            selectorFloatingRegionDto.setMaxUpOffset(floatingRegionBySelector.getMaxUpOffset());
            selectorFloatingRegionDto.setMaxDownOffset(floatingRegionBySelector.getMaxDownOffset());
            selectorFloatingRegionDto.setMaxLeftOffset(floatingRegionBySelector.getMaxLeftOffset());
            selectorFloatingRegionDto.setMaxRightOffset(floatingRegionBySelector.getMaxRightOffset());
            selectorFloatingRegionDto.setRegionId(floatingRegionBySelector.getRegionId());

            return selectorFloatingRegionDto;
        }

        return null;

    }

    public static List<TFloatingRegion> toTFloatingRegionDtoList(List<GetRegion> getFloatingRegionList) {
        if (getFloatingRegionList == null || getFloatingRegionList.isEmpty()) {
            return null;
        }

        return getFloatingRegionList.stream().map(AppiumTFloatingRegionMapper::toTFloatingRegionDto).collect(Collectors.toList());
    }
}
