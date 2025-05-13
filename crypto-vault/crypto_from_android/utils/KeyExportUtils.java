package io.celox.enigma3k1.utils;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;

import io.celox.enigma3k1.crypto.AesUtils;

/**
 * Utility-Klasse für den Export und Import von Schlüsseln mit optionalem Passwortschutz
 */
public class KeyExportUtils {

    private static final String TAG = "KeyExportUtils";
    private static final String KEY_EXPORT_PREFIX = "ENIGMA3K1_KEY_EXPORT";
    private static final String FILE_EXTENSION = ".json";
    private static final String ENCRYPTED_FILE_EXTENSION = ".ejson";

    /**
     * Exportiert alle Schlüssel in eine Datei
     *
     * @param context      Der App-Kontext
     * @param exportDir    Das Verzeichnis für den Export
     * @param password     Optional: Passwort für die Verschlüsselung (null für unverschlüsselt)
     * @return             Die exportierte Datei oder null bei Fehler
     */
    public static File exportKeys(Context context, File exportDir, String password) {
        try {
            // Alle Schlüssel als JSON-String exportieren
            String jsonData = KeyStorageUtils.exportAllKeys(context);
            
            // Dateinamen mit Zeitstempel erstellen
            String fileName = "enigma3k1_keys_" + System.currentTimeMillis();
            String fileExtension = (password != null && !password.isEmpty()) ? ENCRYPTED_FILE_EXTENSION : FILE_EXTENSION;
            File outputFile = new File(exportDir, fileName + fileExtension);
            
            // Sicherstellen, dass das Verzeichnis existiert
            if (!exportDir.exists()) {
                exportDir.mkdirs();
            }
            
            // Daten verschlüsseln, wenn ein Passwort angegeben wurde
            if (password != null && !password.isEmpty()) {
                exportEncrypted(jsonData, outputFile, password);
            } else {
                exportPlaintext(jsonData, outputFile);
            }
            
            return outputFile;
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Exportieren der Schlüssel: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Importiert Schlüssel aus einer Datei
     *
     * @param context    Der App-Kontext
     * @param uri        Die Uri der zu importierenden Datei
     * @param password   Optional: Passwort für verschlüsselte Dateien (null für unverschlüsselt)
     * @return           true bei Erfolg, false bei Fehler
     */
    public static boolean importKeys(Context context, Uri uri, String password) {
        try {
            // Datei-Inhalt als Bytes lesen
            byte[] fileContent = readFile(context, uri);
            
            // Prüfen, ob die Datei verschlüsselt ist
            String content = new String(fileContent, StandardCharsets.UTF_8);
            boolean isEncrypted = content.startsWith(KEY_EXPORT_PREFIX);
            
            String jsonData;
            
            // Entschlüsseln, falls nötig
            if (isEncrypted) {
                if (password == null || password.isEmpty()) {
                    Log.e(TAG, "Passwort benötigt für verschlüsselte Datei");
                    return false;
                }
                
                jsonData = decryptData(fileContent, password);
                if (jsonData == null) {
                    Log.e(TAG, "Entschlüsselung fehlgeschlagen");
                    return false;
                }
            } else {
                jsonData = content;
            }
            
            // Schlüssel importieren
            return KeyStorageUtils.importKeys(context, jsonData);
            
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Importieren der Schlüssel: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Exportiert die Daten unverschlüsselt
     */
    private static void exportPlaintext(String data, File file) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(data.getBytes(StandardCharsets.UTF_8));
        }
    }
    
    /**
     * Exportiert die Daten verschlüsselt mit einem Passwort
     */
    private static void exportEncrypted(String data, File file, String password) throws Exception {
        // Salt und IV generieren
        byte[] salt = AesUtils.generateRandomBytes(16);
        byte[] iv = AesUtils.generateRandomBytes(16);
        
        // Schlüssel aus Passwort ableiten
        SecretKey key = AesUtils.deriveKeyFromPassword(password, salt);
        
        // Daten verschlüsseln
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));
        byte[] encryptedData = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // Format: PREFIX|SALT_BASE64|IV_BASE64|ENCRYPTED_DATA_BASE64
        String encryptedContent = KEY_EXPORT_PREFIX + "|" +
                android.util.Base64.encodeToString(salt, android.util.Base64.NO_WRAP) + "|" +
                android.util.Base64.encodeToString(iv, android.util.Base64.NO_WRAP) + "|" +
                android.util.Base64.encodeToString(encryptedData, android.util.Base64.NO_WRAP);
        
        // In Datei speichern
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(encryptedContent.getBytes(StandardCharsets.UTF_8));
        }
    }
    
    /**
     * Entschlüsselt verschlüsselte Daten
     */
    private static String decryptData(byte[] data, String password) {
        try {
            // Inhalt als String parsen
            String content = new String(data, StandardCharsets.UTF_8);
            
            // Format prüfen: PREFIX|SALT_BASE64|IV_BASE64|ENCRYPTED_DATA_BASE64
            if (!content.startsWith(KEY_EXPORT_PREFIX)) {
                return null;
            }
            
            // Teile zerlegen
            String[] parts = content.split("\\|");
            if (parts.length != 4) {
                return null;
            }
            
            // Teile dekodieren
            byte[] salt = android.util.Base64.decode(parts[1], android.util.Base64.NO_WRAP);
            byte[] iv = android.util.Base64.decode(parts[2], android.util.Base64.NO_WRAP);
            byte[] encryptedData = android.util.Base64.decode(parts[3], android.util.Base64.NO_WRAP);
            
            // Schlüssel aus Passwort ableiten
            SecretKey key = AesUtils.deriveKeyFromPassword(password, salt);
            
            // Daten entschlüsseln
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));
            byte[] decryptedData = cipher.doFinal(encryptedData);
            
            // Als String zurückgeben
            return new String(decryptedData, StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Entschlüsseln: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Liest den Inhalt einer Datei
     */
    private static byte[] readFile(Context context, Uri uri) throws IOException {
        try (InputStream is = context.getContentResolver().openInputStream(uri);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            
            if (is == null) {
                throw new IOException("Konnte Datei nicht öffnen");
            }
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            
            return baos.toByteArray();
        }
    }
}