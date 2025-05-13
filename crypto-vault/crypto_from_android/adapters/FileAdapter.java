package io.celox.enigma3k1.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.text.DecimalFormat;
import java.util.List;

import io.celox.enigma3k1.R;
import io.celox.enigma3k1.models.EncryptedFile;

/**
 * Adapter für die Anzeige von Dateien im FileFragment
 */
public class FileAdapter extends RecyclerView.Adapter<FileAdapter.FileViewHolder> {

    private List<EncryptedFile> files;
    private FileActionListener listener;

    /**
     * Interface für Datei-Aktionen
     */
    public interface FileActionListener {
        void onFileAction(EncryptedFile file, String action);
    }

    public FileAdapter(List<EncryptedFile> files, FileActionListener listener) {
        this.files = files;
        this.listener = listener;
    }

    @NonNull
    @Override
    public FileViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_file, parent, false);
        return new FileViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull FileViewHolder holder, int position) {
        EncryptedFile file = files.get(position);
        holder.bind(file, listener);
    }

    @Override
    public int getItemCount() {
        return files.size();
    }

    static class FileViewHolder extends RecyclerView.ViewHolder {
        TextView fileName, fileInfo, statusText;
        ImageView fileIcon;
        ProgressBar progressBar;
        Button openButton, shareButton, deleteButton;

        private static final DecimalFormat sizeFormat = new DecimalFormat("#,##0.00");

        public FileViewHolder(@NonNull View itemView) {
            super(itemView);
            fileName = itemView.findViewById(R.id.file_name);
            fileInfo = itemView.findViewById(R.id.file_info);
            statusText = itemView.findViewById(R.id.status_text);
            fileIcon = itemView.findViewById(R.id.file_icon);
            progressBar = itemView.findViewById(R.id.progress_bar);
            openButton = itemView.findViewById(R.id.open_button);
            shareButton = itemView.findViewById(R.id.share_button);
            deleteButton = itemView.findViewById(R.id.delete_button);
        }

        public void bind(EncryptedFile file, FileActionListener listener) {
            fileName.setText(file.getFileName());

            // Dateigröße formatieren
            String sizeText = "";
            if (file.getFileSize() > 0) {
                if (file.getFileSize() < 1024) {
                    sizeText = file.getFileSize() + " B";
                } else if (file.getFileSize() < 1024 * 1024) {
                    sizeText = sizeFormat.format(file.getFileSize() / 1024.0) + " KB";
                } else {
                    sizeText = sizeFormat.format(file.getFileSize() / (1024.0 * 1024.0)) + " MB";
                }
            }

            // Info-Text
            fileInfo.setText(sizeText);

            // Status und Fortschritt anzeigen
            switch (file.getStatus()) {
                case EncryptedFile.STATUS_READY:
                    statusText.setText(R.string.status_ready);
                    statusText.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                    break;

                case EncryptedFile.STATUS_PROCESSING:
                    statusText.setVisibility(View.GONE);
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(file.getProgress());
                    break;

                case EncryptedFile.STATUS_COMPLETED:
                    statusText.setText(R.string.status_completed);
                    statusText.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                    break;

                case EncryptedFile.STATUS_ERROR:
                    statusText.setText(R.string.status_error);
                    statusText.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                    break;
            }

            // Buttons aktivieren/deaktivieren basierend auf Status
            boolean isCompleted = file.getStatus().equals(EncryptedFile.STATUS_COMPLETED);
            openButton.setEnabled(isCompleted);
            shareButton.setEnabled(isCompleted);
            openButton.setAlpha(isCompleted ? 1.0f : 0.5f);
            shareButton.setAlpha(isCompleted ? 1.0f : 0.5f);

            // Click-Listener einrichten
            openButton.setOnClickListener(v -> {
                if (listener != null && isCompleted) {
                    listener.onFileAction(file, "open");
                }
            });

            shareButton.setOnClickListener(v -> {
                if (listener != null && isCompleted) {
                    listener.onFileAction(file, "share");
                }
            });

            deleteButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onFileAction(file, "delete");
                }
            });
        }
    }
}