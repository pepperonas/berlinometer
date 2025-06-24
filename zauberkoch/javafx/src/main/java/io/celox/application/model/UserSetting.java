package io.celox.application.model;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import java.time.LocalDateTime;

public class UserSetting {
    private int id;
    private long userId;
    private LocalDateTime updated;    // oder alternativ java.sql.Timestamp
    private String rgType;
    private String rgTypeDrink;
    private String rgGoal;
    private String rgStyleDrink;
    private String rgApi;
    private int sliderDiversity = 1;
    private int sliderDiversityDrink = 1;
    private int sliderDuration = 1;
    private int sliderComplexityDrink = 1;
    private int sliderCost = 1;
    private int sliderAlcoholContentDrink = 1;
    private int sliderPortions = 2;
    private int sliderGlassesDrink = 2;
    private int cbxGetThin = 0;
    private int cbxGetHeavy = 0;
    private int cbxGetMuscles = 0;
    private int cbxGetHealthy = 0;
    private int cbxFruityDrink = 0;
    private int cbxDessertDrink = 0;
    private boolean expandableLayoutOpen = true;
    private boolean requestJson = true;
    private boolean reduceAnimations = true;

    // -- Getter & Setter --

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long userId) {
        this.userId = userId;
    }

    public LocalDateTime getUpdated() {
        return updated;
    }

    public void setUpdated(LocalDateTime updated) {
        this.updated = updated;
    }

    public String getRgType() {
        return rgType;
    }

    public void setRgType(String rgType) {
        this.rgType = rgType;
    }

    public String getRgTypeDrink() {
        return rgTypeDrink;
    }

    public void setRgTypeDrink(String rgTypeDrink) {
        this.rgTypeDrink = rgTypeDrink;
    }

    public String getRgGoal() {
        return rgGoal;
    }

    public void setRgGoal(String rgGoal) {
        this.rgGoal = rgGoal;
    }

    public String getRgStyleDrink() {
        return rgStyleDrink;
    }

    public void setRgStyleDrink(String rgStyleDrink) {
        this.rgStyleDrink = rgStyleDrink;
    }

    public String getRgApi() {
        return rgApi;
    }

    public void setRgApi(String rgApi) {
        this.rgApi = rgApi;
    }

    public int getSliderDiversity() {
        return sliderDiversity;
    }

    public void setSliderDiversity(int sliderDiversity) {
        this.sliderDiversity = sliderDiversity;
    }

    public int getSliderDiversityDrink() {
        return sliderDiversityDrink;
    }

    public void setSliderDiversityDrink(int sliderDiversityDrink) {
        this.sliderDiversityDrink = sliderDiversityDrink;
    }

    public int getSliderDuration() {
        return sliderDuration;
    }

    public void setSliderDuration(int sliderDuration) {
        this.sliderDuration = sliderDuration;
    }

    public int getSliderComplexityDrink() {
        return sliderComplexityDrink;
    }

    public void setSliderComplexityDrink(int sliderComplexityDrink) {
        this.sliderComplexityDrink = sliderComplexityDrink;
    }

    public int getSliderCost() {
        return sliderCost;
    }

    public void setSliderCost(int sliderCost) {
        this.sliderCost = sliderCost;
    }

    public int getSliderAlcoholContentDrink() {
        return sliderAlcoholContentDrink;
    }

    public void setSliderAlcoholContentDrink(int sliderAlcoholContentDrink) {
        this.sliderAlcoholContentDrink = sliderAlcoholContentDrink;
    }

    public int getSliderPortions() {
        return sliderPortions;
    }

    public void setSliderPortions(int sliderPortions) {
        this.sliderPortions = sliderPortions;
    }

    public int getSliderGlassesDrink() {
        return sliderGlassesDrink;
    }

    public void setSliderGlassesDrink(int sliderGlassesDrink) {
        this.sliderGlassesDrink = sliderGlassesDrink;
    }

    public int getCbxGetThin() {
        return cbxGetThin;
    }

    public void setCbxGetThin(int cbxGetThin) {
        this.cbxGetThin = cbxGetThin;
    }

    public int getCbxGetHeavy() {
        return cbxGetHeavy;
    }

    public void setCbxGetHeavy(int cbxGetHeavy) {
        this.cbxGetHeavy = cbxGetHeavy;
    }

    public int getCbxGetMuscles() {
        return cbxGetMuscles;
    }

    public void setCbxGetMuscles(int cbxGetMuscles) {
        this.cbxGetMuscles = cbxGetMuscles;
    }

    public int getCbxGetHealthy() {
        return cbxGetHealthy;
    }

    public void setCbxGetHealthy(int cbxGetHealthy) {
        this.cbxGetHealthy = cbxGetHealthy;
    }

    public int getCbxFruityDrink() {
        return cbxFruityDrink;
    }

    public void setCbxFruityDrink(int cbxFruityDrink) {
        this.cbxFruityDrink = cbxFruityDrink;
    }

    public int getCbxDessertDrink() {
        return cbxDessertDrink;
    }

    public void setCbxDessertDrink(int cbxDessertDrink) {
        this.cbxDessertDrink = cbxDessertDrink;
    }

    public boolean isExpandableLayoutOpen() {
        return expandableLayoutOpen;
    }

    public void setExpandableLayoutOpen(boolean expandableLayoutOpen) {
        this.expandableLayoutOpen = expandableLayoutOpen;
    }

    public boolean isRequestJson() {
        return requestJson;
    }

    public void setRequestJson(boolean requestJson) {
        this.requestJson = requestJson;
    }

    public boolean isReduceAnimations() {
        return reduceAnimations;
    }

    public void setReduceAnimations(boolean reduceAnimations) {
        this.reduceAnimations = reduceAnimations;
    }
}
