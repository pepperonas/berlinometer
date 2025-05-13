package io.celox.enigma3k1.crypto;

/**
 * Utility-Klasse für die Caesar-Verschlüsselung
 */
public class CaesarUtils {

    /**
     * Verschlüsselt oder entschlüsselt einen Text mit der Caesar-Chiffre
     *
     * @param text Text, der verschlüsselt/entschlüsselt werden soll
     * @param shift Verschiebungswert (1-25)
     * @param encrypt True für Verschlüsselung, False für Entschlüsselung
     * @return Verschlüsselter/Entschlüsselter Text
     */
    public static String caesarCipher(String text, int shift, boolean encrypt) {
        if (shift < 1 || shift > 25) {
            throw new IllegalArgumentException("Shift muss zwischen 1 und 25 liegen");
        }

        // Bei Entschlüsselung die Verschiebung umkehren
        int actualShift = encrypt ? shift : (26 - shift) % 26;

        StringBuilder result = new StringBuilder();

        for (char c : text.toCharArray()) {
            result.append(shiftChar(c, actualShift, true));
        }

        return result.toString();
    }

    /**
     * Verschiebt einen einzelnen Buchstaben im Alphabet
     *
     * @param c Der zu verschiebende Buchstabe
     * @param shift Verschiebungswert
     * @param preserveCase Groß-/Kleinschreibung beibehalten
     * @return Verschobener Buchstabe
     */
    public static char shiftChar(char c, int shift, boolean preserveCase) {
        // Überprüfe, ob der Character ein Buchstabe ist
        if (!Character.isLetter(c)) {
            return c; // Keine Veränderung für Nicht-Buchstaben
        }

        char base = preserveCase ? (Character.isUpperCase(c) ? 'A' : 'a') : 'A';
        return (char) (((c - base + shift) % 26) + base);
    }

    /**
     * Generiert alle möglichen Entschlüsselungen (Brute Force)
     *
     * @param ciphertext Verschlüsselter Text
     * @return Array mit allen 25 möglichen Entschlüsselungen
     */
    public static String[] bruteForce(String ciphertext) {
        String[] results = new String[25];

        for (int i = 1; i <= 25; i++) {
            results[i-1] = caesarCipher(ciphertext, i, false);
        }

        return results;
    }
}