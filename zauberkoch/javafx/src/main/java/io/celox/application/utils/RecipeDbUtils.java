package io.celox.application.utils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

import io.celox.application.model.Recipe;
import io.celox.application.model.RecipeIngredient;

/**
 * Erweiterung der DbConnection-Klasse für die Verwaltung von Rezepten
 */
public class RecipeDbUtils {
    private static final Logger LOGGER = Logger.getLogger(RecipeDbUtils.class.getName());

    /**
     * Speichert ein neues Rezept in der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipe     Das zu speichernde Rezept
     * @param apiLogId   ID des API-Logs, aus dem das Rezept erstellt wurde (optional)
     * @return Die ID des gespeicherten Rezepts oder -1 bei einem Fehler
     */
    public static long insertRecipe(Connection connection, Recipe recipe, Long apiLogId) {
        String sql = "INSERT INTO fooddb.recipes (user_id, api_log_id, title, preparation_time, cost, " +
                     "servings, instructions, tips, important_notes) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, recipe.getUserId());
            if (apiLogId != null) {
                ps.setLong(2, apiLogId);
            } else {
                ps.setNull(2, Types.INTEGER);
            }
            ps.setString(3, recipe.getTitle());
            ps.setString(4, recipe.getPreparationTime());
            ps.setString(5, recipe.getCost());
            ps.setInt(6, recipe.getServings());
            ps.setString(7, recipe.getInstructions());
            ps.setString(8, recipe.getTips());
            ps.setString(9, recipe.getImportantNotes());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Erstellen des Rezepts fehlgeschlagen, keine Zeilen betroffen.");
            }

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    long recipeId = generatedKeys.getLong(1);

                    // Speichere die Zutaten
                    if (recipe.getIngredients() != null && !recipe.getIngredients().isEmpty()) {
                        insertIngredients(connection, recipeId, recipe.getIngredients());
                    }

                    return recipeId;
                } else {
                    throw new SQLException("Erstellen des Rezepts fehlgeschlagen, keine ID erhalten.");
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Speichern des Rezepts: " + e.getMessage());
            throw new RuntimeException("Fehler beim Speichern des Rezepts", e);
        }
    }

    public static long insertDrink(Connection connection, Recipe recipe, Long apiLogId) {
        String sql = "INSERT INTO fooddb.recipes (user_id, api_log_id, title, preparation_time, alcohol_content, " +
                     "servings, instructions, tips, important_notes) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, recipe.getUserId());
            if (apiLogId != null) {
                ps.setLong(2, apiLogId);
            } else {
                ps.setNull(2, Types.INTEGER);
            }
            ps.setString(3, recipe.getTitle());
            ps.setString(4, recipe.getPreparationTime());
            ps.setString(5, recipe.getAlcoholContent());
            ps.setInt(6, recipe.getServings());
            ps.setString(7, recipe.getInstructions());
            ps.setString(8, recipe.getTips());
            ps.setString(9, recipe.getImportantNotes());

            int affectedRows = ps.executeUpdate();
            if (affectedRows == 0) {
                throw new SQLException("Erstellen des Rezepts fehlgeschlagen, keine Zeilen betroffen.");
            }

            try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    long recipeId = generatedKeys.getLong(1);

                    // Speichere die Zutaten
                    if (recipe.getIngredients() != null && !recipe.getIngredients().isEmpty()) {
                        insertIngredients(connection, recipeId, recipe.getIngredients());
                    }

                    return recipeId;
                } else {
                    throw new SQLException("Erstellen des Rezepts fehlgeschlagen, keine ID erhalten.");
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Speichern des Rezepts: " + e.getMessage());
            throw new RuntimeException("Fehler beim Speichern des Rezepts", e);
        }
    }

    /**
     * Speichert die Zutaten eines Rezepts in der Datenbank.
     *
     * @param connection  Die Datenbankverbindung
     * @param recipeId    Die ID des zugehörigen Rezepts
     * @param ingredients Die Liste der Zutaten
     */
    private static void insertIngredients(Connection connection, long recipeId, List<RecipeIngredient> ingredients)
            throws SQLException {
        String sql = "INSERT INTO fooddb.recipe_ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            for (RecipeIngredient ingredient : ingredients) {
                ps.setLong(1, recipeId);
                ps.setString(2, ingredient.getName());
                ps.setString(3, ingredient.getQuantity());
                ps.setString(4, ingredient.getUnit());
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    /**
     * Holt ein Rezept inklusive seiner Zutaten aus der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipeId   Die ID des zu holenden Rezepts
     * @return Das Rezept oder null, wenn nicht gefunden
     */
    public static Recipe getRecipeById(Connection connection, long recipeId) {
        String sql = "SELECT * FROM fooddb.recipes WHERE id = ?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setLong(1, recipeId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Recipe recipe = new Recipe(
                            rs.getInt("id"),
                            rs.getInt("user_id"),
                            rs.getLong("api_log_id"),
                            rs.getString("title"),
                            rs.getString("preparation_time"),
                            rs.getString("cost"),
                            rs.getInt("servings"),
                            rs.getString("instructions"),
                            rs.getString("tips"),
                            rs.getString("important_notes"),
                            rs.getTimestamp("created_at"),
                            rs.getTimestamp("updated_at"),
                            rs.getBoolean("is_favorite")
                    );

                    // Hole die Zutaten
                    recipe.setIngredients(getIngredientsForRecipe(connection, recipeId));

                    return recipe;
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Abrufen des Rezepts: " + e.getMessage());
            throw new RuntimeException("Fehler beim Abrufen des Rezepts", e);
        }

        return null;
    }

    /**
     * Holt alle Zutaten eines Rezepts aus der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipeId   Die ID des Rezepts
     * @return Liste der Zutaten
     */
    public static List<RecipeIngredient> getIngredientsForRecipe(Connection connection, long recipeId) {
        String sql = "SELECT * FROM fooddb.recipe_ingredients WHERE recipe_id = ?";
        List<RecipeIngredient> ingredients = new ArrayList<>();

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setLong(1, recipeId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ingredients.add(new RecipeIngredient(
                            rs.getInt("id"),
                            rs.getInt("recipe_id"),
                            rs.getString("name"),
                            rs.getString("quantity"),
                            rs.getString("unit")
                    ));
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Abrufen der Zutaten: " + e.getMessage());
            throw new RuntimeException("Fehler beim Abrufen der Zutaten", e);
        }

        return ingredients;
    }

    /**
     * Holt alle Rezepte eines Benutzers aus der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param userId     Die ID des Benutzers
     * @return Liste der Rezepte des Benutzers
     */
    public static List<Recipe> getRecipesByUserId(Connection connection, int userId) {
        String sql = "SELECT * FROM fooddb.recipes WHERE user_id = ? ORDER BY created_at DESC";
        List<Recipe> recipes = new ArrayList<>();

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int recipeId = rs.getInt("id");
                    Recipe recipe = new Recipe(
                            recipeId,
                            rs.getInt("user_id"),
                            rs.getLong("api_log_id"),
                            rs.getString("title"),
                            rs.getString("preparation_time"),
                            rs.getString("cost"),
                            rs.getInt("servings"),
                            rs.getString("instructions"),
                            rs.getString("tips"),
                            rs.getString("important_notes"),
                            rs.getTimestamp("created_at"),
                            rs.getTimestamp("updated_at"),
                            rs.getBoolean("is_favorite")
                    );

                    // Für die Übersicht müssen nicht immer alle Zutaten geladen werden
                    // Zutaten können bei Bedarf später geladen werden
                    recipes.add(recipe);
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Abrufen der Rezepte: " + e.getMessage());
            throw new RuntimeException("Fehler beim Abrufen der Rezepte", e);
        }

        return recipes;
    }

    /**
     * Aktualisiert ein vorhandenes Rezept in der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipe     Das zu aktualisierende Rezept
     * @return true bei Erfolg, false bei Misserfolg
     */
    public static boolean updateRecipe(Connection connection, Recipe recipe) {
        String sql = "UPDATE fooddb.recipes SET title = ?, preparation_time = ?, cost = ?, " +
                     "servings = ?, instructions = ?, tips = ?, important_notes = ? " +
                     "WHERE id = ? AND user_id = ?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, recipe.getTitle());
            ps.setString(2, recipe.getPreparationTime());
            ps.setString(3, recipe.getCost());
            ps.setInt(4, recipe.getServings());
            ps.setString(5, recipe.getInstructions());
            ps.setString(6, recipe.getTips());
            ps.setString(7, recipe.getImportantNotes());
            ps.setLong(8, recipe.getId());
            ps.setInt(9, recipe.getUserId());

            int affectedRows = ps.executeUpdate();

            if (affectedRows > 0 && recipe.getIngredients() != null) {
                // Lösche alte Zutaten
                deleteIngredients(connection, recipe.getId());

                // Speichere neue Zutaten
                insertIngredients(connection, recipe.getId(), recipe.getIngredients());

                return true;
            }

            return affectedRows > 0;
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Aktualisieren des Rezepts: " + e.getMessage());
            throw new RuntimeException("Fehler beim Aktualisieren des Rezepts", e);
        }
    }

    /**
     * Löscht alle Zutaten eines Rezepts aus der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipeId   Die ID des Rezepts
     */
    private static void deleteIngredients(Connection connection, long recipeId) throws SQLException {
        String sql = "DELETE FROM fooddb.recipe_ingredients WHERE recipe_id = ?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setLong(1, recipeId);
            ps.executeUpdate();
        }
    }

    /**
     * Löscht ein Rezept aus der Datenbank.
     *
     * @param connection Die Datenbankverbindung
     * @param recipeId   Die ID des zu löschenden Rezepts
     * @param userId     Die ID des Benutzers (Sicherheitscheck)
     * @return true bei Erfolg, false bei Misserfolg
     */
    public static boolean deleteRecipe(Connection connection, long recipeId, int userId) {
        String sql = "DELETE FROM fooddb.recipes WHERE id = ? AND user_id = ?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setLong(1, recipeId);
            ps.setInt(2, userId);

            int affectedRows = ps.executeUpdate();
            return affectedRows > 0;
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Löschen des Rezepts: " + e.getMessage());
            throw new RuntimeException("Fehler beim Löschen des Rezepts", e);
        }
    }

    //    /**
    //     * Markiert ein Rezept als Favorit oder entfernt es aus den Favoriten.
    //     *
    //     * @param connection Die Datenbankverbindung
    //     * @param recipeId   Die ID des Rezepts
    //     * @param userId     Die ID des Benutzers (Sicherheitscheck)
    //     * @param favorite   true zum Hinzufügen zu Favoriten, false zum Entfernen
    //     * @return true bei Erfolg, false bei Misserfolg
    //     */
    //    public static boolean toggleFavoriteRecipe(Connection connection, long recipeId, int userId, boolean favorite) {
    //        String sql = "UPDATE fooddb.recipes SET is_favorite = ? WHERE id = ? AND user_id = ?";
    //
    //        try (PreparedStatement ps = connection.prepareStatement(sql)) {
    //            ps.setBoolean(1, favorite);
    //            ps.setLong(2, recipeId);
    //            ps.setInt(3, userId);
    //
    //            int affectedRows = ps.executeUpdate();
    //            return affectedRows > 0;
    //        } catch (SQLException e) {
    //            LOGGER.severe("Fehler beim Ändern des Favoriten-Status: " + e.getMessage());
    //            throw new RuntimeException("Fehler beim Ändern des Favoriten-Status", e);
    //        }
    //    }

    //    /**
    //     * Holt alle als Favorit markierten Rezepte eines Benutzers.
    //     *
    //     * @param connection Die Datenbankverbindung
    //     * @param userId     Die ID des Benutzers
    //     * @return Liste der Favoriten-Rezepte
    //     */
    //    public static List<Recipe> getFavoriteRecipes(Connection connection, int userId) {
    //        String sql = "SELECT * FROM fooddb.recipes WHERE user_id = ? AND is_favorite = TRUE ORDER BY title";
    //        List<Recipe> recipes = new ArrayList<>();
    //
    //        try (PreparedStatement ps = connection.prepareStatement(sql)) {
    //            ps.setInt(1, userId);
    //
    //            try (ResultSet rs = ps.executeQuery()) {
    //                while (rs.next()) {
    //                    recipes.add(new Recipe(
    //                            rs.getInt("id"),
    //                            rs.getInt("user_id"),
    //                            rs.getLong("api_log_id"),
    //                            rs.getString("title"),
    //                            rs.getString("preparation_time"),
    //                            rs.getString("cost"),
    //                            rs.getInt("servings"),
    //                            rs.getString("instructions"),
    //                            rs.getString("tips"),
    //                            rs.getString("important_notes"),
    //                            rs.getTimestamp("created_at"),
    //                            rs.getTimestamp("updated_at"),
    //                            rs.getBoolean("is_favorite")
    //                    ));
    //                }
    //            }
    //        } catch (SQLException e) {
    //            LOGGER.severe("Fehler beim Abrufen der Favoriten-Rezepte: " + e.getMessage());
    //            throw new RuntimeException("Fehler beim Abrufen der Favoriten-Rezepte", e);
    //        }
    //
    //        return recipes;
    //    }

    /**
     * Sucht nach Rezepten anhand eines Suchbegriffs.
     *
     * @param connection Die Datenbankverbindung
     * @param userId     Die ID des Benutzers
     * @param searchTerm Der Suchbegriff
     * @return Liste der passenden Rezepte
     */
    public static List<Recipe> searchRecipes(Connection connection, int userId, String searchTerm) {
        String sql = "SELECT DISTINCT r.* FROM recipes r " +
                     "LEFT JOIN fooddb.recipe_ingredients i ON r.id = i.recipe_id " +
                     "WHERE r.user_id = ? AND (r.title LIKE ? OR i.name LIKE ?) " +
                     "ORDER BY r.title";
        List<Recipe> recipes = new ArrayList<>();
        String searchPattern = "%" + searchTerm + "%";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, searchPattern);
            ps.setString(3, searchPattern);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    recipes.add(new Recipe(
                            rs.getInt("id"),
                            rs.getInt("user_id"),
                            rs.getLong("api_log_id"),
                            rs.getString("title"),
                            rs.getString("preparation_time"),
                            rs.getString("cost"),
                            rs.getInt("servings"),
                            rs.getString("instructions"),
                            rs.getString("tips"),
                            rs.getString("important_notes"),
                            rs.getTimestamp("created_at"),
                            rs.getTimestamp("updated_at"),
                            rs.getBoolean("is_favorite")
                    ));
                }
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler bei der Rezeptsuche: " + e.getMessage());
            throw new RuntimeException("Fehler bei der Rezeptsuche", e);
        }

        return recipes;
    }
}
