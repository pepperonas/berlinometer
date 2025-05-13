package io.celox.enigma3k1.crypto;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Utility-Klasse für die Verschlüsselung und Entschlüsselung von Dateien
 */
public class FileUtils {

    private static final String TAG = "FileUtils";
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128; // in Bits
    private static final String FILE_EXTENSION = ".enc";

    /**
     * Verschlüsselt eine Datei mit AES-GCM
     *
     * @param context Kontext
     * @param sourceUri Uri der zu verschlüsselnden Datei
     * @param destinationFile Ziel-Datei für die verschlüsselte Ausgabe
     * @param password Passwort oder Schlüssel
     * @param keySize Schlüsselgröße in Bits (128, 192 oder 256)
     * @param listener Callback für Fortschrittsanzeige
     * @return true bei Erfolg, false bei Fehler
     */
    public static boolean encryptFile(Context context, Uri sourceUri, File destinationFile,
                                      String password, int keySize, ProgressListener listener) {
        InputStream inputStream = null;
        OutputStream outputStream = null;

        try {
            // Schlüssel aus Passwort ableiten
            byte[] key = deriveKey(password, keySize);

            // IV generieren
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // AES-GCM Verschlüsselung einrichten
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            SecretKey secretKey = new SecretKeySpec(key, "AES");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Streams öffnen
            inputStream = context.getContentResolver().openInputStream(sourceUri);
            outputStream = new FileOutputStream(destinationFile);

            // IV in Ausgabedatei schreiben
            outputStream.write(iv);

            // Datei in Blöcken lesen und verschlüsseln
            byte[] buffer = new byte[8192];
            byte[] encryptedBuffer;
            int bytesRead;
            long totalBytesRead = 0;
            long fileSize = getFileSize(context, sourceUri);

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                encryptedBuffer = cipher.update(buffer, 0, bytesRead);
                if (encryptedBuffer != null) {
                    outputStream.write(encryptedBuffer);
                }

                totalBytesRead += bytesRead;
                if (listener != null && fileSize > 0) {
                    int progress = (int) ((totalBytesRead * 100) / fileSize);
                    listener.onProgress(progress);
                }
            }

            // Finalisieren der Verschlüsselung
            encryptedBuffer = cipher.doFinal();
            if (encryptedBuffer != null) {
                outputStream.write(encryptedBuffer);
            }

            return true;
        } catch (Exception e) {
            Log.e(TAG, "Fehler bei der Dateiverschlüsselung: " + e.getMessage());
            e.printStackTrace();
            return false;
        } finally {
            // Streams schließen
            closeQuietly(inputStream);
            closeQuietly(outputStream);
        }
    }

    /**
     * Entschlüsselt eine Datei mit AES-GCM
     *
     * @param context Kontext
     * @param sourceUri Uri der verschlüsselten Datei
     * @param destinationFile Ziel-Datei für die entschlüsselte Ausgabe
     * @param password Passwort oder Schlüssel
     * @param keySize Schlüsselgröße in Bits (128, 192 oder 256)
     * @param listener Callback für Fortschrittsanzeige
     * @return true bei Erfolg, false bei Fehler
     */
    public static boolean decryptFile(Context context, Uri sourceUri, File destinationFile,
                                      String password, int keySize, ProgressListener listener) {
        InputStream inputStream = null;
        OutputStream outputStream = null;

        try {
            // Schlüssel aus Passwort ableiten
            byte[] key = deriveKey(password, keySize);

            // Streams öffnen
            inputStream = context.getContentResolver().openInputStream(sourceUri);
            outputStream = new FileOutputStream(destinationFile);

            // IV aus Datei lesen
            byte[] iv = new byte[GCM_IV_LENGTH];
            if (inputStream.read(iv) != GCM_IV_LENGTH) {
                throw new IOException("Datei zu kurz oder kein gültiges Format");
            }

            // AES-GCM Entschlüsselung einrichten
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            SecretKey secretKey = new SecretKeySpec(key, "AES");
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Datei in Blöcken lesen und entschlüsseln
            byte[] buffer = new byte[8192];
            byte[] decryptedBuffer;
            int bytesRead;
            long totalBytesRead = 0;
            long fileSize = getFileSize(context, sourceUri) - GCM_IV_LENGTH;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                decryptedBuffer = cipher.update(buffer, 0, bytesRead);
                if (decryptedBuffer != null) {
                    outputStream.write(decryptedBuffer);
                }

                totalBytesRead += bytesRead;
                if (listener != null && fileSize > 0) {
                    int progress = (int) ((totalBytesRead * 100) / fileSize);
                    listener.onProgress(progress);
                }
            }

            // Finalisieren der Entschlüsselung
            decryptedBuffer = cipher.doFinal();
            if (decryptedBuffer != null) {
                outputStream.write(decryptedBuffer);
            }

            return true;
        } catch (Exception e) {
            Log.e(TAG, "Fehler bei der Dateientschlüsselung: " + e.getMessage());
            e.printStackTrace();
            return false;
        } finally {
            // Streams schließen
            closeQuietly(inputStream);
            closeQuietly(outputStream);
        }
    }

    /**
     * Extrahiert den Dateinamen aus einer Uri
     */
    public static String getFileName(Context context, Uri uri) {
        String result = null;
        try {
            if (uri.getScheme().equals("content")) {
                android.database.Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
                try {
                    if (cursor != null && cursor.moveToFirst()) {
                        int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                        if (nameIndex != -1) {
                            result = cursor.getString(nameIndex);
                        }
                    }
                } finally {
                    if (cursor != null) {
                        cursor.close();
                    }
                }
            }
            if (result == null) {
                // Fallback für file: oder andere Uri-Schemen
                result = uri.getPath();
                int cut = result.lastIndexOf('/');
                if (cut != -1) {
                    result = result.substring(cut + 1);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Ermitteln des Dateinamens: " + e.getMessage());
        }
        return result;
    }

    /**
     * Ermittelt die Größe einer Datei aus einer Uri
     */
    public static long getFileSize(Context context, Uri uri) {
        try {
            if (uri.getScheme().equals("content")) {
                android.database.Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
                try {
                    if (cursor != null && cursor.moveToFirst()) {
                        int sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE);
                        if (sizeIndex != -1) {
                            return cursor.getLong(sizeIndex);
                        }
                    }
                } finally {
                    if (cursor != null) {
                        cursor.close();
                    }
                }
            }

            // Fallback: Manuelles Lesen der Dateigröße
            InputStream inputStream = context.getContentResolver().openInputStream(uri);
            try {
                return inputStream.available();
            } finally {
                closeQuietly(inputStream);
            }
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Ermitteln der Dateigröße: " + e.getMessage());
            return -1;
        }
    }

    /**
     * Liest den Inhalt einer Datei in einen ByteBuffer
     */
    public static byte[] readFile(Context context, Uri uri) throws IOException {
        InputStream inputStream = null;
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        try {
            inputStream = context.getContentResolver().openInputStream(uri);
            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            return outputStream.toByteArray();
        } finally {
            closeQuietly(inputStream);
            closeQuietly(outputStream);
        }
    }

    /**
     * Ableiten eines Schlüssels aus einem Passwort mit SHA-256
     */
    private static byte[] deriveKey(String password, int keySize) throws Exception {
        // Überprüfen, ob das Passwort bereits ein Hex-Schlüssel der richtigen Länge ist
        if (isHexString(password) && password.length() == keySize / 4) {
            return hexStringToByteArray(password);
        }

        // Ansonsten Passwort hashen, um Schlüssel abzuleiten
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(password.getBytes("UTF-8"));

        // Auf die richtige Schlüsselgröße zuschneiden
        return Arrays.copyOf(hash, keySize / 8);
    }

    /**
     * Konvertiert einen Hex-String in ein Byte-Array
     */
    private static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }

    /**
     * Überprüft, ob ein String ein gültiger Hex-String ist
     */
    private static boolean isHexString(String s) {
        return s.matches("[0-9a-fA-F]+");
    }

    /**
     * Schließt einen Stream ohne Exceptions zu werfen
     */
    private static void closeQuietly(AutoCloseable closeable) {
        if (closeable != null) {
            try {
                closeable.close();
            } catch (Exception e) {
                // Ignorieren
            }
        }
    }

    /**
     * Interface für Fortschrittsanzeige
     */
    public interface ProgressListener {
        void onProgress(int progress);
    }
}