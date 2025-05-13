package io.celox.enigma3k1.models;

import android.net.Uri;

import java.io.File;

/**
 * Modellklasse für verschlüsselte Dateien
 */
public class EncryptedFile {

    public static final String STATUS_READY = "ready";
    public static final String STATUS_PROCESSING = "processing";
    public static final String STATUS_COMPLETED = "completed";
    public static final String STATUS_ERROR = "error";

    private String id;                 // Eindeutige ID der Datei
    private Uri uri;                   // URI der Quelldatei
    private String fileName;           // Name der Datei
    private long fileSize;             // Größe der Datei in Bytes
    private String status;             // Status: ready, processing, completed, error
    private int progress;              // Fortschritt in Prozent (0-100)
    private boolean forDecryption;     // Ist die Datei zum Entschlüsseln?
    private File outputFile;           // Ausgabedatei nach Verschlüsselung/Entschlüsselung

    public EncryptedFile() {
        // Leerer Konstruktor
    }

    public EncryptedFile(String id, Uri uri, String fileName, long fileSize, String status, boolean forDecryption) {
        this.id = id;
        this.uri = uri;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.status = status;
        this.progress = 0;
        this.forDecryption = forDecryption;
    }

    // Getter und Setter

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Uri getUri() {
        return uri;
    }

    public void setUri(Uri uri) {
        this.uri = uri;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getProgress() {
        return progress;
    }

    public void setProgress(int progress) {
        this.progress = progress;
    }

    public boolean isForDecryption() {
        return forDecryption;
    }

    public void setForDecryption(boolean forDecryption) {
        this.forDecryption = forDecryption;
    }

    public File getOutputFile() {
        return outputFile;
    }

    public void setOutputFile(File outputFile) {
        this.outputFile = outputFile;
    }

    /**
     * Erstellt einen originalen Dateinamen aus einem verschlüsselten Dateinamen
     * (entfernt die .enc-Endung)
     *
     * @return Originaler Dateiname
     */
    public String getOriginalFileName() {
        if (forDecryption && fileName != null && fileName.toLowerCase().endsWith(".enc")) {
            return fileName.substring(0, fileName.length() - 4);
        }
        return fileName;
    }

    /**
     * Erstellt einen verschlüsselten Dateinamen aus einem originalen Dateinamen
     * (fügt die .enc-Endung hinzu)
     *
     * @return Verschlüsselter Dateiname
     */
    public String getEncryptedFileName() {
        if (!forDecryption && fileName != null && !fileName.toLowerCase().endsWith(".enc")) {
            return fileName + ".enc";
        }
        return fileName;
    }
}