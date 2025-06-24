package io.celox.application.api;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class PayPalSubscriptionInfo {

    private static final Logger LOGGER = LoggerFactory.getLogger(PayPalSubscriptionInfo.class);

    private static final String PAYPAL_API_BASE = "https://api.paypal.com"; // Für Live-Umgebung
    // private static final String PAYPAL_API_BASE = "https://api.sandbox.paypal.com"; // Für Sandbox-Umgebung
    private static final String CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID"; // Ersetze mit deinem Client ID
    private static final String CLIENT_SECRET = "YOUR_PAYPAL_CLIENT_SECRET"; // Ersetze mit deinem Client Secret

    private String accessToken;

    public PayPalSubscriptionInfo() {
        // Access Token beim Initialisieren holen
        this.accessToken = getAccessToken();
    }

    /**
     * Holt ein Access Token von PayPal.
     */
    private String getAccessToken() {
        try {
            HttpClient client = HttpClient.newHttpClient();

            // Basic Auth: client_id:client_secret
            String credentials = CLIENT_ID + ":" + CLIENT_SECRET;
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(PAYPAL_API_BASE + "/v1/oauth2/token"))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JSONObject jsonResponse = new JSONObject(response.body());
                String token = jsonResponse.getString("access_token");
                LOGGER.info("Access Token erfolgreich abgerufen: {}", token);
                return token;
            } else {
                LOGGER.error("Fehler beim Abrufen des Access Tokens: Status {}, Response: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            LOGGER.error("Fehler beim Abrufen des Access Tokens", e);
            return null;
        }
    }

    /**
     * Sendet einen GET-Request an die PayPal-API.
     */
    private JSONObject sendGetRequest(String url) {
        if (accessToken == null) {
            LOGGER.error("Kein Access Token verfügbar");
            return null;
        }

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return new JSONObject(response.body());
            } else {
                LOGGER.error("Fehler bei GET-Request: Status {}, Response: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            LOGGER.error("Fehler beim Senden des GET-Requests an {}", url, e);
            return null;
        }
    }

    /**
     * Sendet einen POST-Request an die PayPal-API (z. B. für suspend/cancel).
     */
    public boolean sendPostRequest(String subscriptionId, String action) {
        if (accessToken == null) {
            LOGGER.error("Kein Access Token verfügbar");
            return false;
        }

        try {
            String url = PAYPAL_API_BASE + "/v1/billing/subscriptions/" + subscriptionId + "/" + action;
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}")) // Leerer Body für suspend/cancel
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 204) { // 204 No Content ist der erwartete Status für suspend/cancel
                LOGGER.info("Aktion {} für Subscription {} erfolgreich", action, subscriptionId);
                return true;
            } else {
                LOGGER.error("Fehler bei POST-Request ({}): Status {}, Response: {}", action, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            LOGGER.error("Fehler beim Senden des POST-Requests für Aktion {} und Subscription {}", action, subscriptionId, e);
            return false;
        }
    }

    /**
     * Ruft den Status einer Subscription ab.
     */
    public String getSubscriptionStatus(String subscriptionId) {
        if (subscriptionId == null || subscriptionId.isEmpty()) {
            return null;
        }

        String url = PAYPAL_API_BASE + "/v1/billing/subscriptions/" + subscriptionId;
        JSONObject response = sendGetRequest(url);
        if (response != null) {
            String status = null;
            try {
                status = response.getString("status");
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            LOGGER.info("Subscription-Status für {}: {}", subscriptionId, status);
            return status;
        }
        return null;
    }

    /**
     * Ruft die nächste Abrechnungszeit (next_billing_time) einer Subscription ab.
     */
    public String getNextBillingTime(String subscriptionId) {
        if (subscriptionId == null || subscriptionId.isEmpty()) {
            return null;
        }

        String url = PAYPAL_API_BASE + "/v1/billing/subscriptions/" + subscriptionId;
        JSONObject response = sendGetRequest(url);
        if (response != null && response.has("billing_info")) {
            JSONObject billingInfo = null;
            try {
                billingInfo = response.getJSONObject("billing_info");
            } catch (JSONException e) {
                throw new RuntimeException(e);
            }
            if (billingInfo.has("next_billing_time")) {
                String nextBillingTime = null;
                try {
                    nextBillingTime = billingInfo.getString("next_billing_time");
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                LOGGER.info("Next billing time für Subscription {}: {}", subscriptionId, nextBillingTime);
                return nextBillingTime;
            }
        }
        LOGGER.warn("Keine next_billing_time für Subscription {} gefunden", subscriptionId);
        return null;
    }
}