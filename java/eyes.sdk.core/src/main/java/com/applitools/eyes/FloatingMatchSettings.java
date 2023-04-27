package com.applitools.eyes;

public class FloatingMatchSettings {
    public int top;
    public int left;
    public int width;
    public int height;

    public int maxUpOffset;
    public int maxDownOffset;
    public int maxLeftOffset;
    public int maxRightOffset;

    // default ctor for deserialization.
    public FloatingMatchSettings() { }

    public FloatingMatchSettings(int left, int top, int width, int height, int maxUpOffset, int maxDownOffset, int maxLeftOffset, int maxRightOffset) {
        this.top = top;
        this.left = left;
        this.width = width;
        this.height = height;

        this.maxUpOffset = maxUpOffset;
        this.maxDownOffset = maxDownOffset;
        this.maxLeftOffset = maxLeftOffset;
        this.maxRightOffset = maxRightOffset;
    }

    public int getTop() {
        return top;
    }

    public int getLeft() {
        return left;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getMaxUpOffset() {
        return maxUpOffset;
    }

    public int getMaxDownOffset() {
        return maxDownOffset;
    }

    public int getMaxLeftOffset() {
        return maxLeftOffset;
    }

    public int getMaxRightOffset() {
        return maxRightOffset;
    }

    @Override
    public int hashCode() {
        return left*30000 + top*2000 + width*500 + height;
    }

    @Override
    public boolean equals(Object other) {
        if (other == null) { return  false;}
        if (!(other instanceof FloatingMatchSettings)) {return  false;}
        FloatingMatchSettings otherFMS = (FloatingMatchSettings)other;

        return otherFMS.width == width &&
        otherFMS.height == height &&
        otherFMS.left == left &&
        otherFMS.top == top &&
        otherFMS.maxUpOffset == maxUpOffset &&
        otherFMS.maxRightOffset == maxRightOffset &&
        otherFMS.maxDownOffset == maxDownOffset &&
        otherFMS.maxLeftOffset == maxLeftOffset;
    }

    @Override
    public String toString() {
        return "FloatingMatchSettings{" +
                "top=" + top +
                ", left=" + left +
                ", width=" + width +
                ", height=" + height +
                ", maxUpOffset=" + maxUpOffset +
                ", maxDownOffset=" + maxDownOffset +
                ", maxLeftOffset=" + maxLeftOffset +
                ", maxRightOffset=" + maxRightOffset +
                '}';
    }
}
