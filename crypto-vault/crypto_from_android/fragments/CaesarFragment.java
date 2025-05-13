package io.celox.enigma3k1.fragments;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButtonToggleGroup;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.crypto.CaesarUtils;

/**
 * Fragment für die Caesar-Verschlüsselung
 */
public class CaesarFragment extends Fragment {

    private EditText inputText, outputText, shiftInput;
    private SeekBar shiftSeekBar;
    private MaterialButtonToggleGroup modeToggleGroup;
    private Button processButton, bruteForceButton, randomShiftButton;
    private com.google.android.material.button.MaterialButton copyOutputButton;
    private TextView errorText, infoText, shiftExampleText;

    private String currentMode = "encrypt"; // "encrypt" oder "decrypt"
    private int shift = 3; // Standard-Verschiebung

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_caesar, container, false);

        // UI-Komponenten initialisieren
        initViews(view);

        // Events einrichten
        setupEventListeners();

        // Standardwerte setzen
        updateShiftExample();

        return view;
    }

    private void initViews(View view) {
        inputText = view.findViewById(R.id.input_text);
        outputText = view.findViewById(R.id.output_text);
        shiftInput = view.findViewById(R.id.shift_input);
        shiftSeekBar = view.findViewById(R.id.shift_seekbar);
        modeToggleGroup = view.findViewById(R.id.mode_toggle_group);
        processButton = view.findViewById(R.id.process_button);
        bruteForceButton = view.findViewById(R.id.bruteforce_button);
        randomShiftButton = view.findViewById(R.id.random_shift_button);
        copyOutputButton = view.findViewById(R.id.copy_output_button);
        errorText = view.findViewById(R.id.error_text);
        infoText = view.findViewById(R.id.info_text);
        shiftExampleText = view.findViewById(R.id.shift_example_text);

        // Anfangswert setzen
        shiftInput.setText(String.valueOf(shift));
        shiftSeekBar.setProgress(shift - 1); // SeekBar Range: 0-24 für Shift 1-25
    }

    private void setupEventListeners() {
        // Mode Toggle
        modeToggleGroup.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                if (checkedId == R.id.encrypt_button) {
                    currentMode = "encrypt";
                    processButton.setText(R.string.encrypt_button);
                } else if (checkedId == R.id.decrypt_button) {
                    currentMode = "decrypt";
                    processButton.setText(R.string.decrypt_button);
                }
            }
        });

        // Shift SeekBar
        shiftSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                // SeekBar gibt 0-24 zurück, wir wollen 1-25
                shift = progress + 1;
                if (fromUser) {
                    shiftInput.setText(String.valueOf(shift));
                }
                updateShiftExample();
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        // Shift Input
        shiftInput.setOnFocusChangeListener((v, hasFocus) -> {
            if (!hasFocus) {
                try {
                    int value = Integer.parseInt(shiftInput.getText().toString());
                    if (value < 1) value = 1;
                    if (value > 25) value = 25;
                    shift = value;
                    shiftInput.setText(String.valueOf(shift));
                    shiftSeekBar.setProgress(shift - 1);
                    updateShiftExample();
                } catch (NumberFormatException e) {
                    shiftInput.setText(String.valueOf(shift));
                }
            }
        });

        // Zufällige Verschiebung
        randomShiftButton.setOnClickListener(v -> {
            shift = (int) (Math.random() * 25) + 1; // 1-25
            shiftInput.setText(String.valueOf(shift));
            shiftSeekBar.setProgress(shift - 1);
            updateShiftExample();
            showInfo("Zufällige Verschiebung generiert");
        });

        // Verschlüsseln/Entschlüsseln
        processButton.setOnClickListener(v -> processText());

        // Brute Force
        bruteForceButton.setOnClickListener(v -> performBruteForce());

        // Output kopieren
        copyOutputButton.setOnClickListener(v -> copyToClipboard(outputText.getText().toString()));
    }

    private void updateShiftExample() {
        String example = "Beispiel (Shift " + shift + "): ";
        example += "A → " + CaesarUtils.shiftChar('A', shift, true);
        example += ", B → " + CaesarUtils.shiftChar('B', shift, true);
        shiftExampleText.setText(example);
    }

    private void processText() {
        hideMessages();

        String input = inputText.getText().toString();

        if (input.isEmpty()) {
            showError("Bitte Text eingeben");
            return;
        }

        String result = CaesarUtils.caesarCipher(input, shift, currentMode.equals("encrypt"));
        outputText.setText(result);
    }

    private void performBruteForce() {
        hideMessages();

        String input = inputText.getText().toString();

        if (input.isEmpty()) {
            showError("Bitte Text eingeben");
            return;
        }

        // Alle möglichen Entschlüsselungen generieren
        StringBuilder bruteForceResult = new StringBuilder();
        for (int i = 1; i <= 25; i++) {
            String decrypted = CaesarUtils.caesarCipher(input, i, false);
            bruteForceResult.append("Shift ").append(i).append(": ").append(decrypted).append("\n\n");
        }

        outputText.setText(bruteForceResult.toString().trim());

        // Auf Entschlüsselungs-Modus wechseln
        modeToggleGroup.check(R.id.decrypt_button);
        currentMode = "decrypt";
    }

    private void copyToClipboard(String text) {
        if (text.isEmpty()) return;

        ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Caesar-Text", text);
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

        // Nach 2 Sekunden ausblenden
        infoText.postDelayed(() -> {
            if (isAdded()) {
                infoText.setVisibility(View.GONE);
            }
        }, 2000);
    }

    private void hideMessages() {
        errorText.setVisibility(View.GONE);
        infoText.setVisibility(View.GONE);
    }
}