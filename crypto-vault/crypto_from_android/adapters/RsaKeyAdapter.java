package io.celox.enigma3k1.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.models.RsaKeyPair;
import io.celox.enigma3k1.utils.UiUtils;

/**
 * Adapter für die Anzeige von RSA-Schlüsselpaaren in einem RecyclerView
 */
public class RsaKeyAdapter extends RecyclerView.Adapter<RsaKeyAdapter.KeyViewHolder> {

    private List<RsaKeyPair> keyPairs;
    private KeyActionListener listener;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault());

    /**
     * Interface für Schlüsselpaar-Aktionen
     */
    public interface KeyActionListener {
        void onKeyAction(RsaKeyPair keyPair, String action);
    }

    public RsaKeyAdapter(List<RsaKeyPair> keyPairs, KeyActionListener listener) {
        this.keyPairs = keyPairs;
        this.listener = listener;
    }

    @NonNull
    @Override
    public KeyViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_rsa_key, parent, false);
        return new KeyViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull KeyViewHolder holder, int position) {
        RsaKeyPair keyPair = keyPairs.get(position);
        holder.bind(keyPair, listener);
    }

    @Override
    public int getItemCount() {
        return keyPairs.size();
    }

    static class KeyViewHolder extends RecyclerView.ViewHolder {
        TextView keyName, keyInfo;
        Button loadButton, exportPublicButton, exportPrivateButton, deleteButton;
        ImageView lockIcon;

        public KeyViewHolder(@NonNull View itemView) {
            super(itemView);
            keyName = itemView.findViewById(R.id.key_name);
            keyInfo = itemView.findViewById(R.id.key_info);
            loadButton = itemView.findViewById(R.id.load_key_button);
            exportPublicButton = itemView.findViewById(R.id.export_public_button);
            exportPrivateButton = itemView.findViewById(R.id.export_private_button);
            deleteButton = itemView.findViewById(R.id.delete_key_button);
            lockIcon = itemView.findViewById(R.id.lock_icon);
        }

        public void bind(RsaKeyPair keyPair, KeyActionListener listener) {
            keyName.setText(keyPair.getName());

            // Schlüsselinfo formatieren
            String info = keyPair.getKeySize() + " Bit • Erstellt am " +
                    (keyPair.getCreatedAt() != null ? UiUtils.formatDate(keyPair.getCreatedAt()) : "Unbekannt");
            keyInfo.setText(info);

            // Schloss-Icon anzeigen, wenn der private Schlüssel verschlüsselt ist
            lockIcon.setVisibility(keyPair.isEncrypted() ? View.VISIBLE : View.GONE);

            // Angepasster Text für den Laden-Button
            if (keyPair.isEncrypted()) {
                loadButton.setText(R.string.unlock_key);
            } else {
                loadButton.setText(R.string.load_key);
            }

            // Private-Key-Export-Button deaktivieren, wenn der Schlüssel verschlüsselt ist
            exportPrivateButton.setEnabled(!keyPair.isEncrypted());
            exportPrivateButton.setAlpha(keyPair.isEncrypted() ? 0.5f : 1.0f);

            // Click-Listener einrichten
            loadButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onKeyAction(keyPair, "load");
                }
            });

            exportPublicButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onKeyAction(keyPair, "copy_public");
                }
            });

            exportPrivateButton.setOnClickListener(v -> {
                if (listener != null && !keyPair.isEncrypted()) {
                    listener.onKeyAction(keyPair, "export_private");
                }
            });

            deleteButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onKeyAction(keyPair, "delete");
                }
            });
        }
    }
}