package io.celox.application.api.openai;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.util.Base64;

import io.celox.application.utils.Const;

public class ChatGptClient {

    /**
     * Sendet eine einfache Textanfrage an ChatGPT.
     *
     * @param userMessage Die Nachricht des Benutzers
     * @return Die Antwort von ChatGPT
     */
    public static String askChatGpt(String userMessage) {
        try {
            // JSON-Request erstellen
            JSONObject requestBody = new JSONObject();
            requestBody.put("model", "gpt-4o"); // oder "gpt-3.5-turbo"
            requestBody.put("messages", new JSONArray()
                    .put(new JSONObject().put("role", "system").put("content", "You are a helpful assistant."))
                    .put(new JSONObject().put("role", "user").put("content", userMessage))
            );
            requestBody.put("max_tokens", Const.GPT_MAX_TOKENS);

            return sendRequest(requestBody);

        } catch (Exception e) {
            return "Fehler bei der Anfrage: " + e.getMessage();
        }
    }

    /**
     * Sendet eine Anfrage mit Bild an ChatGPT zur Analyse.
     *
     * @param userMessage Die Nachricht des Benutzers
     * @param imagePath   Der Pfad zum Bild auf dem Dateisystem
     * @return Die Antwort von ChatGPT
     */
    public static String askChatGptWithImage(String userMessage, String imagePath) {
        try {
            // Bild als Base64 kodieren
            String base64Image = encodeImageToBase64(imagePath);

            // MIME-Typ ermitteln
            String mimeType = getMimeType(imagePath);

            // Nachrichtenobjekt mit Text und Bild erstellen
            JSONObject userMessageObject = new JSONObject();
            userMessageObject.put("role", "user");

            // Content als Array von Inhalten erstellen
            JSONArray contentArray = new JSONArray();

            // Textinhalt hinzufügen
            contentArray.put(new JSONObject()
                    .put("type", "text")
                    .put("text", userMessage));

            // Bildinhalt hinzufügen
            contentArray.put(new JSONObject()
                    .put("type", "image_url")
                    .put("image_url", new JSONObject()
                            .put("url", "data:" + mimeType + ";base64," + base64Image)));

            userMessageObject.put("content", contentArray);

            // Request-Body erstellen
            JSONObject requestBody = new JSONObject();
            requestBody.put("model", "gpt-4o"); // Nur gpt-4o unterstützt Vision-Funktionen
            requestBody.put("messages", new JSONArray()
                    .put(new JSONObject().put("role", "system").put("content", "You are a helpful assistant with vision capabilities."))
                    .put(userMessageObject)
            );
            requestBody.put("max_tokens", Const.GPT_MAX_TOKENS);

            return sendRequest(requestBody);
        } catch (Exception e) {
            return "Fehler bei der Anfrage mit Bild: " + e.getMessage();
        }
    }

    /**
     * Hilfsmethode zum Senden der HTTP-Anfrage an die OpenAI API.
     *
     * @param requestBody Der JSON-Request-Body
     * @return Die Antwort von ChatGPT
     */
    private static String sendRequest(JSONObject requestBody) {
        // HTTP-Request erstellen
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(Const.GPT_API_URL))
                .header("Authorization", "Bearer " + Const.GPT_API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        // HTTP-Client ausführen
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = null;
        try {
            response = client.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }

        // JSON-Antwort verarbeiten
        JSONObject jsonResponse = null;
        try {
            jsonResponse = new JSONObject(response.body());
            JSONArray choices = jsonResponse.getJSONArray("choices");
            return choices.getJSONObject(0).getJSONObject("message").getString("content");
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Kodiert ein Bild als Base64-String.
     *
     * @param imagePath Der Pfad zum Bild
     * @return Das Bild als Base64-String
     * @throws IOException Bei Fehlern beim Lesen der Datei
     */
    private static String encodeImageToBase64(String imagePath) throws IOException {
        byte[] imageBytes = Files.readAllBytes(new File(imagePath).toPath());
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    /**
     * Ermittelt den MIME-Typ eines Bildes anhand seiner Dateiendung.
     *
     * @param imagePath Der Pfad zum Bild
     * @return Der MIME-Typ des Bildes
     */
    private static String getMimeType(String imagePath) {
        String lowercasePath = imagePath.toLowerCase();
        if (lowercasePath.endsWith(".jpg") || lowercasePath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowercasePath.endsWith(".png")) {
            return "image/png";
        } else if (lowercasePath.endsWith(".gif")) {
            return "image/gif";
        } else if (lowercasePath.endsWith(".webp")) {
            return "image/webp";
        } else {
            // Standardwert, falls die Dateiendung nicht erkannt wird
            return "image/jpeg";
        }
    }
}