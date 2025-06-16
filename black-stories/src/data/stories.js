const blackStories = [
  {
    id: 1,
    title: "Der tödliche Sprung",
    riddle: "Ein Mann springt aus dem Fenster eines 20-stöckigen Gebäudes. Er landet unverletzt. Wie ist das möglich?",
    solution: "Er springt aus dem Fenster im Erdgeschoss.",
    hints: ["Denk an die Formulierung", "Welches Stockwerk?", "Nicht alle Fenster sind hoch"]
  },
  {
    id: 2,
    title: "Das Aquarium",
    riddle: "Romeo und Julia liegen tot auf dem Boden. Um sie herum sind Glasscherben und eine Wasserpfütze. Was ist passiert?",
    solution: "Romeo und Julia sind Goldfische. Ihr Aquarium ist heruntergefallen und zerbrochen.",
    hints: ["Namen können täuschen", "Was liegt auf dem Boden?", "Wasser ist ein wichtiger Hinweis"]
  },
  {
    id: 3,
    title: "Der Wüstenmann",
    riddle: "Ein nackter Mann wird tot in der Wüste gefunden. In seiner Hand hält er einen abgebrochenen Strohhalm. Was ist geschehen?",
    solution: "Er war mit anderen in einem Heißluftballon. Als der Ballon abzustürzen drohte, zogen alle Strohhalme - er hatte den kürzesten und musste springen.",
    hints: ["Der Strohhalm ist entscheidend", "Er war nicht allein", "Denk an Auswahlverfahren"]
  },
  {
    id: 4,
    title: "Das Restaurant",
    riddle: "Ein Mann bestellt in einem Restaurant Albatros. Nach dem ersten Bissen bricht er in Tränen aus und verlässt das Lokal. Warum?",
    solution: "Er war einmal schiffbrüchig. Die Überlebenden aßen angeblich Albatros. Als er jetzt echten Albatros isst, merkt er, dass es damals etwas anderes war - vermutlich Menschenfleisch.",
    hints: ["Geschmack ist wichtig", "Erinnerungen spielen eine Rolle", "Er hat schon mal 'Albatros' gegessen"]
  },
  {
    id: 5,
    title: "Der Fahrstuhl",
    riddle: "Ein Mann wohnt im 10. Stock. Jeden Morgen fährt er mit dem Fahrstuhl ins Erdgeschoss. Abends fährt er nur bis zum 7. Stock und geht die restlichen Stockwerke zu Fuß. Nur wenn es regnet oder jemand mitfährt, fährt er bis zum 10. Stock. Warum?",
    solution: "Der Mann ist kleinwüchsig. Er kommt nur bis zum Knopf für den 7. Stock. Bei Regen hat er einen Regenschirm dabei, mit dem er höhere Knöpfe erreicht. Wenn jemand mitfährt, kann diese Person den Knopf für ihn drücken.",
    hints: ["Größe spielt eine Rolle", "Was ändert sich bei Regen?", "Warum hilft eine andere Person?"]
  },
  {
    id: 6,
    title: "Die Waldlichtung",
    riddle: "Ein Mann liegt tot auf einer Waldlichtung. Neben ihm liegt ein ungeöffnetes Paket. Wie ist er gestorben?",
    solution: "Das Paket enthält einen Fallschirm, der sich nicht geöffnet hat. Der Mann ist beim Fallschirmspringen abgestürzt.",
    hints: ["Das Paket ist wichtig", "Er kam von oben", "Was sollte sich öffnen?"]
  },
  {
    id: 7,
    title: "Der Zeitungsartikel",
    riddle: "Eine Frau liest einen Zeitungsartikel und stirbt daraufhin. Der Artikel selbst war harmlos. Was ist passiert?",
    solution: "Sie las den Artikel während der Autofahrt. Durch die Ablenkung verursachte sie einen tödlichen Unfall.",
    hints: ["Der Ort ist wichtig", "Sie war nicht zu Hause", "Ablenkung kann tödlich sein"]
  },
  {
    id: 8,
    title: "Das Kartenspiel",
    riddle: "Vier Männer spielen Karten in einer Hütte. Plötzlich steht einer auf, geht nach draußen und erschießt sich. Die anderen spielen weiter. Warum?",
    solution: "Die Männer waren auf einer Polarexpedition und hatten keine Nahrung mehr. Sie spielten Karten darum, wer sich opfern muss, damit die anderen überleben können. Der Verlierer hielt sich an die Abmachung.",
    hints: ["Extreme Situation", "Es ging um Leben und Tod", "Ehrenhafte Abmachung"]
  },
  {
    id: 9,
    title: "Der Leuchtturm",
    riddle: "Ein Leuchtturmwärter schaltet das Licht aus und geht schlafen. Am nächsten Morgen erfährt er von einer Katastrophe und nimmt sich das Leben. Was war geschehen?",
    solution: "Ohne das Leuchtturmlicht ist in der Nacht ein Schiff auf die Klippen gelaufen. Viele Menschen starben. Der Leuchtturmwärter konnte mit der Schuld nicht leben.",
    hints: ["Seine Aufgabe war wichtig", "Das Licht hatte einen Zweck", "Schiffe orientieren sich nachts"]
  },
  {
    id: 10,
    title: "Die Musik",
    riddle: "Ein Mann hört Musik und stirbt. Die Musik selbst war nicht laut oder erschreckend. Was ist passiert?",
    solution: "Der Mann war Schlafwandler. Die Musik weckte ihn auf, während er auf einem Dachrand oder Balkon schlafwandelte. Erschrocken verlor er das Gleichgewicht und stürzte ab.",
    hints: ["Er war nicht bei Bewusstsein", "Der Ort war gefährlich", "Plötzliches Erwachen"]
  },
  {
    id: 11,
    title: "Der Schneemann",
    riddle: "Kinder bauen einen Schneemann. Als er schmilzt, finden sie eine Leiche. Die Kinder sind nicht überrascht. Warum?",
    solution: "Die Kinder haben den Schneemann absichtlich um eine erfrorene Leiche herum gebaut, die sie zuvor im Schnee gefunden hatten, um sie vor ihren Eltern zu verstecken.",
    hints: ["Die Kinder wussten Bescheid", "Sie hatten einen Plan", "Versteckspiel"]
  },
  {
    id: 12,
    title: "Das Hotelzimmer",
    riddle: "Ein Mann checkt in ein Hotel ein. Mitten in der Nacht wacht er schweißgebadet auf, greift zum Telefon, wählt eine Nummer, legt aber sofort wieder auf ohne etwas zu sagen. Danach schläft er beruhigt ein. Was war los?",
    solution: "Der Mann ist blind. Er wachte desorientiert auf und wusste nicht, ob der Strom ausgefallen war oder ob er blind geworden war. Er rief die Rezeption an und als er das Freizeichen hörte, wusste er, dass der Strom noch da war und er noch blind ist.",
    hints: ["Er hatte eine Befürchtung", "Das Freizeichen war wichtig", "Er konnte etwas nicht sehen"]
  },
  {
    id: 13,
    title: "Die Brücke",
    riddle: "Ein Mann geht über eine Brücke. Auf der anderen Seite angekommen, dreht er sich um, sieht etwas und springt von der Brücke. Er überlebt unverletzt. Wie ist das möglich?",
    solution: "Es war eine kleine Brücke über einen Bach. Er sah sein Haus brennen und sprang ins flache Wasser, um schneller nach Hause zu gelangen und zu helfen.",
    hints: ["Nicht alle Brücken sind hoch", "Er hatte es eilig", "Er sah etwas Schlimmes"]
  },
  {
    id: 14,
    title: "Der Zirkus",
    riddle: "Nach einer Zirkusvorstellung findet man einen Zwerg tot in seiner Garderobe. Überall liegen Sägespäne. Was ist geschehen?",
    solution: "Ein eifersüchtiger anderer Zwerg hat heimlich die Beine seiner Möbel abgesägt. Als der Zwerg nach Hause kam und alles niedriger war, dachte er, er sei gewachsen und würde seinen Job als kleinster Mensch der Welt verlieren. Aus Verzweiflung nahm er sich das Leben.",
    hints: ["Größe war sein Kapital", "Jemand spielte ihm einen Streich", "Die Möbel waren verändert"]
  },
  {
    id: 15,
    title: "Das Foto",
    riddle: "Eine Frau sieht ein altes Foto und stirbt vor Schreck. Das Foto zeigt nichts Grausames oder Erschreckendes. Was war auf dem Bild?",
    solution: "Das Foto zeigte ihren totgeglaubten ersten Ehemann, den sie hatte ermorden lassen. Sie erkannte, dass er noch lebte und Rache nehmen würde. Der Schock löste einen Herzinfarkt aus.",
    hints: ["Sie erkannte jemanden", "Diese Person sollte nicht leben", "Sie hatte ein dunkles Geheimnis"]
  }
];

export default blackStories;
