package com.applitools.eyes.images.universal.mapper;

import com.applitools.ICheckSettings;
import com.applitools.eyes.Region;
import com.applitools.eyes.config.Configuration;
import com.applitools.eyes.images.ImagesCheckSettings;
import com.applitools.eyes.universal.dto.CheckSettingsDto;
import com.applitools.eyes.universal.dto.DebugScreenshotHandlerDto;
import com.applitools.eyes.universal.dto.ImageCropRectDto;
import com.applitools.eyes.universal.dto.TRegion;
import com.applitools.eyes.universal.mapper.*;

import java.util.Arrays;

import static com.applitools.eyes.universal.mapper.SettingsMapper.toImageCropRect;
import static com.applitools.eyes.universal.mapper.SettingsMapper.toNormalizationDto;

public class ImagesCheckSettingsMapper {

    public static CheckSettingsDto toCheckSettingsDto(ICheckSettings checkSettings, Configuration config) {
        if (!(checkSettings instanceof ImagesCheckSettings)) {
            return null;
        }

        ImagesCheckSettings imagesCheckSettings = (ImagesCheckSettings) checkSettings;
        CheckSettingsDto checkSettingsDto = new CheckSettingsDto();

        checkSettingsDto.setRegion(toTRegionFromRegion(imagesCheckSettings.getTargetRegion()));
        checkSettingsDto.setFrames(null);
        checkSettingsDto.setFully(imagesCheckSettings.getStitchContent());
        checkSettingsDto.setScrollRootElement(null);
        checkSettingsDto.setStitchMode(config.getStitchMode() == null ? null : config.getStitchMode().getName());
        checkSettingsDto.setHideScrollbars(config.getHideScrollbars());
        checkSettingsDto.setHideCaret(config.getHideCaret());
        checkSettingsDto.setOverlap(config.getOverlap());
        checkSettingsDto.setWaitBeforeCapture(imagesCheckSettings.getWaitBeforeCapture());
        checkSettingsDto.setLazyLoad(imagesCheckSettings.getLazyLoadOptions());
        checkSettingsDto.setIgnoreDisplacements(imagesCheckSettings.isIgnoreDisplacements());
        checkSettingsDto.setNormalization(toNormalizationDto(
                toImageCropRect(config.getCutProvider(), config.getContentInset()), config.getRotation(), config.getScaleRatio()));

        checkSettingsDto.setDebugImages(new DebugScreenshotHandlerDto(config.getSaveDebugScreenshots(),
                config.getDebugScreenshotsPath(), config.getDebugScreenshotsPrefix()));
        checkSettingsDto.setName(imagesCheckSettings.getName());
        checkSettingsDto.setPageId(null);
        checkSettingsDto.setIgnoreRegions(ImageCodedRegionReferenceMapper
                .toCodedRegionReferenceList(Arrays.asList(imagesCheckSettings.getIgnoreRegions())));
        checkSettingsDto.setLayoutRegions(ImageCodedRegionReferenceMapper
                .toCodedRegionReferenceList(Arrays.asList(imagesCheckSettings.getLayoutRegions())));
        checkSettingsDto.setStrictRegions(ImageCodedRegionReferenceMapper
                .toCodedRegionReferenceList(Arrays.asList(imagesCheckSettings.getStrictRegions())));
        checkSettingsDto.setContentRegions(ImageCodedRegionReferenceMapper
                .toCodedRegionReferenceList(Arrays.asList(imagesCheckSettings.getContentRegions())));
        checkSettingsDto.setFloatingRegions(ImageTFloatingRegionMapper.toTFloatingRegionDtoList(Arrays.asList(imagesCheckSettings.getFloatingRegions())));
        checkSettingsDto.setAccessibilityRegions(ImageTAccessibilityRegionMapper.toTAccessibilityRegionDtoList(Arrays.asList(imagesCheckSettings.getAccessibilityRegions())));
        checkSettingsDto.setAccessibilitySettings(AccessibilitySettingsMapper.toAccessibilitySettingsDto(imagesCheckSettings.getAccessibilityValidation()));
        checkSettingsDto.setMatchLevel(imagesCheckSettings.getMatchLevel() == null ? null : imagesCheckSettings.getMatchLevel().getName());
        checkSettingsDto.setRetryTimeout(config.getMatchTimeout()); //I'm NEW - former matchTimeout
        checkSettingsDto.setSendDom(imagesCheckSettings.isSendDom());
        checkSettingsDto.setUseDom(imagesCheckSettings.isUseDom());
        checkSettingsDto.setEnablePatterns(imagesCheckSettings.isEnablePatterns());
        checkSettingsDto.setIgnoreCaret(imagesCheckSettings.getIgnoreCaret());
        checkSettingsDto.setUfgOptions(VisualGridOptionMapper.toVisualGridOptionDtoList(imagesCheckSettings.getVisualGridOptions())); //I'm NEW - former visualGridOptions
        checkSettingsDto.setLayoutBreakpoints(imagesCheckSettings
                .getLayoutBreakpoints().isEmpty() ?
                imagesCheckSettings.isDefaultLayoutBreakpointsSet() : imagesCheckSettings.getLayoutBreakpoints());
        checkSettingsDto.setDisableBrowserFetching(imagesCheckSettings.isDisableBrowserFetching());
        checkSettingsDto.setAutProxy(ProxyMapper.toAutProxyDto(config.getAutProxy()));
        checkSettingsDto.setHooks(imagesCheckSettings.getScriptHooks());
        checkSettingsDto.setDensityMetrics(imagesCheckSettings.getDensityMetrics());

        return checkSettingsDto;
    }

    private static TRegion toTRegionFromRegion(Region region) {
        if (region != null) {
            return RectangleRegionMapper.toRectangleRegionDto(region);
        }

        return null;
    }
}
