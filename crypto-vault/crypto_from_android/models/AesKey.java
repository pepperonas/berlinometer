package io.celox.enigma3k1.models;

import java.util.Date;

/**
 * Modellklasse für AES-Schlüssel
 */
public class AesKey {
    private String id;
    private String name;
    private String value;
    private int keySize;
    private String type; // "text-encryption" oder "file-encryption"
    private Date createdAt;

    public AesKey() {
        // Leerer Konstruktor
    }

    public AesKey(String id, String name, String value, int keySize, String type, Date createdAt) {
        this.id = id;
        this.name = name;
        this.value = value;
        this.keySize = keySize;
        this.type = type;
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

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public int getKeySize() {
        return keySize;
    }

    public void setKeySize(int keySize) {
        this.keySize = keySize;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}