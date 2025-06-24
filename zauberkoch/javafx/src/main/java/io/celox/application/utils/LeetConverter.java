package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class LeetConverter {

    public static String toLeetSpeak(String input) {
        if (input == null || input.isEmpty()) {
            return "1337";
        }
        // Leet Speak Umwandlungstabelle
        StringBuilder result = new StringBuilder();
        for (char c : input.toCharArray()) {
            switch (c) {
                case 'a':
                    result.append('4');
                    break;
                case 'b':
                    result.append('8');
                    break;
                case 'e':
                    result.append('3');
                    break;
                case 'g':
                    result.append('9');
                    break;
                case 'h':
                    result.append('4');
                    break;
                case 'i':
                    result.append('1');
                    break;
                case 'l':
                    result.append('1');
                    break;
                case 'o':
                    result.append('0');
                    break;
                case 's':
                    result.append('5');
                    break;
                case 't':
                    result.append('7');
                    break;
                case 'z':
                    result.append('2');
                    break;
                default:
                    result.append(c);
                    break; // Behalte nicht-konvertierbare Zeichen
            }
        }

        return result.toString();
    }

}
