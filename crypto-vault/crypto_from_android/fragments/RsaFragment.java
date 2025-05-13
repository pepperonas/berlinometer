package io.celox.enigma3k1.fragments;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.button.MaterialButtonToggleGroup;
import com.google.android.material.textfield.TextInputLayout;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.adapters.RsaKeyAdapter;
import io.celox.enigma3k1.crypto.RsaUtils;
import io.celox.enigma3k1.models.RsaKeyPair;
import io.celox.enigma3k1.utils.KeyStorageUtils;
import io.celox.enigma3k1.utils.UiUtils;

public class RsaFragment extends Fragment implements RsaKeyAdapter.KeyActionListener {

    private static final int REQUEST_IMPORT_KEY = 2001;

    private MaterialButtonToggleGroup modeToggleGroup;
    private EditText inputText, outputText;
    private com.google.android.material.button.MaterialButton copyOutputButton;
    private Button processButton, generateKeyButton, saveKeyButton, importKeyButton;
    private CheckBox useExternalKeyCheckbox;
    private TextInputLayout externalKeyLayout;
    private EditText externalKeyInput, keyNameInput;
    private Button importExternalKeyButton, importExternalFileButton;
    private Spinner keySizeSpinner;
    private RecyclerView keyPairsRecyclerView;
    private TextView errorText, infoText, externalKeyStatusText;
    private ProgressBar generatingProgress;

    private String currentMode = "encrypt"; // "encrypt" oder "decrypt"
    private int keySize = 2048; // Standard: 2048 Bit
    private boolean useExternalKey = false;
    private boolean showAdvancedOptions = false;
    private boolean externalKeyValid = false;

    private String[] currentKeyPair;
    private RsaKeyAdapter keyAdapter;
    private List<RsaKeyPair> savedKeyPairs = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_rsa, container, false);

        // UI-Komponenten initialisieren
        initViews(view);

        // Events einrichten
        setupEventListeners();

        // Gespeicherte Schlüssel laden
        loadSavedKeyPairs();

        return view;
    }

    private void initViews(View view) {
        modeToggleGroup = view.findViewById(R.id.mode_toggle_group);
        inputText = view.findViewById(R.id.input_text);
        outputText = view.findViewById(R.id.output_text);

        // Hier liegt der Fehler - kein Cast zu ImageButton mehr
        copyOutputButton = view.findViewById(R.id.copy_output_button);

        processButton = view.findViewById(R.id.process_button);
        generateKeyButton = view.findViewById(R.id.generate_key_button);
        saveKeyButton = view.findViewById(R.id.save_key_button);
        importKeyButton = view.findViewById(R.id.import_key_button);
        useExternalKeyCheckbox = view.findViewById(R.id.use_external_key_checkbox);
        externalKeyLayout = view.findViewById(R.id.external_key_layout);
        externalKeyInput = view.findViewById(R.id.external_key_input);
        keyNameInput = view.findViewById(R.id.key_name_input);
        importExternalKeyButton = view.findViewById(R.id.import_external_key_button);
        importExternalFileButton = view.findViewById(R.id.import_external_file_button);
        Button pasteClipboardButton = view.findViewById(R.id.paste_clipboard_button);
        keySizeSpinner = view.findViewById(R.id.key_size_spinner);
        keyPairsRecyclerView = view.findViewById(R.id.key_pairs_recycler);
        errorText = view.findViewById(R.id.error_text);
        infoText = view.findViewById(R.id.info_text);
        externalKeyStatusText = view.findViewById(R.id.external_key_status);
        generatingProgress = view.findViewById(R.id.generating_progress);
        
        // Paste from Clipboard Button
        pasteClipboardButton.setOnClickListener(v -> {
            ClipboardManager clipboard = (ClipboardManager) requireContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard.hasPrimaryClip() && clipboard.getPrimaryClip() != null) {
                ClipData.Item item = clipboard.getPrimaryClip().getItemAt(0);
                String text = item.getText() != null ? item.getText().toString() : "";
                if (!text.isEmpty()) {
                    externalKeyInput.setText(text);
                    importExternalKey();
                } else {
                    showError("Zwischenablage enthält keinen Text");
                }
            } else {
                showError("Zwischenablage ist leer");
            }
        });

        // RecyclerView einrichten
        keyPairsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        keyAdapter = new RsaKeyAdapter(savedKeyPairs, this);
        keyPairsRecyclerView.setAdapter(keyAdapter);

        // Spinner einrichten
        ArrayAdapter<CharSequence> spinnerAdapter = ArrayAdapter.createFromResource(
                getContext(), R.array.rsa_key_sizes, android.R.layout.simple_spinner_item);
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        keySizeSpinner.setAdapter(spinnerAdapter);

        // External Key Layout ausblenden
        externalKeyLayout.setVisibility(View.GONE);
    }

    private void setupEventListeners() {
        // Mode Toggle
        modeToggleGroup.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                if (checkedId == R.id.encrypt_button) {
                    currentMode = "encrypt";
                    inputText.setHint(R.string.rsa_encrypt_hint);
                    processButton.setText(R.string.encrypt_button);

                    // External Key-Option aktivieren
                    useExternalKeyCheckbox.setEnabled(true);
                } else if (checkedId == R.id.decrypt_button) {
                    currentMode = "decrypt";
                    inputText.setHint(R.string.rsa_decrypt_hint);
                    processButton.setText(R.string.decrypt_button);

                    // External Key kann nicht zum Entschlüsseln verwendet werden
                    useExternalKeyCheckbox.setChecked(false);
                    useExternalKey = false;
                    externalKeyLayout.setVisibility(View.GONE);
                    useExternalKeyCheckbox.setEnabled(false);
                }
            }
        });

        // External Key Checkbox
        useExternalKeyCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            useExternalKey = isChecked;
            externalKeyLayout.setVisibility(isChecked ? View.VISIBLE : View.GONE);
            externalKeyStatusText.setVisibility(View.GONE);
            externalKeyValid = false;
        });

        // Import External Key Button
        importExternalKeyButton.setOnClickListener(v -> {
            importExternalKey();
        });

        // External Key Input Change
        externalKeyInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                // Status-Text zurücksetzen
                externalKeyStatusText.setVisibility(View.GONE);
                externalKeyValid = false;
            }
        });
        

        // Import External Key File Button
        importExternalFileButton.setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            startActivityForResult(Intent.createChooser(intent, "Öffentlichen Schlüssel wählen"), REQUEST_IMPORT_KEY);
        });

        // Key Size Spinner
        keySizeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selected = parent.getItemAtPosition(position).toString();
                keySize = Integer.parseInt(selected.replace(" Bit", ""));
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                // Default beibehalten (2048 Bit)
            }
        });

        // Schlüsselpaar generieren
        generateKeyButton.setOnClickListener(v -> generateKeyPair());

        // Verschlüsseln/Entschlüsseln
        processButton.setOnClickListener(v -> processText());

        // Output kopieren
        copyOutputButton.setOnClickListener(v -> copyToClipboard(outputText.getText().toString()));

        // Schlüsselpaar speichern
        saveKeyButton.setOnClickListener(v -> saveKeyPair());

        // Schlüsselpaar importieren
        importKeyButton.setOnClickListener(v -> importKeyPair());
    }

    private void loadSavedKeyPairs() {
        savedKeyPairs.clear();
        savedKeyPairs.addAll(KeyStorageUtils.loadRsaKeyPairs(getContext()));
        keyAdapter.notifyDataSetChanged();
    }

    private void importExternalKey() {
        String keyText = externalKeyInput.getText().toString().trim();

        if (keyText.isEmpty()) {
            showError("Bitte gib einen öffentlichen Schlüssel ein");
            return;
        }

        try {
            // PEM-Format vorverarbeiten, wenn vorhanden
            String processedKeyText = keyText;
            
            // Verschiedene PEM-Header erkennen
            if (keyText.contains("-----BEGIN") && keyText.contains("-----END")) {
                if (!keyText.contains("PUBLIC KEY")) {
                    showError("Der Schlüssel scheint kein öffentlicher Schlüssel zu sein. Bitte nur PUBLIC KEY einfügen.");
                    externalKeyValid = false;
                    externalKeyStatusText.setText("Kein öffentlicher Schlüssel");
                    externalKeyStatusText.setTextColor(getResources().getColor(R.color.error));
                    externalKeyStatusText.setVisibility(View.VISIBLE);
                    return;
                }
                processedKeyText = RsaUtils.extractBase64FromPem(keyText);
            }
            
            // Base64-Validierung und Bereinigung
            processedKeyText = processedKeyText.replaceAll("\\s", ""); // Whitespace entfernen
            
            // Neuer Versuch, den bereinigten Schlüssel zu validieren
            // Schlüssel validieren
            if (RsaUtils.isValidPublicKey(processedKeyText)) {
                // Erfolgreich validiert, jetzt speichern wir den verarbeiteten Schlüssel zurück ins Eingabefeld
                if (processedKeyText.length() != keyText.length()) {
                    // Wenn der Schlüssel bereinigt wurde, aktualisieren wir das Eingabefeld
                    externalKeyInput.setText(processedKeyText);
                }
                
                externalKeyValid = true;
                externalKeyStatusText.setText("Externer Schlüssel importiert ✓");
                externalKeyStatusText.setTextColor(getResources().getColor(R.color.success));
                externalKeyStatusText.setVisibility(View.VISIBLE);
                showInfo("Externer öffentlicher Schlüssel erfolgreich importiert");
            } else {
                externalKeyValid = false;
                externalKeyStatusText.setText("Ungültiger öffentlicher Schlüssel");
                externalKeyStatusText.setTextColor(getResources().getColor(R.color.error));
                externalKeyStatusText.setVisibility(View.VISIBLE);
                showError("Der eingegebene Text ist kein gültiger öffentlicher Schlüssel");
            }
        } catch (Exception e) {
            externalKeyValid = false;
            externalKeyStatusText.setText("Fehler beim Importieren des Schlüssels");
            externalKeyStatusText.setTextColor(getResources().getColor(R.color.error));
            externalKeyStatusText.setVisibility(View.VISIBLE);
            showError("Fehler: " + e.getMessage());
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_IMPORT_KEY && resultCode == getActivity().RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                try {
                    String keyContent = readTextFromUri(uri);
                    externalKeyInput.setText(keyContent);
                    importExternalKey();
                } catch (IOException e) {
                    showError("Fehler beim Lesen der Datei: " + e.getMessage());
                }
            }
        }
    }

    private String readTextFromUri(Uri uri) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        try (InputStream inputStream = getActivity().getContentResolver().openInputStream(uri);
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line).append('\n');
            }
        }
        return stringBuilder.toString();
    }

    private void generateKeyPair() {
        // UI sperren
        setGeneratingState(true);

        new Thread(() -> {
            try {
                // RSA-Schlüsselpaar generieren
                currentKeyPair = RsaUtils.generateKeyPair(keySize);

                getActivity().runOnUiThread(() -> {
                    showInfo("Neues RSA-Schlüsselpaar erfolgreich generiert");
                    setGeneratingState(false);
                });
            } catch (Exception e) {
                getActivity().runOnUiThread(() -> {
                    showError("Fehler bei der Schlüsselgenerierung: " + e.getMessage());
                    setGeneratingState(false);
                });
            }
        }).start();
    }

    private void setGeneratingState(boolean isGenerating) {
        generateKeyButton.setEnabled(!isGenerating);
        generatingProgress.setVisibility(isGenerating ? View.VISIBLE : View.GONE);
    }

    private void processText() {
        String input = inputText.getText().toString();

        if (input.isEmpty()) {
            showError("Bitte Text eingeben");
            return;
        }

        if (currentMode.equals("encrypt")) {
            if (useExternalKey) {
                // Mit externem öffentlichen Schlüssel verschlüsseln
                if (!externalKeyValid) {
                    showError("Bitte zuerst einen gültigen externen öffentlichen Schlüssel importieren");
                    return;
                }

                try {
                    String keyText = externalKeyInput.getText().toString().trim();
                    
                    // Sicher verarbeiten, falls es ein PEM-Format ist
                    if (keyText.contains("-----BEGIN") && keyText.contains("PUBLIC KEY")) {
                        keyText = RsaUtils.extractBase64FromPem(keyText);
                    }
                    
                    // Whitespace bereinigen
                    keyText = keyText.replaceAll("\\s", "");
                    
                    // Erneut validieren, um sicherzustellen, dass der Schlüssel gültig ist
                    if (!RsaUtils.isValidPublicKey(keyText)) {
                        showError("Der externe Schlüssel ist ungültig. Bitte importieren Sie ihn erneut.");
                        externalKeyValid = false;
                        return;
                    }

                    String encrypted = RsaUtils.encrypt(input, keyText);
                    outputText.setText(encrypted);
                    showInfo("Text erfolgreich verschlüsselt");
                } catch (Exception e) {
                    showError("Verschlüsselung fehlgeschlagen: " + e.getMessage());
                }
            } else {
                // Mit eigenem Schlüsselpaar verschlüsseln
                if (currentKeyPair == null) {
                    showError("Bitte zuerst ein Schlüsselpaar generieren oder laden");
                    return;
                }

                try {
                    String encrypted = RsaUtils.encrypt(input, currentKeyPair[0]); // publicKey
                    outputText.setText(encrypted);
                } catch (Exception e) {
                    showError("Verschlüsselung fehlgeschlagen: " + e.getMessage());
                }
            }
        } else {
            // Mit eigenem privaten Schlüssel entschlüsseln
            if (currentKeyPair == null) {
                showError("Bitte zuerst ein Schlüsselpaar generieren oder laden");
                return;
            }

            try {
                String decrypted = RsaUtils.decrypt(input, currentKeyPair[1]); // privateKey
                outputText.setText(decrypted);
            } catch (Exception e) {
                showError("Entschlüsselung fehlgeschlagen: " + e.getMessage());
            }
        }
    }

    private void copyToClipboard(String text) {
        if (text.isEmpty()) return;

        ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Verschlüsselter Text", text);
        clipboard.setPrimaryClip(clip);

        showInfo("In Zwischenablage kopiert");
    }

    private void saveKeyPair() {
        if (currentKeyPair == null) {
            showError("Bitte zuerst ein Schlüsselpaar generieren");
            return;
        }

        String name = keyNameInput.getText().toString();
        if (name.isEmpty()) {
            showError("Bitte einen Namen für das Schlüsselpaar eingeben");
            return;
        }

        // Passwortschutz-Dialog anzeigen
        showPasswordProtectionDialog(name, currentKeyPair[0], currentKeyPair[1]);
    }

    private void showPasswordProtectionDialog(String name, String publicKey, String privateKey) {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_password, null);
        final EditText passwordInput = dialogView.findViewById(R.id.password_input);
        final EditText confirmPasswordInput = dialogView.findViewById(R.id.confirm_password_input);
        final CheckBox usePasswordCheckbox = dialogView.findViewById(R.id.use_password_checkbox);

        // Password-Felder deaktivieren, wenn Checkbox nicht angehakt ist
        usePasswordCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            passwordInput.setEnabled(isChecked);
            confirmPasswordInput.setEnabled(isChecked);
        });

        // Initial deaktivieren
        passwordInput.setEnabled(false);
        confirmPasswordInput.setEnabled(false);

        new AlertDialog.Builder(requireContext())
                .setTitle("Privaten Schlüssel schützen")
                .setView(dialogView)
                .setPositiveButton("Speichern", (dialog, which) -> {
                    // Prüfen ob Passwortschutz aktiviert ist
                    if (usePasswordCheckbox.isChecked()) {
                        String password = passwordInput.getText().toString();
                        String confirmPassword = confirmPasswordInput.getText().toString();

                        if (password.isEmpty()) {
                            showError("Bitte ein Passwort eingeben");
                            return;
                        }

                        if (!password.equals(confirmPassword)) {
                            showError("Die Passwörter stimmen nicht überein");
                            return;
                        }

                        // Mit Passwort speichern
                        saveKeyPairWithEncryption(name, publicKey, privateKey, password);
                    } else {
                        // Ohne Passwort speichern
                        saveKeyPairWithoutEncryption(name, publicKey, privateKey);
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void saveKeyPairWithEncryption(String name, String publicKey, String privateKey, String password) {
        try {
            // Privaten Schlüssel verschlüsseln
            RsaUtils.EncryptedPrivateKey encryptedKey = RsaUtils.encryptPrivateKey(privateKey, password);

            RsaKeyPair keyPair = new RsaKeyPair();
            keyPair.setId(String.valueOf(System.currentTimeMillis()));
            keyPair.setName(name);
            keyPair.setPublicKey(publicKey);
            keyPair.setPrivateKey(encryptedKey.getEncrypted()); // Verschlüsselter privater Schlüssel
            keyPair.setSalt(encryptedKey.getSalt());
            keyPair.setIv(encryptedKey.getIv());
            keyPair.setEncrypted(true);
            keyPair.setKeySize(keySize);
            keyPair.setCreatedAt(new Date());

            KeyStorageUtils.saveRsaKeyPair(getContext(), keyPair);
            loadSavedKeyPairs();
            keyNameInput.setText("");

            showInfo("Schlüsselpaar erfolgreich mit Passwortschutz gespeichert");
        } catch (Exception e) {
            showError("Fehler beim Speichern: " + e.getMessage());
        }
    }

    private void saveKeyPairWithoutEncryption(String name, String publicKey, String privateKey) {
        RsaKeyPair keyPair = new RsaKeyPair();
        keyPair.setId(String.valueOf(System.currentTimeMillis()));
        keyPair.setName(name);
        keyPair.setPublicKey(publicKey);
        keyPair.setPrivateKey(privateKey);
        keyPair.setEncrypted(false);
        keyPair.setKeySize(keySize);
        keyPair.setCreatedAt(new Date());

        KeyStorageUtils.saveRsaKeyPair(getContext(), keyPair);
        loadSavedKeyPairs();
        keyNameInput.setText("");

        showInfo("Schlüsselpaar erfolgreich gespeichert");
    }

    private void importKeyPair() {
        // Dialog anzeigen um einen Namen für den zu importierenden Schlüssel einzugeben
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_key_import, null);
        final EditText nameInput = dialogView.findViewById(R.id.key_name_input);
        
        AlertDialog dialog = new AlertDialog.Builder(requireContext())
                .setTitle("Öffentlichen Schlüssel importieren")
                .setView(dialogView)
                .setPositiveButton("Importieren", null) // Wird unten überschrieben
                .setNegativeButton("Abbrechen", null)
                .create();
        
        dialog.show();
        
        // Button-Click-Handler überschreiben, damit der Dialog bei Fehlern nicht geschlossen wird
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String name = nameInput.getText().toString().trim();
            
            if (name.isEmpty()) {
                showError("Bitte gib einen Namen für den Schlüssel ein");
                return;
            }
            
            // Schlüsseltext holen
            String keyText = externalKeyInput.getText().toString().trim();
            
            if (keyText.isEmpty()) {
                showError("Bitte gib zuerst einen öffentlichen Schlüssel ein");
                return;
            }
            
            try {
                // PEM-Format vorverarbeiten, wenn vorhanden
                String processedKeyText = keyText;
                
                // Verschiedene PEM-Header erkennen
                if (keyText.contains("-----BEGIN") && keyText.contains("-----END")) {
                    if (!keyText.contains("PUBLIC KEY")) {
                        showError("Der Schlüssel scheint kein öffentlicher Schlüssel zu sein. Bitte nur PUBLIC KEY importieren.");
                        return;
                    }
                    processedKeyText = RsaUtils.extractBase64FromPem(keyText);
                }
                
                // Base64-Validierung und Bereinigung
                processedKeyText = processedKeyText.replaceAll("\\s", ""); // Whitespace entfernen
                
                // Schlüssel validieren
                if (!RsaUtils.isValidPublicKey(processedKeyText)) {
                    showError("Der eingegebene Text ist kein gültiger öffentlicher Schlüssel");
                    return;
                }
                
                // Neues RsaKeyPair-Objekt erstellen (nur mit public key)
                RsaKeyPair keyPair = new RsaKeyPair();
                keyPair.setId(String.valueOf(System.currentTimeMillis()));
                keyPair.setName(name + " (nur public)");
                keyPair.setPublicKey(processedKeyText);
                keyPair.setPrivateKey(""); // Leerer private key
                keyPair.setEncrypted(false);
                keyPair.setKeySize(2048); // Standardgröße, da wir die tatsächliche nicht kennen
                keyPair.setCreatedAt(new Date());
                
                // Schlüssel speichern
                KeyStorageUtils.saveRsaKeyPair(getContext(), keyPair);
                loadSavedKeyPairs();
                
                // Feedback anzeigen
                String successMessage = "Öffentlicher Schlüssel \"" + name + "\" erfolgreich importiert";
                showInfo(successMessage);
                UiUtils.showToast(requireContext(), "Schlüssel importiert ✓");
                
                // Erfolgsinfo im Statustext anzeigen
                externalKeyStatusText.setText("Importiert: " + name + " ✓");
                externalKeyStatusText.setTextColor(getResources().getColor(R.color.success));
                externalKeyStatusText.setVisibility(View.VISIBLE);
                
                // Den importierten öffentlichen Schlüssel für die Verschlüsselung auswählen
                if (currentMode.equals("encrypt")) {
                    useExternalKeyCheckbox.setChecked(true);
                    useExternalKey = true;
                    externalKeyValid = true;
                }
                
                // Nach 3 Sekunden das Eingabefeld leeren
                new Handler().postDelayed(() -> {
                    if (isAdded()) {
                        // Eingabefeld leeren
                        externalKeyInput.setText("");
                        externalKeyValid = false;
                        externalKeyStatusText.setVisibility(View.GONE);
                    }
                }, 3000);
                
                // Dialog schließen
                dialog.dismiss();
                
            } catch (Exception e) {
                showError("Fehler beim Importieren: " + e.getMessage());
            }
        });
    }

    private void exportPublicKey() {
        if (currentKeyPair == null) {
            showError("Kein Schlüsselpaar verfügbar");
            return;
        }

        try {
            // PEM-Format erstellen
            String pemPublicKey = RsaUtils.publicKeyToPem(currentKeyPair[0]);

            // Datei speichern
            File outputDir = new File(requireContext().getExternalFilesDir(null), "keys");
            if (!outputDir.exists()) {
                outputDir.mkdirs();
            }

            File outputFile = new File(outputDir, "public_key_" + System.currentTimeMillis() + ".pem");
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                fos.write(pemPublicKey.getBytes());
            }

            showInfo("Öffentlicher Schlüssel exportiert: " + outputFile.getAbsolutePath());

            // Datei teilen
            UiUtils.shareFile(requireContext(), outputFile);
        } catch (Exception e) {
            showError("Fehler beim Exportieren: " + e.getMessage());
        }
    }

    private void exportPrivateKey() {
        if (currentKeyPair == null) {
            showError("Kein Schlüsselpaar verfügbar");
            return;
        }

        // Sicherheitswarnung anzeigen
        new AlertDialog.Builder(requireContext())
                .setTitle("Sicherheitswarnung")
                .setMessage("Der private Schlüssel sollte niemals ungeschützt weitergegeben werden. " +
                        "Bist du sicher, dass du ihn exportieren möchtest?")
                .setPositiveButton("Exportieren", (dialog, which) -> {
                    try {
                        // PEM-Format erstellen
                        String pemPrivateKey = RsaUtils.privateKeyToPem(currentKeyPair[1]);

                        // Datei speichern
                        File outputDir = new File(requireContext().getExternalFilesDir(null), "keys");
                        if (!outputDir.exists()) {
                            outputDir.mkdirs();
                        }

                        File outputFile = new File(outputDir, "private_key_" + System.currentTimeMillis() + ".pem");
                        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                            fos.write(pemPrivateKey.getBytes());
                        }

                        showInfo("Privater Schlüssel exportiert: " + outputFile.getAbsolutePath());

                        // Datei teilen
                        UiUtils.shareFile(requireContext(), outputFile);
                    } catch (Exception e) {
                        showError("Fehler beim Exportieren: " + e.getMessage());
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    @Override
    public void onKeyAction(RsaKeyPair keyPair, String action) {
        switch (action) {
            case "load":
                loadKeyPair(keyPair);
                break;

            case "copy_public":
                copyPublicKeyToClipboard(keyPair);
                break;

            case "export_public":
                exportPublicKey(keyPair);
                break;

            case "export_private":
                exportPrivateKey(keyPair);
                break;

            case "delete":
                deleteKeyPair(keyPair);
                break;
        }
    }
    
    /**
     * Kopiert den öffentlichen Schlüssel als Text in die Zwischenablage
     */
    private void copyPublicKeyToClipboard(RsaKeyPair keyPair) {
        try {
            // PEM-Format erstellen
            String pemPublicKey = RsaUtils.publicKeyToPem(keyPair.getPublicKey());
            
            // In die Zwischenablage kopieren
            ClipboardManager clipboard = (ClipboardManager) requireContext().getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("RSA Public Key", pemPublicKey);
            clipboard.setPrimaryClip(clip);
            
            showInfo("Öffentlicher Schlüssel in Zwischenablage kopiert");
            
            // Zusätzlich Toast anzeigen
            UiUtils.showToast(requireContext(), "Public Key kopiert ✓");
        } catch (Exception e) {
            showError("Fehler beim Kopieren des Schlüssels: " + e.getMessage());
        }
    }

    private void loadKeyPair(RsaKeyPair keyPair) {
        if (keyPair.isEncrypted()) {
            // Passwort-Dialog anzeigen
            showUnlockDialog(keyPair);
        } else {
            // Direkt laden
            currentKeyPair = new String[]{keyPair.getPublicKey(), keyPair.getPrivateKey()};
            showInfo("Schlüsselpaar erfolgreich geladen");
        }
    }

    private void showUnlockDialog(RsaKeyPair keyPair) {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_unlock, null);
        final EditText passwordInput = dialogView.findViewById(R.id.password_input);

        new AlertDialog.Builder(requireContext())
                .setTitle("Schlüsselpaar entsperren")
                .setMessage("Bitte gib das Passwort ein, um den privaten Schlüssel zu entschlüsseln.")
                .setView(dialogView)
                .setPositiveButton("Entsperren", (dialog, which) -> {
                    String password = passwordInput.getText().toString();
                    if (password.isEmpty()) {
                        showError("Bitte ein Passwort eingeben");
                        return;
                    }

                    unlockKeyPair(keyPair, password);
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void unlockKeyPair(RsaKeyPair keyPair, String password) {
        try {
            // Privaten Schlüssel entschlüsseln
            RsaUtils.EncryptedPrivateKey encryptedKey = new RsaUtils.EncryptedPrivateKey(
                    keyPair.getPrivateKey(), keyPair.getSalt(), keyPair.getIv());

            String privateKey = RsaUtils.decryptPrivateKey(encryptedKey, password);

            // Schlüsselpaar setzen
            currentKeyPair = new String[]{keyPair.getPublicKey(), privateKey};

            // Info-Meldung anzeigen
            showInfo("Schlüsselpaar erfolgreich entsperrt und geladen");
            
            // Zusätzlich Toast anzeigen
            UiUtils.showToast(requireContext(), "Passwort korrekt ✓");
        } catch (Exception e) {
            // Fehlermeldung anzeigen
            showError("Falsches Passwort oder beschädigter Schlüssel");
            
            // Zusätzlich Toast anzeigen
            UiUtils.showToast(requireContext(), "Falsches Passwort ✗");
        }
    }

    private void exportPublicKey(RsaKeyPair keyPair) {
        try {
            // PEM-Format erstellen
            String pemPublicKey = RsaUtils.publicKeyToPem(keyPair.getPublicKey());

            // Datei speichern
            File outputDir = new File(requireContext().getExternalFilesDir(null), "keys");
            if (!outputDir.exists()) {
                outputDir.mkdirs();
            }

            File outputFile = new File(outputDir, "public_key_" + keyPair.getName().replaceAll("\\s+", "_") + ".pem");
            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                fos.write(pemPublicKey.getBytes());
            }

            showInfo("Öffentlicher Schlüssel exportiert");

            // Datei teilen
            UiUtils.shareFile(requireContext(), outputFile);
        } catch (Exception e) {
            showError("Fehler beim Exportieren: " + e.getMessage());
        }
    }

    private void exportPrivateKey(RsaKeyPair keyPair) {
        if (keyPair.isEncrypted()) {
            showError("Verschlüsselte private Schlüssel können nicht direkt exportiert werden. Bitte lade sie zuerst.");
            return;
        }

        // Sicherheitswarnung anzeigen
        new AlertDialog.Builder(requireContext())
                .setTitle("Sicherheitswarnung")
                .setMessage("Der private Schlüssel sollte niemals ungeschützt weitergegeben werden. " +
                        "Bist du sicher, dass du ihn exportieren möchtest?")
                .setPositiveButton("Exportieren", (dialog, which) -> {
                    try {
                        // PEM-Format erstellen
                        String pemPrivateKey = RsaUtils.privateKeyToPem(keyPair.getPrivateKey());

                        // Datei speichern
                        File outputDir = new File(requireContext().getExternalFilesDir(null), "keys");
                        if (!outputDir.exists()) {
                            outputDir.mkdirs();
                        }

                        File outputFile = new File(outputDir, "private_key_" + keyPair.getName().replaceAll("\\s+", "_") + ".pem");
                        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                            fos.write(pemPrivateKey.getBytes());
                        }

                        showInfo("Privater Schlüssel exportiert");

                        // Datei teilen
                        UiUtils.shareFile(requireContext(), outputFile);
                    } catch (Exception e) {
                        showError("Fehler beim Exportieren: " + e.getMessage());
                    }
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void deleteKeyPair(RsaKeyPair keyPair) {
        new AlertDialog.Builder(requireContext())
                .setTitle("Schlüsselpaar löschen")
                .setMessage("Möchtest Du dieses Schlüsselpaar wirklich löschen?")
                .setPositiveButton("Löschen", (dialog, which) -> {
                    KeyStorageUtils.deleteRsaKeyPair(requireContext(), keyPair.getId());
                    loadSavedKeyPairs();
                    showInfo("Schlüsselpaar gelöscht");
                })
                .setNegativeButton("Abbrechen", null)
                .show();
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
}