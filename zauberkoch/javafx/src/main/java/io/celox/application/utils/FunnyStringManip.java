package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */
public class FunnyStringManip {

    public static String getPositive() {
        String[] ary = {
                "✅ Erfolgreich erledigt!",
                "💾 Speichern war ein Erfolg!",
                "🔄 Update abgeschlossen!",
                "🚀 Alles bereit!",
                "🏆 Mission erfüllt!",
                "👏 Gut gemacht!",
                "🔥 Läuft perfekt!",
                "👍 Top! Hat geklappt!",
                "✅ Daten erfolgreich aktualisiert!",
                "🎉 Nice! Hat funktioniert!",
                "🔒 Deine Änderungen sind gesichert!",
                "✨ Yes! Erfolgreich gespeichert!",
                "✅ Check! Alles erledigt!",
                "🎯 Fertig! Und zwar erfolgreich!",
                "📦 Auftrag ausgeführt!",
                "🚀 Dein Update ist live!",
                "🌟 Super! Alles gespeichert!",
                "📝 Eingabe erfolgreich übernommen!",
                "🎊 Tadaa! Alles gespeichert!",
                "⚡ Boom! Daten aktualisiert!",
                "✅ Bestätigung: Erfolgreich abgeschlossen!",
                "👌 Sauber! Alles passt!",
                "🔝 Perfekt! Alles drin!",
                "💡 Gute Entscheidung – hat geklappt!",
                "🚀 Top! Auftrag ausgeführt!",
                "✅ Speichern? Check!",
                "🙌 Kein Problem – alles erledigt!",
                "👆 Ein Klick – und fertig!",
                "✨ Super! Ist jetzt aktiv!",
                "⚡ Zack! Update läuft!",
                "🎯 Nice! Deine Änderungen sind drin!",
                "🏅 Erfolg! Alles übernommen!",
                "⚡ Schnell & erfolgreich erledigt!",
                "🎈 Dein Wunsch ist jetzt Realität!",
                "💾 Speichern war easy!",
                "✅ Check, dein Update ist online!",
                "📂 Neue Daten? Sind jetzt da!",
                "🔐 Dein Input ist gesichert!",
                "🏁 Fertig & startklar!",
                "💎 Mega! Alles gespeichert!",
                "🚀 Läuft bei dir! Hat geklappt!",
                "👌 Super easy – hat funktioniert!",
                "🎯 Alles bestens! Erfolg!",
                "🚀 Dein Plan ist jetzt Realität!",
                "✅ Passt perfekt! Ist jetzt drin!",
                "⚡ Ging fix! Alles aktualisiert!",
                "🔄 Check, fertig, läuft!",
                "🏆 Toll gemacht! Alles erfolgreich!",
                "🎊 Speichern war ein Kinderspiel!",
                "🥇 Erfolg auf ganzer Linie!"
        };
        int randomIndex = (int) (Math.random() * ary.length);
        return ary[randomIndex];
    }

    public static String getNegative() {
        String[] ary = {
                "❌ Leider nicht erledigt.",
                "⚠️ Speichern fehlgeschlagen!",
                "🔄 Update abgebrochen!",
                "⏳ Noch nicht bereit!",
                "💥 Mission gescheitert!",
                "🤷 Versuch’s nochmal!",
                "⛔ Läuft nicht ganz rund!",
                "❌ Oops! Hat nicht geklappt!",
                "⚠️ Daten konnten nicht aktualisiert werden.",
                "😕 Leider nicht funktioniert!",
                "🔓 Änderungen nicht gesichert!",
                "🚫 Speichern fehlgeschlagen!",
                "❌ Nicht erledigt!",
                "😞 Leider nicht erfolgreich!",
                "⚠️ Auftrag konnte nicht ausgeführt werden!",
                "🔄 Update fehlgeschlagen!",
                "🚫 Speichern hat nicht geklappt!",
                "⚠️ Eingabe nicht übernommen!",
                "😕 Tadaa… oder auch nicht!",
                "⛔ Daten konnten nicht übernommen werden!",
                "❌ Leider nicht abgeschlossen!",
                "😬 Passt leider nicht!",
                "❌ Nicht übernommen!",
                "🤷 Versuch war leider nicht erfolgreich!",
                "🚫 Auftrag konnte nicht ausgeführt werden!",
                "❌ Speichern? Leider nein!",
                "⚠️ Problem aufgetreten!",
                "🔄 Nochmal versuchen!",
                "🚫 Leider nicht aktiv!",
                "❌ Update fehlgeschlagen!",
                "😟 Änderungen wurden nicht gespeichert!",
                "⛔ Fehlgeschlagen!",
                "❌ Nicht erledigt!",
                "🚧 Leider nicht möglich!",
                "⚠️ Speichern war nicht erfolgreich!",
                "🔄 Update konnte nicht durchgeführt werden!",
                "📂 Neue Daten? Leider nicht verfügbar!",
                "🔓 Eingabe verloren!",
                "⏳ Noch nicht startklar!",
                "❌ Speichern hat nicht funktioniert!",
                "😞 Leider nicht geklappt!",
                "🚫 Fehlversuch!",
                "⚠️ Dein Plan wurde nicht umgesetzt!",
                "❌ Nicht gespeichert!",
                "⛔ Daten konnten nicht übernommen werden!",
                "🔄 Nicht aktualisiert!",
                "❌ Fertig? Leider nicht!",
                "⚠️ Konnte nicht abgeschlossen werden!",
                "🚫 Speichern nicht möglich!",
                "😟 Leider kein Erfolg!"
        };
        int randomIndex = (int) (Math.random() * ary.length);
        return ary[randomIndex];
    }

    public static String getError() {
        String[] ary = {
                "❌ Ein Fehler ist aufgetreten!",
                "⚠️ Unerwartetes Problem entdeckt!",
                "💥 Etwas ist schiefgelaufen!",
                "🔄 Vorgang fehlgeschlagen!",
                "❌ Ein unerwarteter Fehler ist passiert!",
                "😟 Leider ist ein Problem aufgetreten!",
                "🚨 Achtung! Ein kritischer Fehler ist aufgetreten!",
                "🤷 Leider nicht möglich!",
                "🔄 Systemfehler, bitte später erneut versuchen!",
                "😕 Funktion nicht verfügbar!",
                "⚠️ Fehler beim Abrufen der Daten!",
                "🚧 Der Prozess wurde unerwartet gestoppt!",
                "🚫 Aktion konnte nicht abgeschlossen werden!",
                "🛠️ Systemfehler erkannt – wir arbeiten daran!",
                "❌ Ups! Etwas ist schiefgelaufen!",
                "⛔ Leider ist ein unerwartetes Problem aufgetreten!"
        };
        int randomIndex = (int) (Math.random() * ary.length);
        return ary[randomIndex];
    }

}
