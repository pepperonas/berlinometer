package io.celox.enigma3k1.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

import io.celox.enigma3k1.models.AesKey;
import io.celox.enigma3k1.models.RsaKeyPair;

/**
 * Utility-Klasse für die Speicherung von Schlüsseln in SharedPreferences
 */
public class KeyStorageUtils {

    private static final String PREF_NAME = "crypto_vault_prefs";
    private static final String AES_KEYS = "aes_keys";
    private static final String RSA_KEYS = "rsa_keys";
    private static final String TAG = "KeyStorageUtils";

    private static final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create();

    // AES-Schlüssel speichern
    public static void saveAesKey(Context context, AesKey key) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);

        List<AesKey> keys = loadAesKeys(context);

        // Prüfen, ob ein Schlüssel mit der gleichen ID bereits existiert
        for (int i = 0; i < keys.size(); i++) {
            if (keys.get(i).getId().equals(key.getId())) {
                keys.set(i, key); // Ersetze den vorhandenen Schlüssel
                saveAesKeyList(context, keys);
                return;
            }
        }

        // Füge den neuen Schlüssel hinzu
        keys.add(key);
        saveAesKeyList(context, keys);
    }

    // AES-Schlüsselliste speichern
    private static void saveAesKeyList(Context context, List<AesKey> keys) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String json = gson.toJson(keys);
        editor.putString(AES_KEYS, json);
        editor.apply();
    }

    // Alle AES-Schlüssel laden
    public static List<AesKey> loadAesKeys(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(AES_KEYS, "[]");

        Type type = new TypeToken<List<AesKey>>(){}.getType();
        try {
            return gson.fromJson(json, type);
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Laden der AES-Schlüssel: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // AES-Schlüssel nach Typ laden
    public static List<AesKey> loadAesKeys(Context context, String type) {
        List<AesKey> allKeys = loadAesKeys(context);
        List<AesKey> filteredKeys = new ArrayList<>();

        for (AesKey key : allKeys) {
            if (type.equals(key.getType())) {
                filteredKeys.add(key);
            }
        }

        return filteredKeys;
    }

    // AES-Schlüssel löschen
    public static void deleteAesKey(Context context, String keyId) {
        List<AesKey> keys = loadAesKeys(context);

        for (int i = 0; i < keys.size(); i++) {
            if (keys.get(i).getId().equals(keyId)) {
                keys.remove(i);
                saveAesKeyList(context, keys);
                return;
            }
        }
    }

    // RSA-Schlüsselpaar speichern
    public static void saveRsaKeyPair(Context context, RsaKeyPair keyPair) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);

        List<RsaKeyPair> keyPairs = loadRsaKeyPairs(context);

        // Prüfen, ob ein Schlüsselpaar mit der gleichen ID bereits existiert
        for (int i = 0; i < keyPairs.size(); i++) {
            if (keyPairs.get(i).getId().equals(keyPair.getId())) {
                keyPairs.set(i, keyPair); // Ersetze das vorhandene Schlüsselpaar
                saveRsaKeyPairList(context, keyPairs);
                return;
            }
        }

        // Füge das neue Schlüsselpaar hinzu
        keyPairs.add(keyPair);
        saveRsaKeyPairList(context, keyPairs);
    }

    // RSA-Schlüsselpaar-Liste speichern
    private static void saveRsaKeyPairList(Context context, List<RsaKeyPair> keyPairs) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String json = gson.toJson(keyPairs);
        editor.putString(RSA_KEYS, json);
        editor.apply();
    }

    // Alle RSA-Schlüsselpaare laden
    public static List<RsaKeyPair> loadRsaKeyPairs(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(RSA_KEYS, "[]");

        Type type = new TypeToken<List<RsaKeyPair>>(){}.getType();
        try {
            return gson.fromJson(json, type);
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Laden der RSA-Schlüsselpaare: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // RSA-Schlüsselpaar löschen
    public static void deleteRsaKeyPair(Context context, String keyId) {
        List<RsaKeyPair> keyPairs = loadRsaKeyPairs(context);

        for (int i = 0; i < keyPairs.size(); i++) {
            if (keyPairs.get(i).getId().equals(keyId)) {
                keyPairs.remove(i);
                saveRsaKeyPairList(context, keyPairs);
                return;
            }
        }
    }

    // Alle Schlüssel exportieren
    public static String exportAllKeys(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);

        // Alles in einem JSON-Objekt zusammenfassen
        KeyExport export = new KeyExport();
        export.setExportDate(System.currentTimeMillis());
        export.setVersion("1.0");
        export.setAesKeys(loadAesKeys(context));
        export.setRsaKeys(loadRsaKeyPairs(context));

        return gson.toJson(export);
    }

    // Schlüssel aus JSON importieren
    public static boolean importKeys(Context context, String json) {
        try {
            KeyExport import_ = gson.fromJson(json, KeyExport.class);

            if (import_ == null || (import_.getAesKeys() == null && import_.getRsaKeys() == null)) {
                return false;
            }

            // Bestehende Schlüssel laden
            List<AesKey> existingAesKeys = loadAesKeys(context);
            List<RsaKeyPair> existingRsaKeys = loadRsaKeyPairs(context);

            // Sets für schnelleren Lookup erstellen
            java.util.Set<String> existingAesIds = new java.util.HashSet<>();
            java.util.Set<String> existingRsaIds = new java.util.HashSet<>();

            for (AesKey key : existingAesKeys) {
                existingAesIds.add(key.getId());
            }

            for (RsaKeyPair key : existingRsaKeys) {
                existingRsaIds.add(key.getId());
            }

            // Neue AES-Schlüssel hinzufügen
            if (import_.getAesKeys() != null) {
                for (AesKey key : import_.getAesKeys()) {
                    if (!existingAesIds.contains(key.getId())) {
                        existingAesKeys.add(key);
                    }
                }
                saveAesKeyList(context, existingAesKeys);
            }

            // Neue RSA-Schlüsselpaare hinzufügen
            if (import_.getRsaKeys() != null) {
                for (RsaKeyPair key : import_.getRsaKeys()) {
                    if (!existingRsaIds.contains(key.getId())) {
                        existingRsaKeys.add(key);
                    }
                }
                saveRsaKeyPairList(context, existingRsaKeys);
            }

            return true;
        } catch (Exception e) {
            Log.e(TAG, "Fehler beim Importieren der Schlüssel: " + e.getMessage());
            return false;
        }
    }

    /**
     * Hilfsklasse für den Export/Import aller Schlüssel
     */
    private static class KeyExport {
        private long exportDate;
        private String version;
        private List<AesKey> aesKeys;
        private List<RsaKeyPair> rsaKeys;

        public long getExportDate() {
            return exportDate;
        }

        public void setExportDate(long exportDate) {
            this.exportDate = exportDate;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }

        public List<AesKey> getAesKeys() {
            return aesKeys;
        }

        public void setAesKeys(List<AesKey> aesKeys) {
            this.aesKeys = aesKeys;
        }

        public List<RsaKeyPair> getRsaKeys() {
            return rsaKeys;
        }

        public void setRsaKeys(List<RsaKeyPair> rsaKeys) {
            this.rsaKeys = rsaKeys;
        }
    }
}