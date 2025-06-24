package io.celox.application.model;

/**
 * Modellklasse zur Repräsentation einer Zutat in einem Rezept
 */
public class RecipeIngredient {
    private long id;
    private long recipeId;
    private String name;
    private String quantity;
    private String unit;

    // Konstruktor für neue Zutat
    public RecipeIngredient(String name, String quantity, String unit) {
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
    }

    // Konstruktor für vorhandene Zutat aus DB
    public RecipeIngredient(long id, long recipeId, String name, String quantity, String unit) {
        this.id = id;
        this.recipeId = recipeId;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
    }

    // Getter und Setter
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getRecipeId() {
        return recipeId;
    }

    public void setRecipeId(long recipeId) {
        this.recipeId = recipeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
