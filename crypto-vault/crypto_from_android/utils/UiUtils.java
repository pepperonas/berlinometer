package io.celox.enigma3k1.utils;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.google.android.material.snackbar.Snackbar;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Hilfsklasse für UI-Operationen
 */
public class UiUtils {

    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault());

    /**
     * Zeigt eine kurze Toast-Nachricht an
     *
     * @param context Kontext
     * @param message Anzuzeigende Nachricht
     */
    public static void showToast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }

    /**
     * Zeigt eine lange Toast-Nachricht an
     *
     * @param context Kontext
     * @param message Anzuzeigende Nachricht
     */
    public static void showLongToast(Context context, String message) {
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }

    /**
     * Zeigt einen Snackbar mit einer Nachricht an
     *
     * @param view View, an der die Snackbar angezeigt werden soll
     * @param message Anzuzeigende Nachricht
     */
    public static void showSnackbar(View view, String message) {
        Snackbar.make(view, message, Snackbar.LENGTH_SHORT).show();
    }

    /**
     * Zeigt einen Snackbar mit einer Nachricht und einem Aktions-Button an
     *
     * @param view View, an der die Snackbar angezeigt werden soll
     * @param message Anzuzeigende Nachricht
     * @param actionText Text für den Aktionsbutton
     * @param action Aktion, die beim Klick auf den Button ausgeführt werden soll
     */
    public static void showSnackbarWithAction(View view, String message, String actionText, View.OnClickListener action) {
        Snackbar.make(view, message, Snackbar.LENGTH_LONG)
                .setAction(actionText, action)
                .show();
    }

    /**
     * Versteckt die Tastatur
     *
     * @param context Kontext
     * @param view Fokussierte View
     */
    public static void hideKeyboard(Context context, View view) {
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    /**
     * Formatiert ein Datum im Format "dd.MM.yyyy HH:mm"
     *
     * @param date Zu formatierendes Datum
     * @return Formatiertes Datum als String
     */
    public static String formatDate(Date date) {
        return DATE_FORMAT.format(date);
    }

    /**
     * Formatiert eine Dateigröße in lesbare Form (B, KB, MB, GB)
     *
     * @param bytes Dateigröße in Bytes
     * @return Formatierte Dateigröße als String
     */
    public static String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format(Locale.getDefault(), "%.2f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format(Locale.getDefault(), "%.2f MB", bytes / (1024.0 * 1024.0));
        } else {
            return String.format(Locale.getDefault(), "%.2f GB", bytes / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * Teilt eine Datei mit anderen Apps
     *
     * @param context Kontext
     * @param file Zu teilende Datei
     */
    public static void shareFile(Context context, File file) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        Uri fileUri;

        // FileProvider für Android N und höher verwenden
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            fileUri = FileProvider.getUriForFile(context,
                    context.getApplicationContext().getPackageName() + ".fileprovider",
                    file);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            fileUri = Uri.fromFile(file);
        }

        shareIntent.setType(getMimeType(file.getName()));
        shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
        context.startActivity(Intent.createChooser(shareIntent, "Datei teilen über"));
    }

    /**
     * Öffnet eine Datei mit einer geeigneten App
     *
     * @param context Kontext
     * @param file Zu öffnende Datei
     */
    public static void openFile(Context context, File file) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        Uri fileUri;

        // FileProvider für Android N und höher verwenden
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            fileUri = FileProvider.getUriForFile(context,
                    context.getApplicationContext().getPackageName() + ".fileprovider",
                    file);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            fileUri = Uri.fromFile(file);
        }

        intent.setDataAndType(fileUri, getMimeType(file.getName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        // Prüfen, ob es eine App gibt, die diese Datei öffnen kann
        if (intent.resolveActivity(context.getPackageManager()) != null) {
            context.startActivity(intent);
        } else {
            showToast(context, "Keine App zum Öffnen dieser Datei gefunden");
        }
    }

    /**
     * Versucht, den MIME-Typ einer Datei anhand ihrer Erweiterung zu bestimmen
     *
     * @param fileName Dateiname mit Erweiterung
     * @return MIME-Typ oder "application/octet-stream" als Fallback
     */
    private static String getMimeType(String fileName) {
        String extension = getFileExtension(fileName);

        switch (extension.toLowerCase()) {
            case "txt":
                return "text/plain";
            case "pdf":
                return "application/pdf";
            case "doc":
            case "docx":
                return "application/msword";
            case "xls":
            case "xlsx":
                return "application/vnd.ms-excel";
            case "ppt":
            case "pptx":
                return "application/vnd.ms-powerpoint";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "mp3":
                return "audio/mpeg";
            case "mp4":
                return "video/mp4";
            case "zip":
                return "application/zip";
            case "enc":
                return "application/octet-stream";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * Extrahiert die Dateierweiterung aus einem Dateinamen
     *
     * @param fileName Dateiname mit Erweiterung
     * @return Dateierweiterung oder leerer String, wenn keine Erweiterung gefunden wurde
     */
    private static String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot != -1 && lastDot < fileName.length() - 1) {
            return fileName.substring(lastDot + 1);
        }
        return "";
    }
}