package com.applitools.eyes.playwright.fluent;

import com.applitools.eyes.playwright.universal.dto.Element;
import com.applitools.eyes.visualgrid.model.IGetFloatingRegionOffsets;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.microsoft.playwright.ElementHandle;


/**
 * Used internally to represent a ref of a floating region element
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FloatingRegionElement extends Element implements IGetFloatingRegionOffsets{
    
    private final int maxUpOffset;
    private final int maxDownOffset;
    private final int maxLeftOffset;
    private final int maxRightOffset;

    public FloatingRegionElement(ElementHandle element, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        super(element);
        this.maxUpOffset = maxUpOffset;
        this.maxDownOffset = maxDownOffset;
        this.maxLeftOffset = maxLeftOffset;
        this.maxRightOffset = maxRightOffset;
    }

    public FloatingRegionElement(ElementHandle element, int maxOffset) {
        super(element);
        this.maxUpOffset = maxOffset;
        this.maxDownOffset = maxOffset;
        this.maxLeftOffset = maxOffset;
        this.maxRightOffset = maxOffset;
    }

    @Override
    public int getMaxLeftOffset() {
        return maxLeftOffset;
    }

    @Override
    public int getMaxUpOffset() {
        return maxUpOffset;
    }

    @Override
    public int getMaxRightOffset() {
        return maxRightOffset;
    }

    @Override
    public int getMaxDownOffset() {
        return maxDownOffset;
    }
}
