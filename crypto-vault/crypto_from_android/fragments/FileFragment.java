package io.celox.enigma3k1.fragments;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.OpenableColumns;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.snackbar.Snackbar;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.adapters.FileAdapter;
import io.celox.enigma3k1.crypto.AesUtils;
import io.celox.enigma3k1.crypto.FileUtils;
import io.celox.enigma3k1.models.AesKey;
import io.celox.enigma3k1.models.EncryptedFile;
import io.celox.enigma3k1.utils.KeyStorageUtils;
import io.celox.enigma3k1.utils.UiUtils;

public class FileFragment extends Fragment implements FileAdapter.FileActionListener, FileUtils.ProgressListener {

    private static final int REQUEST_PICK_FILE = 1001;
    private static final int REQUEST_PICK_ENCRYPTED_FILE = 1002;

    private MaterialButtonToggleGroup modeToggleGroup;
    private EditText passwordInput;
    private Spinner keySizeSpinner;
    private Button generateKeyButton, pickFileButton, processButton;
    private EditText keyNameInput;
    private Button saveKeyButton;
    private RecyclerView filesRecyclerView;
    private RecyclerView savedKeysRecyclerView;
    private TextView errorText, infoText, noFilesText;

    private List<EncryptedFile> files = new ArrayList<>();
    private FileAdapter fileAdapter;

    private List<AesKey> savedKeys = new ArrayList<>();
    private ArrayAdapter<AesKey> keyAdapter;

    private String currentMode = "encrypt"; // "encrypt" oder "decrypt"
    private int keySize = 256; // Standard: 256 Bit

    private File outputDirectory;
    private EncryptedFile currentProcessingFile;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_file, container, false);

        // Ausgabeverzeichnis erstellen
        outputDirectory = new File(requireContext().getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "Enigma3k1");
        if (!outputDirectory.exists()) {
            outputDirectory.mkdirs();
        }

        // UI-Komponenten initialisieren
        initViews(view);

        // Events einrichten
        setupEventListeners();

        // Gespeicherte Schlüssel laden
        loadSavedKeys();

        return view;
    }

    private void initViews(View view) {
        modeToggleGroup = view.findViewById(R.id.mode_toggle_group);
        passwordInput = view.findViewById(R.id.password_input);
        // showPasswordToggle wurde entfernt und durch das integrierte Icon des TextInputLayouts ersetzt
        keySizeSpinner = view.findViewById(R.id.key_size_spinner);
        generateKeyButton = view.findViewById(R.id.generate_key_button);
        pickFileButton = view.findViewById(R.id.pick_file_button);
        processButton = view.findViewById(R.id.process_button);
        keyNameInput = view.findViewById(R.id.key_name_input);
        saveKeyButton = view.findViewById(R.id.save_key_button);
        filesRecyclerView = view.findViewById(R.id.files_recycler_view);
        savedKeysRecyclerView = view.findViewById(R.id.saved_keys_recycler);
        errorText = view.findViewById(R.id.error_text);
        infoText = view.findViewById(R.id.info_text);
        noFilesText = view.findViewById(R.id.no_files_text);

        // RecyclerView für Dateien einrichten
        filesRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        fileAdapter = new FileAdapter(files, this);
        filesRecyclerView.setAdapter(fileAdapter);

        // RecyclerView für Schlüssel einrichten
        savedKeysRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));

        // Key-Adapter für Spinner
        keyAdapter = new ArrayAdapter<>(requireContext(),
                android.R.layout.simple_spinner_dropdown_item, savedKeys);

        // Spinner für Schlüsselgröße einrichten
        ArrayAdapter<CharSequence> spinnerAdapter = ArrayAdapter.createFromResource(
                getContext(), R.array.key_sizes, android.R.layout.simple_spinner_item);
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        keySizeSpinner.setAdapter(spinnerAdapter);
    }

    private void setupEventListeners() {
        // Mode Toggle
        modeToggleGroup.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                if (checkedId == R.id.encrypt_button) {
                    currentMode = "encrypt";
                    pickFileButton.setText(R.string.pick_files_to_encrypt);
                    processButton.setText(R.string.encrypt_button);
                } else if (checkedId == R.id.decrypt_button) {
                    currentMode = "decrypt";
                    pickFileButton.setText(R.string.pick_files_to_decrypt);
                    processButton.setText(R.string.decrypt_button);
                }

                // Liste leeren
                files.clear();
                fileAdapter.notifyDataSetChanged();
                updateNoFilesVisibility();
            }
        });

        // Passwort-Sichtbarkeit wird jetzt über das integrierte Icon des TextInputLayouts gesteuert

        // Key Size Spinner
        keySizeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selected = parent.getItemAtPosition(position).toString();
                keySize = Integer.parseInt(selected.replace(" Bit", ""));
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Default beibehalten (256 Bit)
            }
        });

        // Schlüssel generieren
        generateKeyButton.setOnClickListener(v -> generateRandomKey());

        // Dateien auswählen
        pickFileButton.setOnClickListener(v -> pickFiles());

        // Schlüssel speichern
        saveKeyButton.setOnClickListener(v -> saveKey());

        // Verschlüsseln/Entschlüsseln
        processButton.setOnClickListener(v -> processFiles());
    }

    private void loadSavedKeys() {
        savedKeys.clear();
        savedKeys.addAll(KeyStorageUtils.loadAesKeys(getContext(), "file-encryption"));

        // Adapter aktualisieren
        if (savedKeysRecyclerView.getAdapter() == null) {
            savedKeysRecyclerView.setAdapter(new FileKeyAdapter(savedKeys));
        } else {
            savedKeysRecyclerView.getAdapter().notifyDataSetChanged();
        }
    }

    private void generateRandomKey() {
        try {
            String randomKey = AesUtils.generateKey(keySize);
            passwordInput.setText(randomKey);
            showInfo("Zufälliger Schlüssel generiert");
        } catch (Exception e) {
            showError("Fehler bei der Schlüsselgenerierung: " + e.getMessage());
        }
    }

    private void pickFiles() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

        if (currentMode.equals("decrypt")) {
            // .enc-Dateien bei Entschlüsselung
            startActivityForResult(Intent.createChooser(intent, "Verschlüsselte Dateien auswählen"), REQUEST_PICK_ENCRYPTED_FILE);
        } else {
            // Beliebige Dateien bei Verschlüsselung
            startActivityForResult(Intent.createChooser(intent, "Dateien auswählen"), REQUEST_PICK_FILE);
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (resultCode == Activity.RESULT_OK && data != null) {
            if (requestCode == REQUEST_PICK_FILE || requestCode == REQUEST_PICK_ENCRYPTED_FILE) {
                handleFilePicker(data, requestCode == REQUEST_PICK_ENCRYPTED_FILE);
            }
        }
    }

    private void handleFilePicker(Intent data, boolean forDecryption) {
        ClipData clipData = data.getClipData();
        List<Uri> fileUris = new ArrayList<>();

        // Mehrere Dateien aus ClipData laden
        if (clipData != null) {
            for (int i = 0; i < clipData.getItemCount(); i++) {
                Uri uri = clipData.getItemAt(i).getUri();
                fileUris.add(uri);
            }
        }
        // Einzelne Datei
        else if (data.getData() != null) {
            fileUris.add(data.getData());
        }

        // Dateien in die Liste aufnehmen
        for (Uri uri : fileUris) {
            boolean isValid = true;

            if (forDecryption) {
                // Bei Entschlüsselung prüfen, ob es eine .enc-Datei ist
                String fileName = FileUtils.getFileName(requireContext(), uri);
                if (fileName == null || !fileName.toLowerCase().endsWith(".enc")) {
                    isValid = false;
                }
            }

            if (isValid) {
                EncryptedFile fileInfo = new EncryptedFile();
                fileInfo.setId(String.valueOf(System.currentTimeMillis() + fileUris.indexOf(uri)));
                fileInfo.setUri(uri);
                fileInfo.setFileName(FileUtils.getFileName(requireContext(), uri));
                fileInfo.setFileSize(FileUtils.getFileSize(requireContext(), uri));
                fileInfo.setStatus(EncryptedFile.STATUS_READY);
                fileInfo.setForDecryption(forDecryption);

                // Datei hinzufügen
                files.add(fileInfo);
            }
        }

        // UI aktualisieren
        fileAdapter.notifyDataSetChanged();
        updateNoFilesVisibility();

        // Meldung anzeigen
        showInfo(files.size() + " Datei(en) hinzugefügt");
    }

    private void updateNoFilesVisibility() {
        if (files.isEmpty()) {
            noFilesText.setVisibility(View.VISIBLE);
            filesRecyclerView.setVisibility(View.GONE);
        } else {
            noFilesText.setVisibility(View.GONE);
            filesRecyclerView.setVisibility(View.VISIBLE);
        }
    }

    private void saveKey() {
        String keyName = keyNameInput.getText().toString();
        String keyValue = passwordInput.getText().toString();

        if (keyName.isEmpty()) {
            showError("Bitte einen Namen für den Schlüssel eingeben");
            return;
        }

        if (keyValue.isEmpty()) {
            showError("Bitte einen Schlüssel eingeben oder generieren");
            return;
        }

        AesKey newKey = new AesKey();
        newKey.setId(String.valueOf(System.currentTimeMillis()));
        newKey.setName(keyName);
        newKey.setValue(keyValue);
        newKey.setKeySize(keySize);
        newKey.setType("file-encryption");
        newKey.setCreatedAt(new Date());

        KeyStorageUtils.saveAesKey(getContext(), newKey);
        loadSavedKeys();
        keyNameInput.setText("");
        showInfo("Schlüssel erfolgreich gespeichert");
    }

    private void processFiles() {
        if (files.isEmpty()) {
            showError("Bitte zuerst Dateien hinzufügen");
            return;
        }

        String password = passwordInput.getText().toString();
        if (password.isEmpty()) {
            showError("Bitte einen Schlüssel eingeben oder generieren");
            return;
        }

        // Erste Datei in der Warteschlange suchen
        for (EncryptedFile file : files) {
            if (file.getStatus().equals(EncryptedFile.STATUS_READY)) {
                currentProcessingFile = file;
                processFile(file, password);
                break;
            }
        }
    }

    private void processFile(EncryptedFile fileInfo, String password) {
        // Status auf "Verarbeitung" setzen
        fileInfo.setStatus(EncryptedFile.STATUS_PROCESSING);
        fileInfo.setProgress(0);
        fileAdapter.notifyDataSetChanged();

        // Ausgabedatei erstellen
        String outputFileName;
        if (fileInfo.isForDecryption()) {
            // Entfernen der .enc-Endung
            String originalName = fileInfo.getFileName();
            if (originalName.toLowerCase().endsWith(".enc")) {
                outputFileName = originalName.substring(0, originalName.length() - 4);
            } else {
                outputFileName = "decrypted_" + originalName;
            }
        } else {
            // Hinzufügen der .enc-Endung
            outputFileName = fileInfo.getFileName() + ".enc";
        }

        File outputFile = new File(outputDirectory, outputFileName);

        // Hintergrundthread für die Verarbeitung starten
        new Thread(() -> {
            boolean success;

            if (fileInfo.isForDecryption()) {
                // Datei entschlüsseln
                success = FileUtils.decryptFile(requireContext(), fileInfo.getUri(),
                        outputFile, password, keySize, this);
            } else {
                // Datei verschlüsseln
                success = FileUtils.encryptFile(requireContext(), fileInfo.getUri(),
                        outputFile, password, keySize, this);
            }

            // Status aktualisieren
            if (success) {
                fileInfo.setStatus(EncryptedFile.STATUS_COMPLETED);
                fileInfo.setOutputFile(outputFile);

                getActivity().runOnUiThread(() -> {
                    showInfo("Datei erfolgreich " +
                            (fileInfo.isForDecryption() ? "entschlüsselt" : "verschlüsselt"));

                    // Nächste Datei verarbeiten
                    processNextFile(password);
                });
            } else {
                fileInfo.setStatus(EncryptedFile.STATUS_ERROR);

                getActivity().runOnUiThread(() -> {
                    showError("Fehler bei der " +
                            (fileInfo.isForDecryption() ? "Entschlüsselung" : "Verschlüsselung") +
                            " von " + fileInfo.getFileName());

                    // Nächste Datei verarbeiten
                    processNextFile(password);
                });
            }

            getActivity().runOnUiThread(() -> {
                fileAdapter.notifyDataSetChanged();
            });
        }).start();
    }

    private void processNextFile(String password) {
        // Suche nach weiteren Dateien mit Status "READY"
        for (EncryptedFile file : files) {
            if (file.getStatus().equals(EncryptedFile.STATUS_READY)) {
                currentProcessingFile = file;
                processFile(file, password);
                return;
            }
        }

        // Alle Dateien verarbeitet
        currentProcessingFile = null;
    }

    @Override
    public void onProgress(int progress) {
        if (currentProcessingFile != null && getActivity() != null) {
            getActivity().runOnUiThread(() -> {
                currentProcessingFile.setProgress(progress);
                fileAdapter.notifyDataSetChanged();
            });
        }
    }

    @Override
    public void onFileAction(EncryptedFile file, String action) {
        switch (action) {
            case "open":
                openFile(file);
                break;

            case "share":
                shareFile(file);
                break;

            case "delete":
                removeFile(file);
                break;
        }
    }

    private void openFile(EncryptedFile file) {
        if (file.getOutputFile() != null && file.getOutputFile().exists()) {
            UiUtils.openFile(requireContext(), file.getOutputFile());
        } else {
            showError("Die Datei ist nicht verfügbar");
        }
    }

    private void shareFile(EncryptedFile file) {
        if (file.getOutputFile() != null && file.getOutputFile().exists()) {
            UiUtils.shareFile(requireContext(), file.getOutputFile());
        } else {
            showError("Die Datei ist nicht verfügbar");
        }
    }

    private void removeFile(EncryptedFile file) {
        files.remove(file);
        fileAdapter.notifyDataSetChanged();
        updateNoFilesVisibility();
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        infoText.setVisibility(View.GONE);

        // Nach 5 Sekunden ausblenden
        errorText.postDelayed(() -> {
            if (isAdded()) {
                errorText.setVisibility(View.GONE);
            }
        }, 5000);
    }

    private void showInfo(String message) {
        infoText.setText(message);
        infoText.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        // Nach 3 Sekunden ausblenden
        infoText.postDelayed(() -> {
            if (isAdded()) {
                infoText.setVisibility(View.GONE);
            }
        }, 3000);
    }

    /**
     * Adapter für die Anzeige von Schlüsseln in der Schlüsselliste
     */
    private class FileKeyAdapter extends RecyclerView.Adapter<FileKeyAdapter.KeyViewHolder> {

        private List<AesKey> keys;

        public FileKeyAdapter(List<AesKey> keys) {
            this.keys = keys;
        }

        @NonNull
        @Override
        public KeyViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_key, parent, false);
            return new KeyViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull KeyViewHolder holder, int position) {
            AesKey key = keys.get(position);
            holder.bind(key);
        }

        @Override
        public int getItemCount() {
            return keys.size();
        }

        class KeyViewHolder extends RecyclerView.ViewHolder {
            TextView keyName, keyInfo;
            Button loadButton, deleteButton;

            public KeyViewHolder(@NonNull View itemView) {
                super(itemView);
                keyName = itemView.findViewById(R.id.key_name);
                keyInfo = itemView.findViewById(R.id.key_info);
                loadButton = itemView.findViewById(R.id.load_key_button);
                deleteButton = itemView.findViewById(R.id.delete_key_button);
            }

            public void bind(AesKey key) {
                keyName.setText(key.getName());

                // Schlüsselinfo formatieren
                String info = key.getKeySize() + " Bit • Erstellt am " +
                        (key.getCreatedAt() != null ? UiUtils.formatDate(key.getCreatedAt()) : "Unbekannt");
                keyInfo.setText(info);

                // Click-Listener einrichten
                loadButton.setOnClickListener(v -> {
                    // Schlüssel laden
                    passwordInput.setText(key.getValue());
                    for (int i = 0; i < keySizeSpinner.getAdapter().getCount(); i++) {
                        String item = keySizeSpinner.getAdapter().getItem(i).toString();
                        if (item.startsWith(String.valueOf(key.getKeySize()))) {
                            keySizeSpinner.setSelection(i);
                            break;
                        }
                    }
                    showInfo("Schlüssel geladen");
                    
                    // Toast-Nachricht mit Erfolgsmeldung anzeigen
                    Toast.makeText(requireContext(), "Schlüssel erfolgreich geladen ✓", Toast.LENGTH_SHORT).show();
                });

                deleteButton.setOnClickListener(v -> {
                    // Löschen-Dialog anzeigen
                    new AlertDialog.Builder(requireContext())
                            .setTitle("Schlüssel löschen")
                            .setMessage("Möchtest Du diesen Schlüssel wirklich löschen?")
                            .setPositiveButton("Löschen", (dialog, which) -> {
                                KeyStorageUtils.deleteAesKey(requireContext(), key.getId());
                                loadSavedKeys();
                                showInfo("Schlüssel gelöscht");
                            })
                            .setNegativeButton("Abbrechen", null)
                            .show();
                });
            }
        }
    }
}