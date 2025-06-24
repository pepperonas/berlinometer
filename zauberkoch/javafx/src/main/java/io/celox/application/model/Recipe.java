package io.celox.application.model;

import java.sql.Timestamp;
import java.util.List;

/**
 * Modellklasse zur Repräsentation eines Rezepts
 */
public class Recipe {
    private long id;
    private int userId;
    private Long apiLogId;
    private String title;
    private String preparationTime;
    private String cost;
    private String alcoholContent;
    private int servings;
    private List<RecipeIngredient> ingredients;
    private String instructions;
    private String tips;
    private String importantNotes;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private boolean favorite;

    // Konstruktor für neues Rezept
    public Recipe(int userId, String title, String preparationTime, String cost,
                  int servings, List<RecipeIngredient> ingredients, String instructions,
                  String tips, String importantNotes) {
        this.userId = userId;
        this.title = title;
        this.preparationTime = preparationTime;
        this.cost = cost;
        this.servings = servings;
        this.ingredients = ingredients;
        this.instructions = instructions;
        this.tips = tips;
        this.importantNotes = importantNotes;
    }

    // Konstruktor für vorhandenes Rezept aus DB
    public Recipe(long id, int userId, Long apiLogId, String title, String preparationTime,
                  String cost, int servings, String instructions, String tips,
                  String importantNotes, Timestamp createdAt, Timestamp updatedAt, boolean favorite) {
        this.id = id;
        this.userId = userId;
        this.apiLogId = apiLogId;
        this.title = title;
        this.preparationTime = preparationTime;
        this.cost = cost;
        this.servings = servings;
        this.instructions = instructions;
        this.tips = tips;
        this.importantNotes = importantNotes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.favorite = favorite;
    }

    // Getter und Setter
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public Long getApiLogId() {
        return apiLogId;
    }

    public void setApiLogId(Long apiLogId) {
        this.apiLogId = apiLogId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPreparationTime() {
        return preparationTime;
    }

    public void setPreparationTime(String preparationTime) {
        this.preparationTime = preparationTime;
    }

    public String getCost() {
        return cost;
    }

    public void setCost(String cost) {
        this.cost = cost;
    }

    public String getAlcoholContent() {
        return alcoholContent;
    }

    public void setAlcoholContent(String alcoholContent) {
        this.alcoholContent = alcoholContent;
    }

    public int getServings() {
        return servings;
    }

    public void setServings(int servings) {
        this.servings = servings;
    }

    public List<RecipeIngredient> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<RecipeIngredient> ingredients) {
        this.ingredients = ingredients;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getTips() {
        return tips;
    }

    public void setTips(String tips) {
        this.tips = tips;
    }

    public String getImportantNotes() {
        return importantNotes;
    }

    public void setImportantNotes(String importantNotes) {
        this.importantNotes = importantNotes;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isFavorite() {
        return favorite;
    }

    public void setFavorite(boolean favorite) {
        this.favorite = favorite;
    }
}
