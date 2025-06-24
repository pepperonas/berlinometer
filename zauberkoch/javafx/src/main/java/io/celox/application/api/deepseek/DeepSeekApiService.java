package io.celox.application.api.deepseek;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

import io.celox.application.utils.Const;
import reactor.core.publisher.Mono;

@Service
public class DeepSeekApiService {

    private final WebClient webClient;

    public DeepSeekApiService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.deepseek.com/v1") // Basis-URL der API
                .defaultHeader(HttpHeaders.AUTHORIZATION, Const.DS_API_KEY)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public Mono<Map<String, Object>> queryDeepSeek(String inputText) {
        String endpoint = "/generate";  // Stelle sicher, dass dieser Endpoint existiert

        Map<String, String> requestBody = Map.of("query", inputText);

        return webClient.post()
                .uri(endpoint)
                .bodyValue(requestBody)  // Stelle sicher, dass der Body korrekt ist
                .retrieve()
                .onStatus(status -> status.is4xxClientError(), response ->
                        Mono.error(new RuntimeException("Client-Fehler: " + response.statusCode()))
                )
                .onStatus(status -> status.is5xxServerError(), response ->
                        Mono.error(new RuntimeException("Server-Fehler: " + response.statusCode()))
                )
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnError(error -> System.err.println("DeepSeek API Fehler: " + error.getMessage()));
    }

}

