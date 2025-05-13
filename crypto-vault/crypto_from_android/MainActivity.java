package io.celox.enigma3k1;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.navigation.NavigationView;
import com.google.android.material.textfield.TextInputLayout;

import java.io.File;
import java.util.List;

import io.celox.enigma3k1.fragments.AesFragment;
import io.celox.enigma3k1.fragments.CaesarFragment;
import io.celox.enigma3k1.fragments.FileFragment;
import io.celox.enigma3k1.fragments.RsaFragment;
import io.celox.enigma3k1.models.AesKey;
import io.celox.enigma3k1.models.RsaKeyPair;
import io.celox.enigma3k1.utils.KeyExportUtils;
import io.celox.enigma3k1.utils.KeyStorageUtils;
import io.celox.enigma3k1.utils.UiUtils;

public class MainActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private DrawerLayout drawerLayout;
    private NavigationView navigationView;
    private TextView toolbarTitle;
    private Toolbar toolbar;
    
    private Uri selectedImportFile = null;
    
    // Activity Result Launchers
    private final ActivityResultLauncher<Intent> importFileLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        selectedImportFile = uri;
                        showImportPasswordDialog(uri);
                    }
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        setupUI();

        // Standardfragment beim Start
        if (savedInstanceState == null) {
            loadFragment(new AesFragment(), "AES Verschlüsselung");
            navigationView.setCheckedItem(R.id.nav_aes);
        }
    }

    private void setupUI() {
        // Toolbar einrichten
        toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        getSupportActionBar().setDisplayShowTitleEnabled(false);
        toolbarTitle = findViewById(R.id.toolbar_title);

        // Navigation Drawer einrichten
        drawerLayout = findViewById(R.id.drawer_layout);
        navigationView = findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);

        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawerLayout, toolbar,
                R.string.navigation_drawer_open, R.string.navigation_drawer_close
        );
        drawerLayout.addDrawerListener(toggle);
        toggle.syncState();
    }

    private void loadFragment(Fragment fragment, String title) {
        // Fragment laden
        getSupportFragmentManager().beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();

        // Titel aktualisieren
        toolbarTitle.setText(title);

        // Drawer schließen
        drawerLayout.closeDrawer(GravityCompat.START);
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.nav_aes) {
            loadFragment(new AesFragment(), "AES Verschlüsselung");
        } else if (id == R.id.nav_rsa) {
            loadFragment(new RsaFragment(), "RSA Verschlüsselung");
        } else if (id == R.id.nav_caesar) {
            loadFragment(new CaesarFragment(), "Caesar Verschlüsselung");
        } else if (id == R.id.nav_files) {
            loadFragment(new FileFragment(), "Dateiverschlüsselung");
        } else if (id == R.id.nav_export) {
            // Schlüsselexport Dialogfenster anzeigen
            showExportKeysDialog();
        } else if (id == R.id.nav_import) {
            // Schlüsselimport starten
            showImportKeysDialog();
        }

        return true;
    }
    
    /**
     * Zeigt den Dialog für den Schlüsselexport an
     */
    private void showExportKeysDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_export_keys, null);
        
        // UI-Elemente
        final CheckBox usePasswordCheckbox = dialogView.findViewById(R.id.use_password_checkbox);
        final TextInputLayout passwordLayout = dialogView.findViewById(R.id.password_layout);
        final TextInputLayout confirmPasswordLayout = dialogView.findViewById(R.id.confirm_password_layout);
        final EditText passwordInput = dialogView.findViewById(R.id.password_input);
        final EditText confirmPasswordInput = dialogView.findViewById(R.id.confirm_password_input);
        final TextView keySummary = dialogView.findViewById(R.id.key_summary);
        
        // Schlüsselzusammenfassung anzeigen
        List<AesKey> aesKeys = KeyStorageUtils.loadAesKeys(this);
        List<RsaKeyPair> rsaKeys = KeyStorageUtils.loadRsaKeyPairs(this);
        keySummary.setText(String.format("Export: %d AES Schlüssel, %d RSA Schlüsselpaare", 
                aesKeys.size(), rsaKeys.size()));
        
        // Passwort-Checkbox Change Listener
        usePasswordCheckbox.setOnCheckedChangeListener((buttonView, isChecked) -> {
            passwordLayout.setVisibility(isChecked ? View.VISIBLE : View.GONE);
            confirmPasswordLayout.setVisibility(isChecked ? View.VISIBLE : View.GONE);
        });
        
        // Dialog erstellen
        AlertDialog.Builder builder = new AlertDialog.Builder(this)
                .setTitle(R.string.nav_export_keys)
                .setView(dialogView)
                .setPositiveButton(R.string.export_key, null) // Wird unten überschrieben
                .setNegativeButton(R.string.cancel, null);
        
        // Dialog anzeigen
        AlertDialog dialog = builder.create();
        dialog.show();
        
        // Positiven Button überschreiben, damit Dialog nicht automatisch geschlossen wird
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String password = null;
            
            // Passwort validieren, wenn aktiviert
            if (usePasswordCheckbox.isChecked()) {
                password = passwordInput.getText().toString();
                String confirmPassword = confirmPasswordInput.getText().toString();
                
                if (password.isEmpty()) {
                    passwordLayout.setError("Bitte gib ein Passwort ein");
                    return;
                }
                
                if (!password.equals(confirmPassword)) {
                    confirmPasswordLayout.setError("Passwörter stimmen nicht überein");
                    return;
                }
            }
            
            // Exportieren
            exportKeys(password);
            dialog.dismiss();
        });
    }
    
    /**
     * Zeigt den Dialog für den Schlüsselimport an
     */
    private void showImportKeysDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_import_keys, null);
        
        // UI-Elemente
        final MaterialButton selectFileButton = dialogView.findViewById(R.id.select_file_button);
        final TextView selectedFileText = dialogView.findViewById(R.id.selected_file_text);
        
        // Dialog erstellen
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(R.string.nav_import_keys)
                .setView(dialogView)
                .setPositiveButton(R.string.import_key, null) // Wird überschrieben
                .setNegativeButton(R.string.cancel, null)
                .create();
        
        // File-Button Click Listener
        selectFileButton.setOnClickListener(v -> {
            // Datei-Auswahl Intent starten
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            importFileLauncher.launch(Intent.createChooser(intent, "Schlüsseldatei auswählen"));
            dialog.dismiss();
        });
        
        dialog.show();
    }
    
    /**
     * Zeigt den Passwort-Dialog für den Import an
     */
    private void showImportPasswordDialog(Uri fileUri) {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_import_keys, null);
        
        // UI-Elemente
        final MaterialButton selectFileButton = dialogView.findViewById(R.id.select_file_button);
        final TextView selectedFileText = dialogView.findViewById(R.id.selected_file_text);
        final TextInputLayout passwordLayout = dialogView.findViewById(R.id.password_layout);
        final EditText passwordInput = dialogView.findViewById(R.id.password_input);
        
        // UI anpassen
        selectFileButton.setVisibility(View.GONE);
        selectedFileText.setVisibility(View.VISIBLE);
        passwordLayout.setVisibility(View.VISIBLE);
        
        // Dateipfad anzeigen
        String fileName = getFileNameFromUri(fileUri);
        selectedFileText.setText("Ausgewählte Datei: " + fileName);
        
        // Dialog erstellen
        AlertDialog.Builder builder = new AlertDialog.Builder(this)
                .setTitle(R.string.enter_password_to_unlock)
                .setView(dialogView)
                .setPositiveButton(R.string.import_key, null) // Wird überschrieben
                .setNegativeButton(R.string.cancel, null);
        
        // Dialog anzeigen
        AlertDialog dialog = builder.create();
        dialog.show();
        
        // Positiven Button überschreiben
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String password = passwordInput.getText().toString();
            if (password.isEmpty()) {
                password = null; // Kein Passwort
            }
            
            // Schlüssel importieren
            importKeys(fileUri, password);
            dialog.dismiss();
        });
    }
    
    /**
     * Exportiert Schlüssel mit optionalem Passwort
     */
    private void exportKeys(String password) {
        // Datei-Verzeichnis erstellen
        File exportDir = new File(getExternalFilesDir(null), "keys");
        
        // Export durchführen
        File exportFile = KeyExportUtils.exportKeys(this, exportDir, password);
        
        if (exportFile != null) {
            // Erfolg!
            Toast.makeText(this, "Schlüssel erfolgreich exportiert", Toast.LENGTH_SHORT).show();
            
            // Datei teilen
            UiUtils.shareFile(this, exportFile);
        } else {
            // Fehler
            Toast.makeText(this, "Fehler beim Exportieren der Schlüssel", Toast.LENGTH_SHORT).show();
        }
    }
    
    /**
     * Importiert Schlüssel aus einer Datei
     */
    private void importKeys(Uri fileUri, String password) {
        boolean success = KeyExportUtils.importKeys(this, fileUri, password);
        
        if (success) {
            // Erfolg!
            Toast.makeText(this, "Schlüssel erfolgreich importiert", Toast.LENGTH_SHORT).show();
        } else {
            // Fehler
            Toast.makeText(this, "Fehler beim Importieren der Schlüssel. " + 
                    (password == null ? "Benötigt eventuell ein Passwort." : "Falsches Passwort oder ungültiges Format."), 
                    Toast.LENGTH_LONG).show();
        }
    }
    
    /**
     * Extrahiert den Dateinamen aus einer URI
     */
    private String getFileNameFromUri(Uri uri) {
        String fileName = uri.getLastPathSegment();
        if (fileName == null) {
            fileName = uri.toString();
        }
        return fileName;
    }

    @Override
    public void onBackPressed() {
        // Drawer zuerst schließen, wenn geöffnet
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }
}