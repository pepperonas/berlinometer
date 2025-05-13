package io.celox.enigma3k1.crypto;

import android.util.Base64;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;

/**
 * Utility-Klasse für RSA-Verschlüsselung
 */
public class RsaUtils {

    /**
     * Generiert ein neues RSA-Schlüsselpaar
     *
     * @param keySize Schlüsselgröße in Bit (1024, 2048, 4096)
     * @return String-Array mit [0] = Base64-encodierter Public Key, [1] = Base64-encodierter Private Key
     */
    public static String[] generateKeyPair(int keySize) throws Exception {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(keySize);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();

        // Public Key
        byte[] publicKeyBytes = keyPair.getPublic().getEncoded();
        String publicKeyBase64 = Base64.encodeToString(publicKeyBytes, Base64.DEFAULT);

        // Private Key
        byte[] privateKeyBytes = keyPair.getPrivate().getEncoded();
        String privateKeyBase64 = Base64.encodeToString(privateKeyBytes, Base64.DEFAULT);

        return new String[]{publicKeyBase64, privateKeyBase64};
    }

    /**
     * Verschlüsselt einen Text mit RSA
     *
     * @param plainText       Zu verschlüsselnder Text
     * @param publicKeyBase64 Base64-encodierter Public Key
     * @return Base64-encodierter verschlüsselter Text
     */
    public static String encrypt(String plainText, String publicKeyBase64) throws Exception {
        PublicKey publicKey = getPublicKeyFromBase64(publicKeyBase64);

        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);

        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes("UTF-8"));
        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT);
    }

    /**
     * Entschlüsselt einen Text mit RSA
     *
     * @param encryptedText    Base64-encodierter verschlüsselter Text
     * @param privateKeyBase64 Base64-encodierter Private Key
     * @return Entschlüsselter Text
     */
    public static String decrypt(String encryptedText, String privateKeyBase64) throws Exception {
        PrivateKey privateKey = getPrivateKeyFromBase64(privateKeyBase64);

        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.DECRYPT_MODE, privateKey);

        byte[] encryptedBytes = Base64.decode(encryptedText, Base64.DEFAULT);
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        return new String(decryptedBytes, "UTF-8");
    }

    /**
     * Konvertiert einen Base64-encodierten Public Key in ein PublicKey-Objekt
     */
    private static PublicKey getPublicKeyFromBase64(String publicKeyBase64) throws Exception {
        byte[] keyBytes = Base64.decode(publicKeyBase64, Base64.DEFAULT);
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(keySpec);
    }

    /**
     * Konvertiert einen Base64-encodierten Private Key in ein PrivateKey-Objekt
     */
    private static PrivateKey getPrivateKeyFromBase64(String privateKeyBase64) throws Exception {
        byte[] keyBytes = Base64.decode(privateKeyBase64, Base64.DEFAULT);
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(keySpec);
    }

    /**
     * Extrahiert den Base64-Teil aus einem PEM-formatierten Schlüssel
     */
    public static String extractBase64FromPem(String pemKey) {
        String base64Key = pemKey
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PUBLIC KEY-----", "")
                .replace("-----END RSA PUBLIC KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        return base64Key;
    }

    /**
     * Konvertiert einen Base64-Public-Key in das PEM-Format
     */
    public static String publicKeyToPem(String publicKeyBase64) {
        StringBuilder sb = new StringBuilder();
        sb.append("-----BEGIN PUBLIC KEY-----\n");

        // PEM-Format erfordert Zeilenumbrüche alle 64 Zeichen
        int i = 0;
        while (i < publicKeyBase64.length()) {
            if (i + 64 <= publicKeyBase64.length()) {
                sb.append(publicKeyBase64.substring(i, i + 64)).append("\n");
            } else {
                sb.append(publicKeyBase64.substring(i)).append("\n");
            }
            i += 64;
        }

        sb.append("-----END PUBLIC KEY-----");
        return sb.toString();
    }

    /**
     * Konvertiert einen Base64-Private-Key in das PEM-Format
     */
    public static String privateKeyToPem(String privateKeyBase64) {
        StringBuilder sb = new StringBuilder();
        sb.append("-----BEGIN PRIVATE KEY-----\n");

        // PEM-Format erfordert Zeilenumbrüche alle 64 Zeichen
        int i = 0;
        while (i < privateKeyBase64.length()) {
            if (i + 64 <= privateKeyBase64.length()) {
                sb.append(privateKeyBase64.substring(i, i + 64)).append("\n");
            } else {
                sb.append(privateKeyBase64.substring(i)).append("\n");
            }
            i += 64;
        }

        sb.append("-----END PRIVATE KEY-----");
        return sb.toString();
    }

    /**
     * Prüft, ob ein String ein gültiger öffentlicher RSA-Schlüssel ist
     * und führt zusätzliche Validierungen durch
     *
     * @param publicKeyBase64 Der zu prüfende öffentliche Schlüssel als Base64-String
     * @return true, wenn es ein gültiger Schlüssel ist, sonst false
     */
    public static boolean isValidPublicKey(String publicKeyBase64) {
        try {
            // Prüfen ob der String nicht leer ist
            if (publicKeyBase64 == null || publicKeyBase64.trim().isEmpty()) {
                return false;
            }
            
            // Versuche, den String als Base64 zu dekodieren
            byte[] keyBytes;
            try {
                keyBytes = Base64.decode(publicKeyBase64, Base64.DEFAULT);
                // Minimale Länge für einen RSA-Schlüssel überprüfen (zu kurze Schlüssel sind ungültig)
                if (keyBytes.length < 50) { // Ein gültiger RSA-Schlüssel ist typischerweise länger
                    return false;
                }
            } catch (IllegalArgumentException e) {
                // Kein gültiges Base64
                return false;
            }
            
            // Versuche, den Schlüssel in ein PublicKey-Objekt zu konvertieren
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(keySpec);
            
            // Verifiziere, dass es sich um einen RSA-Schlüssel handelt
            return "RSA".equals(publicKey.getAlgorithm());
        } catch (Exception e) {
            // Bei einer Exception ist der Schlüssel ungültig
            return false;
        }
    }

    /**
     * Klasse zum Speichern eines verschlüsselten Private Keys mit seinem Salt und IV
     */
    public static class EncryptedPrivateKey {
        private String encrypted;
        private String salt;
        private String iv;

        public EncryptedPrivateKey(String encrypted, String salt, String iv) {
            this.encrypted = encrypted;
            this.salt = salt;
            this.iv = iv;
        }

        public String getEncrypted() {
            return encrypted;
        }

        public String getSalt() {
            return salt;
        }

        public String getIv() {
            return iv;
        }
    }

    /**
     * Verschlüsselt einen privaten Schlüssel mit einem Passwort
     *
     * @param privateKeyBase64 Base64-encodierter privater Schlüssel
     * @param password         Passwort für die Verschlüsselung
     * @return EncryptedPrivateKey mit dem verschlüsselten Schlüssel, Salt und IV
     */
    public static EncryptedPrivateKey encryptPrivateKey(String privateKeyBase64, String password) throws Exception {
        // AesUtils für die Passwortverschlüsselung verwenden
        // Erzeuge Salt und IV
        byte[] salt = AesUtils.generateRandomBytes(16);
        byte[] iv = AesUtils.generateRandomBytes(16);

        // Schlüssel aus Passwort ableiten
        SecretKey key = AesUtils.deriveKeyFromPassword(password, salt);

        // Verschlüsseln
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(iv));

        byte[] privateKeyBytes = Base64.decode(privateKeyBase64, Base64.DEFAULT);
        byte[] encryptedBytes = cipher.doFinal(privateKeyBytes);

        // Als Base64 kodieren
        String encryptedBase64 = Base64.encodeToString(encryptedBytes, Base64.DEFAULT);
        String saltBase64 = Base64.encodeToString(salt, Base64.DEFAULT);
        String ivBase64 = Base64.encodeToString(iv, Base64.DEFAULT);

        return new EncryptedPrivateKey(encryptedBase64, saltBase64, ivBase64);
    }

    /**
     * Entschlüsselt einen verschlüsselten privaten Schlüssel mit einem Passwort
     *
     * @param encryptedKey Der verschlüsselte Schlüssel mit Salt und IV
     * @param password     Das Passwort für die Entschlüsselung
     * @return Der entschlüsselte private Schlüssel als Base64-String
     */
    public static String decryptPrivateKey(EncryptedPrivateKey encryptedKey, String password) throws Exception {
        // Parameter dekodieren
        byte[] encryptedBytes = Base64.decode(encryptedKey.getEncrypted(), Base64.DEFAULT);
        byte[] salt = Base64.decode(encryptedKey.getSalt(), Base64.DEFAULT);
        byte[] iv = Base64.decode(encryptedKey.getIv(), Base64.DEFAULT);

        // Schlüssel aus Passwort ableiten
        SecretKey key = AesUtils.deriveKeyFromPassword(password, salt);

        // Entschlüsseln
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, key, new IvParameterSpec(iv));

        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

        // Als Base64-String zurückgeben
        return Base64.encodeToString(decryptedBytes, Base64.DEFAULT);
    }
}