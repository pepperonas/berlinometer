package io.celox.enigma3k1.crypto;

import android.util.Base64;

import java.security.SecureRandom;
import java.security.spec.KeySpec;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Utility-Klasse für AES-Verschlüsselung
 */
public class AesUtils {

    // Konstanten
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128; // 16 Bytes
    private static final int GCM_IV_LENGTH = 12; // 12 Bytes
    private static final int PBKDF2_ITERATIONS = 10000;

    /**
     * Generiert einen zufälligen AES-Schlüssel
     *
     * @param keySize Schlüsselgröße in Bit (128, 192, 256)
     * @return Base64-encodierter Schlüssel
     */
    public static String generateKey(int keySize) throws Exception {
        // Schlüsselgröße validieren
        if (keySize != 128 && keySize != 192 && keySize != 256) {
            throw new IllegalArgumentException("Schlüsselgröße muss 128, 192 oder 256 Bit sein");
        }

        // Zufälliger Schlüssel
        byte[] key = generateRandomBytes(keySize / 8);

        // Als Base64 kodieren
        return Base64.encodeToString(key, Base64.DEFAULT);
    }

    /**
     * Generiert zufällige Bytes mit kryptographisch sicherer Zufallszahlen
     *
     * @param length Anzahl der zu generierenden Bytes
     * @return Array mit zufälligen Bytes
     */
    public static byte[] generateRandomBytes(int length) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return bytes;
    }

    /**
     * Verschlüsselt einen String mit AES-GCM
     *
     * @param plaintext Zu verschlüsselnder Text
     * @param password Passwort oder AES-Schlüssel als Base64-String
     * @param keySize Schlüsselgröße in Bit (128, 192, 256)
     * @return Verschlüsselter Text als Base64-String mit IV
     */
    public static String encrypt(String plaintext, String password, int keySize) throws Exception {
        // Salt und IV generieren
        byte[] salt = generateRandomBytes(16);
        byte[] iv = generateRandomBytes(GCM_IV_LENGTH);

        // Schlüssel aus Passwort ableiten oder direkten Schlüssel verwenden
        SecretKey key;
        if (isBase64Key(password, keySize)) {
            key = getKeyFromBase64(password);
        } else {
            key = deriveKeyFromPassword(password, salt);
        }

        // Verschlüsseln
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

        // Salt als zusätzliche Daten (AAD) hinzufügen
        cipher.updateAAD(salt);

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes("UTF-8"));

        // Salt, IV und Ciphertext zusammenführen
        byte[] result = new byte[salt.length + iv.length + ciphertext.length];
        System.arraycopy(salt, 0, result, 0, salt.length);
        System.arraycopy(iv, 0, result, salt.length, iv.length);
        System.arraycopy(ciphertext, 0, result, salt.length + iv.length, ciphertext.length);

        // Als Base64 zurückgeben
        return Base64.encodeToString(result, Base64.DEFAULT);
    }

    /**
     * Entschlüsselt einen mit AES-GCM verschlüsselten String
     *
     * @param encryptedText Verschlüsselter Text als Base64-String mit IV
     * @param password Passwort oder AES-Schlüssel als Base64-String
     * @param keySize Schlüsselgröße in Bit (128, 192, 256)
     * @return Entschlüsselter Text
     */
    public static String decrypt(String encryptedText, String password, int keySize) throws Exception {
        // Base64 dekodieren
        byte[] encryptedData = Base64.decode(encryptedText, Base64.DEFAULT);

        // Salt, IV und Ciphertext extrahieren
        byte[] salt = new byte[16];
        byte[] iv = new byte[GCM_IV_LENGTH];
        byte[] ciphertext = new byte[encryptedData.length - salt.length - iv.length];

        System.arraycopy(encryptedData, 0, salt, 0, salt.length);
        System.arraycopy(encryptedData, salt.length, iv, 0, iv.length);
        System.arraycopy(encryptedData, salt.length + iv.length, ciphertext, 0, ciphertext.length);

        // Schlüssel aus Passwort ableiten oder direkten Schlüssel verwenden
        SecretKey key;
        if (isBase64Key(password, keySize)) {
            key = getKeyFromBase64(password);
        } else {
            key = deriveKeyFromPassword(password, salt);
        }

        // Entschlüsseln
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

        // Salt als zusätzliche Daten (AAD) hinzufügen
        cipher.updateAAD(salt);

        byte[] decryptedBytes = cipher.doFinal(ciphertext);
        return new String(decryptedBytes, "UTF-8");
    }

    /**
     * Leitet einen Schlüssel aus einem Passwort und Salt ab
     *
     * @param password Das Passwort
     * @param salt Das Salt (sollte 16 Bytes sein)
     * @return Der abgeleitete Schlüssel
     */
    public static SecretKey deriveKeyFromPassword(String password, byte[] salt) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, PBKDF2_ITERATIONS, 256);
        return new SecretKeySpec(factory.generateSecret(spec).getEncoded(), "AES");
    }

    /**
     * Prüft, ob ein Passwort ein gültiger Base64-AES-Schlüssel ist
     */
    private static boolean isBase64Key(String password, int keySize) {
        try {
            byte[] keyBytes = Base64.decode(password, Base64.DEFAULT);
            return keyBytes.length == keySize / 8;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Konvertiert einen Base64-String in einen SecretKey
     */
    private static SecretKey getKeyFromBase64(String base64Key) throws Exception {
        byte[] keyBytes = Base64.decode(base64Key, Base64.DEFAULT);
        return new SecretKeySpec(keyBytes, "AES");
    }
}