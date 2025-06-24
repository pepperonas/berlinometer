package io.celox.application.dialogs;

import com.google.zxing.WriterException;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H4;
import com.vaadin.flow.component.html.Image;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.page.PendingJavaScriptResult;
import com.vaadin.flow.server.StreamResource;

import org.jetbrains.annotations.NotNull;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import io.celox.application.custom.pulse_effect.ButtonWithPulseEffect;
import io.celox.application.utils.QrCodeGenerator;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class DialogShareQrCode {

    private Dialog mDialog;

    public DialogShareQrCode(UI ui, String url) {
        openDialog(ui, url);
    }

    private void openDialog(UI ui, String url) {
        mDialog = new Dialog();
        VerticalLayout layout = new VerticalLayout();
        H2 h2 = new H2("Teilen");
        layout.add(h2);

        String jsCode = "return localStorage.getItem('app-theme') || 'light';";

        // JavaScript ausführen
        PendingJavaScriptResult result = ui.getCurrent().getPage().executeJs(jsCode);

        // Rückgabewert verarbeiten
        result.then(jsonValue -> {
            String theme = jsonValue.asString();
            Image qrCode;
            try {
                if (theme.equals("dark")) {
                    qrCode = createInvertedQrCode(url);
                } else {
                    qrCode = createQrCode(url);
                }
                layout.add(qrCode);
                H4 msg = new H4("Lass andere diesen QR-Code scannen, um die App zu teilen!");
                layout.add(msg);
                mDialog.add(layout);
                layout.add(new ButtonWithPulseEffect("Schließen", buttonClickEvent -> {
                    mDialog.close();
                }));
                mDialog.open();
            } catch (IOException | WriterException e) {
                // Fehler ordnungsgemäß loggen anstatt RuntimeException zu werfen
                System.err.println("Fehler beim Erstellen des QR-Codes: " + e.getMessage());
                // Optional: Eine Fehlermeldung anzeigen
                layout.add(new H4("QR-Code konnte nicht erstellt werden."));
                layout.add(new ButtonWithPulseEffect("Schließen", buttonClickEvent -> {
                    mDialog.close();
                }));
                mDialog.add(layout);
                mDialog.open();
            }
        });
    }

    private static @NotNull Image createQrCode(String url) throws WriterException, IOException {
        final int QR_CODE_SIZE = 200;
        byte[] qrCodeImage = QrCodeGenerator.generateQrCode(url, QR_CODE_SIZE, QR_CODE_SIZE);
        try (ByteArrayInputStream bis = new ByteArrayInputStream(qrCodeImage)) {
            StreamResource resource = new StreamResource("qrcode.png", () -> {
                try {
                    return new ByteArrayInputStream(qrCodeImage);
                } catch (Exception e) {
                    return null; // oder Fehlerbehandlung
                }
            });
            return new Image(resource, "QR-Code zum Teilen");
        }
    }

    public static Image createInvertedQrCode(String url) throws IOException, WriterException {
        final int QR_CODE_SIZE = 200;

        // QR-Code generieren
        byte[] qrCodeImage = QrCodeGenerator.generateQrCode(url, QR_CODE_SIZE, QR_CODE_SIZE);

        try (ByteArrayInputStream bis = new ByteArrayInputStream(qrCodeImage);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Bild aus byte[] laden
            BufferedImage originalImage = ImageIO.read(bis);
            if (originalImage == null) {
                throw new IOException("Konnte das QR-Code-Bild nicht laden.");
            }

            // Neues Bild mit Hintergrundfarbe #212121 erstellen
            BufferedImage invertedImage = new BufferedImage(QR_CODE_SIZE, QR_CODE_SIZE, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = invertedImage.createGraphics();

            // Setze den gesamten Hintergrund auf #212121
            g2d.setColor(new Color(33, 33, 33)); // #212121
            g2d.fillRect(0, 0, QR_CODE_SIZE, QR_CODE_SIZE);

            // Invertiere nur die QR-Code-Muster, behalte den Hintergrund
            for (int x = 0; x < QR_CODE_SIZE; x++) {
                for (int y = 0; y < QR_CODE_SIZE; y++) {
                    int rgba = originalImage.getRGB(x, y);
                    // Prüfe, ob der Pixel nicht transparent ist (Alpha > 0)
                    if (((rgba >> 24) & 0xFF) > 0) {
                        // Invertieren, aber nur, wenn es kein weißer Hintergrund ist
                        if ((rgba & 0x00FFFFFF) != 0x00FFFFFF) { // Nur nicht-weiße Pixel invertieren
                            int invertedRgba = (~rgba & 0x00FFFFFF) | (rgba & 0xFF000000);
                            invertedImage.setRGB(x, y, invertedRgba);
                        } else {
                            // Behalte den #212121-Hintergrund für weiße Pixel
                            invertedImage.setRGB(x, y, 0xFF212121); // #212121 mit voller Opacity
                        }
                    }
                }
            }
            g2d.dispose();

            // In byte[] umwandeln
            ImageIO.write(invertedImage, "png", baos);
            byte[] invertedQrCodeImage = baos.toByteArray();

            // StreamResource erstellen
            StreamResource resource = new StreamResource("qrcode.png", () -> new ByteArrayInputStream(invertedQrCodeImage));

            // Image-Komponente zurückgeben
            return new Image(resource, "Invertierter QR-Code zum Teilen");
        }
    }
}