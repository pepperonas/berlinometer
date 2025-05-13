package io.celox.enigma3k1.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.models.AesKey;

/**
 * Adapter für die Anzeige von AES-Schlüsseln in einem RecyclerView
 */
public class AesKeyAdapter extends RecyclerView.Adapter<AesKeyAdapter.KeyViewHolder> {

    private List<AesKey> keys;
    private OnKeyActionListener listener;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault());

    /**
     * Interface für Schlüssel-Aktionen
     */
    public interface OnKeyActionListener {
        void onKeyAction(AesKey key, String action);
    }

    public AesKeyAdapter(List<AesKey> keys, OnKeyActionListener listener) {
        this.keys = keys;
        this.listener = listener;
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
        holder.bind(key, listener);
    }

    @Override
    public int getItemCount() {
        return keys.size();
    }

    static class KeyViewHolder extends RecyclerView.ViewHolder {
        TextView keyName, keyInfo;
        Button loadButton, deleteButton;

        public KeyViewHolder(@NonNull View itemView) {
            super(itemView);
            keyName = itemView.findViewById(R.id.key_name);
            keyInfo = itemView.findViewById(R.id.key_info);
            loadButton = itemView.findViewById(R.id.load_key_button);
            deleteButton = itemView.findViewById(R.id.delete_key_button);
        }

        public void bind(AesKey key, OnKeyActionListener listener) {
            keyName.setText(key.getName());

            // Schlüsselinfo formatieren
            String info = key.getKeySize() + " Bit • Erstellt am " +
                    (key.getCreatedAt() != null ? new SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault()).format(key.getCreatedAt()) : "Unbekannt");
            keyInfo.setText(info);

            // Click-Listener einrichten
            loadButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onKeyAction(key, "load");
                }
            });

            deleteButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onKeyAction(key, "delete");
                }
            });
        }
    }
}