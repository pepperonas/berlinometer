package io.celox.application.api.openai;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

import io.celox.application.utils.Const;
import reactor.core.publisher.Mono;

@Service
public class OpenAiService {

    private final WebClient webClient;
    private static final String API_URL = Const.GPT_API_URL;
    private static final String API_KEY = Const.GPT_API_KEY; // Hier API-Key einfügen

    public OpenAiService() {
        this.webClient = WebClient.builder()
                .baseUrl(API_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + API_KEY)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public Mono<String> askChatGpt(String message) {
        // JSON-Request-Body für OpenAI API
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o", // Modell anpassen (z. B. "gpt-3.5-turbo")
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful assistant."),
                        Map.of("role", "user", "content", message)
                ),
                "max_tokens", 500
        );

        return webClient.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class) // API-Antwort als Map verarbeiten
                .map(response -> {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                    return choices.get(0).get("message").toString(); // Erste Antwort extrahieren
                })
                .doOnError(error -> System.err.println("Fehler bei OpenAI API: " + error.getMessage()));
    }
}
