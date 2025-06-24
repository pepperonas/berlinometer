package io.celox.application.views;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import com.vaadin.flow.component.DetachEvent;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.StreamResource;

import java.io.ByteArrayInputStream;
import java.util.Base64;

@PageTitle("Kamera")
@Route(value = "camera")
public class CameraView extends VerticalLayout {

    private final Div cameraContainer = new Div();
    private final Button captureButton = new Button("Foto aufnehmen");
    private final Button resetButton = new Button("Zurücksetzen");
    private final Button switchCameraButton = new Button("Kamera wechseln");
    private final Image capturedImage = new Image();
    private final Div imageContainer = new Div();

    public CameraView() {
        addClassName("camera-view");
        setSizeFull();

        cameraContainer.setId("camera");
        cameraContainer.setWidth("640px");
        cameraContainer.setHeight("480px");

        imageContainer.add(capturedImage);
        capturedImage.setVisible(false);

        resetButton.setVisible(false);

        captureButton.addClickListener(e -> captureImage());
        resetButton.addClickListener(e -> resetCamera());
        switchCameraButton.addClickListener(e -> switchCamera());

        add(cameraContainer, captureButton, switchCameraButton, resetButton, imageContainer);

        // JavaScript zur Initialisierung der Kamera ausführen - mit Hinterkamera
        initializeCamera(true);
    }

    private void initializeCamera(boolean useBackCamera) {
        UI.getCurrent().getPage().executeJs(
                "return new Promise(resolve => {" +
                "  if (window.cameraStream) {" +
                "    window.cameraStream.getTracks().forEach(track => track.stop());" +
                "  }" +
                "  const video = window.cameraVideo || document.createElement('video');" +
                "  if (!window.cameraVideo) {" +
                "    video.style.width = '100%';" +
                "    video.style.height = '100%';" +
                "    video.autoplay = true;" +
                "    document.getElementById('camera').appendChild(video);" +
                "    window.cameraVideo = video;" +
                "  }" +
                "  const constraints = {" +
                "    video: {" +
                "      facingMode: " + (useBackCamera ? "'environment'" : "'user'") + " // 'environment' für Hinterkamera, 'user' für Frontkamera" +
                "    }" +
                "  };" +
                "  navigator.mediaDevices.getUserMedia(constraints)" +
                "    .then(stream => {" +
                "      video.srcObject = stream;" +
                "      window.cameraStream = stream;" +
                "      window.cameraInitialized = true;" +
                "      window.usingBackCamera = " + useBackCamera + ";" +
                "      resolve(true);" +
                "    })" +
                "    .catch(err => {" +
                "      console.error('Kamera konnte nicht initialisiert werden:', err);" +
                "      resolve(false);" +
                "    });" +
                "});"
        );
    }

    private void switchCamera() {
        UI.getCurrent().getPage().executeJs(
                "return window.usingBackCamera !== undefined ? !window.usingBackCamera : false;"
        ).then(Boolean.class, useBackCamera -> {
            initializeCamera(useBackCamera);
        });
    }

    private void captureImage() {
        UI.getCurrent().getPage().executeJs(
                "return new Promise(resolve => {" +
                "const video = window.cameraVideo;" +
                "if (!video) return resolve('');" +
                "const canvas = document.createElement('canvas');" +
                "canvas.width = video.videoWidth;" +
                "canvas.height = video.videoHeight;" +
                "const ctx = canvas.getContext('2d');" +
                "ctx.drawImage(video, 0, 0);" +
                "const imageData = canvas.toDataURL('image/png');" +
                "resolve(imageData);" +
                "});"
        ).then(String.class, imageData -> {
            if (imageData != null && !imageData.isEmpty()) {
                // Base64-String aus dem Data-URL extrahieren
                String base64Image = imageData.substring(imageData.indexOf(",") + 1);
                byte[] imageBytes = Base64.getDecoder().decode(base64Image);

                // Bild anzeigen
                StreamResource resource = new StreamResource("captured.png",
                        () -> new ByteArrayInputStream(imageBytes));
                capturedImage.setSrc(resource);
                capturedImage.setVisible(true);

                // UI-Elemente anpassen
                captureButton.setVisible(false);
                switchCameraButton.setVisible(false);
                resetButton.setVisible(true);

                // Hier könnten Sie nun die Bildverarbeitung implementieren
                processImage(imageBytes);
            }
        });
    }

    private void resetCamera() {
        capturedImage.setVisible(false);
        captureButton.setVisible(true);
        switchCameraButton.setVisible(true);
        resetButton.setVisible(false);
    }

    private void processImage(byte[] imageData) {
        // Hier implementieren Sie Ihre Bildverarbeitung
        // Beispiel: Bilder an einen Server senden

        /*
        // Beispiel für einen HTTP-POST Request mit Bildverarbeitung auf Serverseite
        String uploadUrl = "/api/images/process";

        UI.getCurrent().getPage().executeJs(
            "const formData = new FormData();" +
            "const blob = new Blob([new Uint8Array($0)], {type: 'image/png'});" +
            "formData.append('image', blob, 'image.png');" +
            "return fetch($1, {" +
            "  method: 'POST'," +
            "  body: formData" +
            "})" +
            ".then(response => response.json())" +
            ".then(data => { return data; })" +
            ".catch(error => { console.error('Error:', error); return null; });",
            Json.create(imageData), uploadUrl
        ).then(jsonResponse -> {
            // Verarbeiten Sie hier die Antwort vom Server
            System.out.println("Serverantwort: " + jsonResponse);
        });
        */
    }

    @Override
    protected void onDetach(DetachEvent detachEvent) {
        // Kamera-Stream beenden, wenn die View verlassen wird
        UI.getCurrent().getPage().executeJs(
                "if (window.cameraStream) {" +
                "window.cameraStream.getTracks().forEach(track => track.stop());" +
                "window.cameraInitialized = false;" +
                "}"
        );
        super.onDetach(detachEvent);
    }
}