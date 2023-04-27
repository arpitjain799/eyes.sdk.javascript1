package com.applitools.eyes.playwright.universal.dto;

import com.applitools.eyes.Padding;
import com.applitools.eyes.universal.Reference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.microsoft.playwright.Locator;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Selector extends Reference {

    @JsonProperty("type")
    private String type;
    @JsonIgnore
    private Locator locator;

    @JsonProperty("selector")
    private String selector;

    @JsonProperty("padding")
    private Padding padding;

    @JsonProperty("regionId")
    private String regionId;

    public Selector() {

    }

    public Selector(String selector) {
        this.selector = selector;
    }

    public Selector(Locator locator) {
        this.type = "selector";
        this.locator = locator;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Locator getLocator() {
        return locator;
    }

    public void setLocator(Locator locator) {
        this.locator = locator;
    }

    public String getSelector() {
        return selector;
    }

    public void setSelector(String selector) {
        this.selector = selector;
    }

    public void setPadding(Padding padding) {
        this.padding = padding;
    }

    public Padding getPadding() {
        return padding;
    }

    public String getRegionId() {
        return regionId;
    }

    public void setRegionId(String regionId) {
        this.regionId = regionId;
    }
}
