package io.celox.application.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaadin.flow.server.VaadinRequest;
import com.vaadin.flow.server.VaadinService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import io.celox.application.model.IpLocationResponse;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class Utils {

    private static final Logger LOGGER = LoggerFactory.getLogger(Utils.class);

    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static String getClientIpAddress() {
        VaadinRequest request = VaadinService.getCurrentRequest();
        // X-Forwarded-For Header prüfen (falls die Anwendung hinter einem Proxy läuft)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Nimm die erste IP-Adresse in der Liste
            return xForwardedFor.split(",")[0].trim();
        }

        // Falls kein X-Forwarded-For Header vorhanden ist, verwende die Remote-Adresse
        return request.getRemoteAddr();
    }

    public static IpLocationResponse getIpLocationInfo(String ipAddress) {
        try {
            String apiUrl = String.format(Const.IP_API_URL, ipAddress);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), IpLocationResponse.class);
            } else {
                LOGGER.warn("API-Anfrage fehlgeschlagen mit Statuscode: " + response.statusCode());
                return null;
            }
        } catch (IOException | InterruptedException e) {
            LOGGER.error("Fehler bei der API-Anfrage: " + e.getMessage());
            return null;
        }
    }

}
