package io.celox.application.api.grok.openai;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import io.celox.application.utils.Const;

public class GrokAiClient {

    public static String askGrok(String userInput) {
        try {
            String apiKey = Const.GROK_API_KEY;

            // JSON-Payload erstellen
            JSONObject payload = new JSONObject();
            payload.put("model", "grok-2-latest");

            JSONArray messages = new JSONArray();

            JSONObject systemMessage = new JSONObject();
            systemMessage.put("role", "system");
            // TODO: setup
            systemMessage.put("content",
                    "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.");
            messages.put(systemMessage);

            JSONObject userMessage = new JSONObject();
            userMessage.put("role", "user");
            userMessage.put("content", userInput);  // userInput wird hier verwendet
            messages.put(userMessage);

            payload.put("messages", messages);

            // HTTP-Client initialisieren
            HttpClient client = HttpClient.newHttpClient();

            // HTTP-Request erstellen
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.x.ai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();

            // Anfrage senden und Antwort empfangen
            HttpResponse<String> response = client.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            // Antwort parsen
            JSONObject jsonResponse = new JSONObject(response.body());
            String content = jsonResponse
                    .getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

            return content;  // Antwort zurückgeben statt ausgeben

        } catch (Exception e) {
            e.printStackTrace();
            return "Ein Fehler ist aufgetreten: " + e.getMessage();  // Fehlerbehandlung mit Rückgabe
        }
    }
}

