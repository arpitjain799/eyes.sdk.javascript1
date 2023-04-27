package com.applitools.eyes.selenium.universal.mapper;

import com.applitools.eyes.fluent.GetRegion;
import com.applitools.eyes.fluent.SimpleRegionByRectangle;
import com.applitools.eyes.selenium.fluent.SimpleRegionByElement;
import com.applitools.eyes.selenium.fluent.SimpleRegionBySelector;
import com.applitools.eyes.universal.dto.CodedRegionReference;
import com.applitools.eyes.universal.dto.TRegion;
import com.applitools.eyes.universal.mapper.RectangleRegionMapper;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class CodedRegionReferenceMapper {

    public static CodedRegionReference toCodedRegionReference(GetRegion getSimpleRegion) {
        if (getSimpleRegion == null) {
            return null;
        }

        CodedRegionReference codedRegionReference = new CodedRegionReference();

        if (getSimpleRegion instanceof SimpleRegionByRectangle) {
            SimpleRegionByRectangle simpleRegionByRectangle = (SimpleRegionByRectangle) getSimpleRegion;
            TRegion region = RectangleRegionMapper.toRectangleRegionDto(simpleRegionByRectangle.getRegion());
            codedRegionReference.setRegion(region);
            codedRegionReference.setRegionId(simpleRegionByRectangle.getRegion().getRegionId());
            codedRegionReference.setPadding(simpleRegionByRectangle.getPadding());
        } else if (getSimpleRegion instanceof SimpleRegionByElement) {
            SimpleRegionByElement simpleRegionByElement = (SimpleRegionByElement) getSimpleRegion;
            TRegion region = ElementRegionMapper.toElementRegionDto(simpleRegionByElement.getElement());
            codedRegionReference.setRegion(region);
            codedRegionReference.setRegionId(simpleRegionByElement.getRegionId());
            codedRegionReference.setPadding(simpleRegionByElement.getPadding());
        } else if (getSimpleRegion instanceof SimpleRegionBySelector) {
            SimpleRegionBySelector simpleRegionBySelector = (SimpleRegionBySelector) getSimpleRegion;
            TRegion region = SelectorRegionMapper.toSelectorRegionDto(simpleRegionBySelector.getSelector());
            codedRegionReference.setRegion(region);
            codedRegionReference.setRegionId(simpleRegionBySelector.getRegionId());
            codedRegionReference.setPadding(simpleRegionBySelector.getPadding());
        }

        return codedRegionReference;
    }

    public static List<CodedRegionReference> toCodedRegionReferenceList(List<GetRegion> getSimpleRegionList) {
        if (getSimpleRegionList == null || getSimpleRegionList.isEmpty()) {
            return null;
        }

        return getSimpleRegionList
                .stream()
                .filter(Objects::nonNull)
                .map(CodedRegionReferenceMapper::toCodedRegionReference)
                .collect(Collectors.toList());
    }

}
