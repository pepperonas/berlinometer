package io.celox.application.utils;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.celox.application.model.Recipe;
import io.celox.application.model.RecipeIngredient;

/**
 * Utility-Klasse zum Parsen von Rezepten aus AI-Antworten
 */
public class RecipeParser {
    private static final Logger LOGGER = Logger.getLogger(RecipeParser.class.getName());
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parst ein Rezept aus einer AI-Antwort.
     *
     * @param aiResponse Die AI-Antwort als Text
     * @param userId     Die ID des Benutzers, dem das Rezept gehört
     * @return Ein Recipe-Objekt oder null, wenn das Parsing fehlschlägt
     */
    public static Recipe parseRecipeFromAiResponse(String aiResponse, int userId) {
        try {
            // Titel extrahieren
            String title = extractTitle(aiResponse);
            if (title == null) {
                LOGGER.warning("Kein Rezepttitel gefunden");
                return null;
            }

            // Zubereitungszeit extrahieren
            String prepTime = extractPreparationTime(aiResponse);
            
            // Kosten extrahieren
            String cost = extractCost(aiResponse);
            
            // Portionen extrahieren
            int servings = extractServings(aiResponse);
            
            // Zutaten extrahieren
            List<RecipeIngredient> ingredients = extractIngredients(aiResponse);
            
            // Zubereitungsschritte extrahieren
            String instructions = extractInstructions(aiResponse);
            
            // Tipps extrahieren
            String tips = extractTips(aiResponse);
            
            // Wichtige Hinweise extrahieren
            String importantNotes = extractImportantNotes(aiResponse);
            
            return new Recipe(userId, title, prepTime, cost, servings, ingredients, instructions, tips, importantNotes);
        } catch (Exception e) {
            LOGGER.severe("Fehler beim Parsen des Rezepts: " + e.getMessage());
            return null;
        }
    }

    /**
     * Extrahiert den Titel aus der AI-Antwort.
     */
    private static String extractTitle(String aiResponse) {
        // Versuche zunächst den Titel nach "### 🍽️" zu finden
        Pattern pattern = Pattern.compile("### 🍽️\\s*(.+?)\\s*(?:\\n|$)");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Alternativ nach "###" suchen, falls kein Emoji vorhanden ist
        pattern = Pattern.compile("###\\s*(.+?)\\s*(?:\\n|$)");
        matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Falls das auch nicht funktioniert, nimm die erste Zeile nach "Rezept für X Personen"
        pattern = Pattern.compile("Rezept für \\d+ Personen[\\s\\*]*\\n+(.+?)\\s*(?:\\n|$)");
        matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return null;
    }

    /**
     * Extrahiert die Zubereitungszeit aus der AI-Antwort.
     */
    private static String extractPreparationTime(String aiResponse) {
        Pattern pattern = Pattern.compile("(?:Zubereitungszeit|Zeit):\\s*([^\\n]+)");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return "";
    }

    /**
     * Extrahiert die Kosten aus der AI-Antwort.
     */
    private static String extractCost(String aiResponse) {
        Pattern pattern = Pattern.compile("(?:Kosten|Preis):\\s*([^\\n]+)");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return "";
    }

    /**
     * Extrahiert die Anzahl der Portionen aus der AI-Antwort.
     */
    private static int extractServings(String aiResponse) {
        Pattern pattern = Pattern.compile("Rezept für (\\d+) Personen");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                // Ignorieren und Standardwert zurückgeben
            }
        }
        
        return 2; // Standardwert, falls nicht gefunden
    }

    /**
     * Extrahiert die Zutaten aus der AI-Antwort.
     */
    private static List<RecipeIngredient> extractIngredients(String aiResponse) {
        List<RecipeIngredient> ingredients = new ArrayList<>();
        
        // Zutatenbereich finden
        Pattern sectionPattern = Pattern.compile("(?:Zutaten|Einkaufstipp):[\\s\\S]*?(?=-|\\n\\n|\\*\\*|###)");
        Matcher sectionMatcher = sectionPattern.matcher(aiResponse);
        
        if (sectionMatcher.find()) {
            String ingredientsSection = sectionMatcher.group();
            
            // Einzelne Zutaten extrahieren (Zeilen, die mit - beginnen)
            Pattern ingredientPattern = Pattern.compile("- ([^\\n]+)");
            Matcher ingredientMatcher = ingredientPattern.matcher(ingredientsSection);
            
            while (ingredientMatcher.find()) {
                String ingredientLine = ingredientMatcher.group(1).trim();
                
                // Menge und Einheit aus der Zutat extrahieren
                RecipeIngredient ingredient = parseIngredientLine(ingredientLine);
                ingredients.add(ingredient);
            }
        }
        
        return ingredients;
    }

    /**
     * Parst eine Zutatenzeile und extrahiert Name, Menge und Einheit.
     */
    private static RecipeIngredient parseIngredientLine(String line) {
        // Typische Formate:
        // "150 g Rindergeschnetzeltes"
        // "1 rote Paprika"
        // "Salz und Pfeffer"
        
        Pattern pattern = Pattern.compile("^(\\d+(?:[,.][\\d]+)?)\\s*(g|kg|ml|l|EL|TL|Stück|Zehe|Dose|Prise|Packung)?\\s*(.+)$");
        Matcher matcher = pattern.matcher(line);
        
        if (matcher.find()) {
            String quantity = matcher.group(1);
            String unit = matcher.group(2) != null ? matcher.group(2) : "";
            String name = matcher.group(3).trim();
            
            return new RecipeIngredient(name, quantity, unit);
        } else {
            // Keine Menge/Einheit gefunden oder komplexeres Format
            return new RecipeIngredient(line, "", "");
        }
    }

    /**
     * Extrahiert die Zubereitungsschritte aus der AI-Antwort.
     */
    private static String extractInstructions(String aiResponse) {
        // Zubereitungsbereich finden
        Pattern sectionPattern = Pattern.compile("(?:Zubereitung|Anleitung):[\\s\\S]*?(?=\\n\\n\\*\\*|$)");
        Matcher sectionMatcher = sectionPattern.matcher(aiResponse);
        
        if (sectionMatcher.find()) {
            String instructionsSection = sectionMatcher.group();
            
            // Numerierte Schritte extrahieren
            Pattern stepPattern = Pattern.compile("\\d+\\.\\s*([^\\n]+)");
            Matcher stepMatcher = stepPattern.matcher(instructionsSection);
            
            List<String> steps = new ArrayList<>();
            while (stepMatcher.find()) {
                steps.add(stepMatcher.group(1).trim());
            }
            
            // Falls keine nummerierten Schritte gefunden wurden, versuche Zeilen mit 🍳, 🔪, etc.
            if (steps.isEmpty()) {
                stepPattern = Pattern.compile("(?:🍳|🔪|💧|🥣|🍽️|🥩|🧅|🍝|🌶️)\\s*([^\\n]+)");
                stepMatcher = stepPattern.matcher(instructionsSection);
                
                while (stepMatcher.find()) {
                    steps.add(stepMatcher.group(1).trim());
                }
            }
            
            // Alle Schritte zusammenfügen
            return String.join("\n\n", steps);
        }
        
        return "";
    }

    /**
     * Extrahiert Tipps aus der AI-Antwort.
     */
    private static String extractTips(String aiResponse) {
        Pattern pattern = Pattern.compile("(?:Tipp|Hinweis|Tipps):[\\s]*([^\\n]+(?:\\n[^\\n*#]+)*)");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return "";
    }

    /**
     * Extrahiert wichtige Hinweise aus der AI-Antwort.
     */
    private static String extractImportantNotes(String aiResponse) {
        Pattern pattern = Pattern.compile("(?:Wichtig|Bitte beachten):[\\s]*([^\\n]+(?:\\n[^\\n*#]+)*)");
        Matcher matcher = pattern.matcher(aiResponse);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return "";
    }

    /**
     * Konvertiert ein Recipe-Objekt in JSON.
     */
    public static String recipeToJson(Recipe recipe) {
        try {
            return objectMapper.writeValueAsString(recipe);
        } catch (Exception e) {
            LOGGER.severe("Fehler bei der JSON-Konvertierung: " + e.getMessage());
            return "{}";
        }
    }

    /**
     * Konvertiert JSON in ein Recipe-Objekt.
     */
    public static Recipe jsonToRecipe(String json, int userId) {
        try {
            return objectMapper.readValue(json, Recipe.class);
        } catch (Exception e) {
            LOGGER.severe("Fehler beim Parsen des JSON: " + e.getMessage());
            return null;
        }
    }
}
