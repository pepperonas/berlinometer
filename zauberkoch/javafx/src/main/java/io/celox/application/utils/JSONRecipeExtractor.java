package io.celox.application.utils;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.celox.application.model.Recipe;
import io.celox.application.model.RecipeIngredient;

/**
 * Utility-Klasse zum Extrahieren von JSON-Rezepten aus AI-Antworten
 */
public class JSONRecipeExtractor {
    private static final Logger LOGGER = Logger.getLogger(JSONRecipeExtractor.class.getName());
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extrahiert ein JSON-Rezept aus einer AI-Antwort und konvertiert es in ein Recipe-Objekt.
     *
     * @param aiResponse Die AI-Antwort als Text
     * @param userId     Die ID des Benutzers, dem das Rezept gehört
     * @return Ein Recipe-Objekt oder null, wenn die Extraktion fehlschlägt
     */
    public static Recipe extractRecipeFromJson(String aiResponse, int userId) {
        try {
            // Extrahiere den JSON-Block aus der Antwort
            String jsonContent = extractJsonBlock(aiResponse);

            if (jsonContent == null) {
                LOGGER.warning("Kein JSON-Block in der AI-Antwort gefunden");
                // Fallback zum Text-Parser
                return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
            }

            // JSON in eine Map deserialisieren
            RecipeJsonDTO recipeDto = objectMapper.readValue(jsonContent, RecipeJsonDTO.class);

            // Konvertiere DTO zu Recipe-Objekt
            List<RecipeIngredient> ingredients = new ArrayList<>();
            if (recipeDto.ingredients != null) {
                for (IngredientDTO ing : recipeDto.ingredients) {
                    ingredients.add(new RecipeIngredient(
                            ing.name,
                            ing.quantity != null ? ing.quantity : "",
                            ing.unit != null ? ing.unit : ""
                    ));
                }
            }

            // Zubereitungsschritte zu einem String zusammenfügen
            String instructions = "";
            if (recipeDto.instructions != null && !recipeDto.instructions.isEmpty()) {
                instructions = String.join("\n\n", recipeDto.instructions);
            }

            Recipe recipe = new Recipe(
                    userId,
                    recipeDto.title,
                    recipeDto.preparationTime != null ? recipeDto.preparationTime : "",
                    recipeDto.cost != null ? recipeDto.cost : "",
                    recipeDto.servings != null ? recipeDto.servings : 2,
                    ingredients,
                    instructions,
                    recipeDto.tips != null ? recipeDto.tips : "",
                    recipeDto.importantNotes != null ? recipeDto.importantNotes : ""
            );

            return recipe;

        } catch (Exception e) {
            LOGGER.warning("Fehler beim Extrahieren des JSON-Rezepts: " + e.getMessage());
            // Bei Fehlern Fallback zum Text-Parser
            return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
        }
    }

    public static Recipe extractDrinkFromJson(String aiResponse, int userId) {
        try {
            // Extrahiere den JSON-Block aus der Antwort
            String jsonContent = extractJsonBlock(aiResponse);

            if (jsonContent == null) {
                LOGGER.warning("Kein JSON-Block in der AI-Antwort gefunden");
                // Fallback zum Text-Parser
                return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
            }

            // JSON in DTO deserialisieren
            RecipeJsonDTO drinkDto = objectMapper.readValue(jsonContent, RecipeJsonDTO.class);

            // Konvertiere DTO zu Recipe-Objekt
            List<RecipeIngredient> ingredients = new ArrayList<>();
            if (drinkDto.ingredients != null) {
                for (IngredientDTO ing : drinkDto.ingredients) {
                    ingredients.add(new RecipeIngredient(
                            ing.name,
                            ing.quantity != null ? ing.quantity : "",
                            ing.unit != null ? ing.unit : ""
                    ));
                }
            }

            // Zubereitungsschritte zu einem String zusammenfügen
            String instructions = "";
            if (drinkDto.instructions != null && !drinkDto.instructions.isEmpty()) {
                instructions = String.join("\n\n", drinkDto.instructions);
            }

            // Recipe-Objekt zurückgeben (unter der Annahme, dass Recipe einen passenden Konstruktor hat)
            Recipe recipe = new Recipe(
                    userId,
                    drinkDto.title,
                    drinkDto.preparationTime != null ? drinkDto.preparationTime : "",
                    "", // Leerer String für cost
                    drinkDto.servings != null ? drinkDto.servings : 2,
                    ingredients,
                    instructions,
                    drinkDto.tips != null ? drinkDto.tips : "",
                    drinkDto.importantNotes != null ? drinkDto.importantNotes : ""
            );

            recipe.setAlcoholContent(drinkDto.alcoholContent != null ? drinkDto.alcoholContent : "");

            return recipe;

        } catch (Exception e) {
            LOGGER.warning("Fehler beim Extrahieren des JSON-Rezepts: " + e.getMessage());
            // Bei Fehlern Fallback zum Text-Parser
            return RecipeParser.parseRecipeFromAiResponse(aiResponse, userId);
        }
    }

    /**
     * Extrahiert den JSON-Block aus einer AI-Antwort.
     */
    private static String extractJsonBlock(String aiResponse) {
        // Suche nach dem JSON-Block zwischen ```json und ```
        Pattern pattern = Pattern.compile("```json\\s*(\\{[\\s\\S]*?\\})\\s*```");
        Matcher matcher = pattern.matcher(aiResponse);

        if (matcher.find()) {
            return matcher.group(1);
        }

        // Alternativ nach einem Block suchen, der wie JSON aussieht (für den Fall, dass die KI die Codeblöcke vergisst)
        pattern = Pattern.compile("\\{\\s*\"title\"\\s*:[\\s\\S]*?\\}");
        matcher = pattern.matcher(aiResponse);

        if (matcher.find()) {
            return matcher.group(0);
        }

        return null;
    }

    /**
     * DTO-Klasse für die JSON-Deserialisierung von Rezepten
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class RecipeJsonDTO {
        public String title;
        public String preparationTime;
        public String cost;
        public String alcoholContent;
        public Integer servings;
        public List<IngredientDTO> ingredients;
        public List<String> instructions;
        public String tips;
        public String importantNotes;
    }

    /**
     * DTO-Klasse für die JSON-Deserialisierung von Zutaten
     */
    private static class IngredientDTO {
        public String name;
        public String quantity;
        public String unit;
    }
}