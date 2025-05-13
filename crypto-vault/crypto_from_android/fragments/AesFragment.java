package io.celox.enigma3k1.fragments;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
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

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.adapters.AesKeyAdapter;
import io.celox.enigma3k1.crypto.AesUtils;
import io.celox.enigma3k1.models.AesKey;
import io.celox.enigma3k1.utils.KeyStorageUtils;

public class AesFragment extends Fragment {

    private EditText inputText, outputText, passwordInput, keyNameInput;
    private MaterialButtonToggleGroup modeToggleGroup;
    private Button processButton, generateKeyButton, saveKeyButton;
    private com.google.android.material.button.MaterialButton copyOutputButton;
    private Spinner keySizeSpinner;
    private RecyclerView savedKeysRecyclerView;
    private TextView errorText, infoText;

    private AesKeyAdapter keyAdapter;
    private List<AesKey> savedKeys = new ArrayList<>();

    private String currentMode = "encrypt"; // "encrypt" oder "decrypt"
    private int keySize = 256; // Standard: 256 Bit

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_aes, container, false);

        // UI-Komponenten initialisieren
        initViews(view);

        // Events einrichten
        setupEventListeners();

        // Gespeicherte Schlüssel laden
        loadSavedKeys();

        return view;
    }

    private void initViews(View view) {
        inputText = view.findViewById(R.id.input_text);
        outputText = view.findViewById(R.id.output_text);
        passwordInput = view.findViewById(R.id.password_input);
        keyNameInput = view.findViewById(R.id.key_name_input);
        // showPasswordToggle wurde entfernt und durch das integrierte Icon des TextInputLayouts ersetzt
        modeToggleGroup = view.findViewById(R.id.mode_toggle_group);
        processButton = view.findViewById(R.id.process_button);
        generateKeyButton = view.findViewById(R.id.generate_key_button);
        saveKeyButton = view.findViewById(R.id.save_key_button);
        copyOutputButton = view.findViewById(R.id.copy_output_button);
        keySizeSpinner = view.findViewById(R.id.key_size_spinner);
        savedKeysRecyclerView = view.findViewById(R.id.saved_keys_recycler);
        errorText = view.findViewById(R.id.error_text);
        infoText = view.findViewById(R.id.info_text);

        // RecyclerView einrichten
        savedKeysRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        keyAdapter = new AesKeyAdapter(savedKeys, this::onKeyAction);
        savedKeysRecyclerView.setAdapter(keyAdapter);

        // Spinner einrichten
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
                    inputText.setHint(R.string.aes_encrypt_hint);
                    processButton.setText(R.string.encrypt_button);
                } else if (checkedId == R.id.decrypt_button) {
                    currentMode = "decrypt";
                    inputText.setHint(R.string.aes_decrypt_hint);
                    processButton.setText(R.string.decrypt_button);
                }
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

        // Verschlüsseln/Entschlüsseln
        processButton.setOnClickListener(v -> processText());

        // Schlüssel speichern
        saveKeyButton.setOnClickListener(v -> saveKey());

        // Output kopieren
        copyOutputButton.setOnClickListener(v -> copyToClipboard(outputText.getText().toString()));
    }

    private void loadSavedKeys() {
        savedKeys.clear();
        savedKeys.addAll(KeyStorageUtils.loadAesKeys(getContext(), "text-encryption"));
        keyAdapter.notifyDataSetChanged();
    }

    private void onKeyAction(AesKey key, String action) {
        switch (action) {
            case "load":
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
                Context context = getContext();
                if (context != null) {
                    Toast.makeText(context, "Schlüssel erfolgreich geladen ✓", Toast.LENGTH_SHORT).show();
                }
                break;

            case "export":
                exportKey(key);
                break;

            case "delete":
                deleteKey(key);
                break;
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

    private void processText() {
        hideMessages();

        String input = inputText.getText().toString();
        String password = passwordInput.getText().toString();

        if (input.isEmpty()) {
            showError("Bitte Text eingeben");
            return;
        }

        if (password.isEmpty()) {
            showError("Bitte Passwort eingeben oder generieren");
            return;
        }

        try {
            String result;
            if (currentMode.equals("encrypt")) {
                result = AesUtils.encrypt(input, password, keySize);
            } else {
                result = AesUtils.decrypt(input, password, keySize);
            }
            outputText.setText(result);
        } catch (Exception e) {
            showError("Fehler: " + e.getMessage());
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
        newKey.setType("text-encryption");
        newKey.setCreatedAt(new Date());

        KeyStorageUtils.saveAesKey(getContext(), newKey);
        loadSavedKeys();
        keyNameInput.setText("");
        showInfo("Schlüssel erfolgreich gespeichert");
    }

    private void deleteKey(AesKey key) {
        new AlertDialog.Builder(getContext())
                .setTitle("Schlüssel löschen")
                .setMessage("Möchtest Du diesen Schlüssel wirklich löschen?")
                .setPositiveButton("Löschen", (dialog, which) -> {
                    KeyStorageUtils.deleteAesKey(getContext(), key.getId());
                    loadSavedKeys();
                    showInfo("Schlüssel erfolgreich gelöscht");
                })
                .setNegativeButton("Abbrechen", null)
                .show();
    }

    private void exportKey(AesKey key) {
        // TODO: Implementieren des PEM-Exports
        showInfo("Export-Funktion wird in einer späteren Version implementiert");
    }

    private void copyToClipboard(String text) {
        if (text.isEmpty()) return;

        ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Verschlüsselter Text", text);
        clipboard.setPrimaryClip(clip);

        showInfo("In Zwischenablage kopiert");
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        infoText.setVisibility(View.GONE);
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

    private void hideMessages() {
        errorText.setVisibility(View.GONE);
        infoText.setVisibility(View.GONE);
    }
}