package io.celox.enigma3k1.models;

import java.util.Date;

/**
 * Modellklasse für RSA-Schlüsselpaare
 */
public class RsaKeyPair {
    private String id;
    private String name;
    private String publicKey;
    private String privateKey;
    private boolean isEncrypted;
    private int keySize;
    private Date createdAt;

    // Für verschlüsselte private Schlüssel
    private String salt;
    private String iv;

    public RsaKeyPair() {
        // Leerer Konstruktor
    }

    public RsaKeyPair(String id, String name, String publicKey, String privateKey,
                      boolean isEncrypted, int keySize, Date createdAt) {
        this.id = id;
        this.name = name;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.isEncrypted = isEncrypted;
        this.keySize = keySize;
        this.createdAt = createdAt;
    }

    // Konstruktor für verschlüsselte private Schlüssel
    public RsaKeyPair(String id, String name, String publicKey, String privateKey,
                      String salt, String iv, int keySize, Date createdAt) {
        this.id = id;
        this.name = name;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.salt = salt;
        this.iv = iv;
        this.isEncrypted = true;
        this.keySize = keySize;
        this.createdAt = createdAt;
    }

    // Getter und Setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getPrivateKey() {
        return privateKey;
    }

    public void setPrivateKey(String privateKey) {
        this.privateKey = privateKey;
    }

    public boolean isEncrypted() {
        return isEncrypted;
    }

    public void setEncrypted(boolean encrypted) {
        isEncrypted = encrypted;
    }

    public int getKeySize() {
        return keySize;
    }

    public void setKeySize(int keySize) {
        this.keySize = keySize;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }
}