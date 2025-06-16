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
        title: "Der Fahrstuhl",
        riddle: "Ein Mann wohnt im 10. Stock. Jeden Morgen fährt er mit dem Fahrstuhl ins Erdgeschoss. Abends fährt er nur bis zum 7. Stock und geht die restlichen Stockwerke zu Fuß. Nur wenn es regnet oder jemand mitfährt, fährt er bis zum 10. Stock. Warum?",
        solution: "Der Mann ist kleinwüchsig. Er kommt nur bis zum Knopf für den 7. Stock. Bei Regen hat er einen Regenschirm dabei, mit dem er höhere Knöpfe erreicht. Wenn jemand mitfährt, kann diese Person den Knopf für ihn drücken.",
        hints: ["Größe spielt eine Rolle", "Was ändert sich bei Regen?", "Warum hilft eine andere Person?"]
    },
    {
        id: 4,
        title: "Die Waldlichtung",
        riddle: "Ein Mann liegt tot auf einer Waldlichtung. Neben ihm liegt ein ungeöffnetes Paket. Wie ist er gestorben?",
        solution: "Das Paket enthält einen Fallschirm, der sich nicht geöffnet hat. Der Mann ist beim Fallschirmspringen abgestürzt.",
        hints: ["Das Paket ist wichtig", "Er kam von oben", "Was sollte sich öffnen?"]
    },
    {
        id: 5,
        title: "Der Zeitungsartikel",
        riddle: "Eine Frau liest einen Zeitungsartikel und stirbt daraufhin. Der Artikel selbst war harmlos. Was ist passiert?",
        solution: "Sie las den Artikel während der Autofahrt. Durch die Ablenkung verursachte sie einen tödlichen Unfall.",
        hints: ["Der Ort ist wichtig", "Sie war nicht zu Hause", "Ablenkung kann tödlich sein"]
    },
    {
        id: 6,
        title: "Der Leuchtturm",
        riddle: "Ein Leuchtturmwärter schaltet das Licht aus und geht schlafen. Am nächsten Morgen erfährt er von einer Katastrophe und nimmt sich das Leben. Was war geschehen?",
        solution: "Ohne das Leuchtturmlicht ist in der Nacht ein Schiff auf die Klippen gelaufen. Viele Menschen starben. Der Leuchtturmwärter konnte mit der Schuld nicht leben.",
        hints: ["Seine Aufgabe war wichtig", "Das Licht hatte einen Zweck", "Schiffe orientieren sich nachts"]
    },
    {
        id: 7,
        title: "Die Musik",
        riddle: "Ein Mann hört Musik und stirbt. Die Musik selbst war nicht laut oder erschreckend. Was ist passiert?",
        solution: "Der Mann war Schlafwandler. Die Musik weckte ihn auf, während er auf einem Dachrand oder Balkon schlafwandelte. Erschrocken verlor er das Gleichgewicht und stürzte ab.",
        hints: ["Er war nicht bei Bewusstsein", "Der Ort war gefährlich", "Plötzliches Erwachen"]
    },
    {
        id: 8,
        title: "Die Brücke",
        riddle: "Ein Mann geht über eine Brücke. Auf der anderen Seite angekommen, dreht er sich um, sieht etwas und springt von der Brücke. Er überlebt unverletzt. Wie ist das möglich?",
        solution: "Es war eine kleine Brücke über einen Bach. Er sah sein Haus brennen und sprang ins flache Wasser, um schneller nach Hause zu gelangen und zu helfen.",
        hints: ["Nicht alle Brücken sind hoch", "Er hatte es eilig", "Er sah etwas Schlimmes"]
    },
    {
        id: 9,
        title: "Das Selfie",
        riddle: "Eine Influencerin macht ein Selfie und stirbt wenige Sekunden später. Das Handy funktionierte einwandfrei. Was war los?",
        solution: "Sie machte das Selfie mit einem Hai im Hintergrund, während sie schwamm. Sie war so auf das perfekte Foto fokussiert, dass sie nicht bemerkte, wie nah der Hai gekommen war.",
        hints: ["Gefährliches Tier", "Sie war abgelenkt", "Wasser war involviert"]
    },
    {
        id: 10,
        title: "Das Handy-Ladegerät",
        riddle: "Ein Teenager stirbt beim Laden seines Handys. Das Ladegerät war original und das Handy funktionierte. Was war die Todesursache?",
        solution: "Er badete in der Badewanne und das Ladekabel fiel ins Wasser. Elektroschock.",
        hints: ["Wasser", "Elektrizität", "Badezimmer"]
    },
    {
        id: 11,
        title: "Der Yogakurs",
        riddle: "Eine Frau macht zum ersten Mal Yoga und stirbt während der ersten Übung. Sie war fit und gesund. Was geschah?",
        solution: "Sie machte Yoga auf dem Balkon im 20. Stock. Bei der ersten Übung 'nach unten schauender Hund' verlor sie das Gleichgewicht und stürzte ab.",
        hints: ["Gefährlicher Ort", "Gleichgewicht", "Höhe"]
    },
    {
        id: 12,
        title: "Die Fernbedienung",
        riddle: "Ein Mann drückt auf die Fernbedienung und stirbt. Der Fernseher war aus und die Fernbedienung funktionierte. Was tötete ihn?",
        solution: "Es war die Fernbedienung für seine Garagentür. Er lag unter seinem Auto und reparierte es, als er versehentlich die Fernbedienung drückte. Das Garagentor schloss sich und zerquetschte ihn.",
        hints: ["Falsche Fernbedienung", "Mechanischer Tod", "Er lag unter etwas"]
    },
    {
        id: 13,
        title: "Der Küchenunfall",
        riddle: "Eine Hausfrau bereitet das Abendessen vor und stirbt dabei. Alle Küchengeräte funktionierten normal. Was passierte?",
        solution: "Sie rutschte auf dem nassen Küchenboden aus und schlug mit dem Kopf auf die Küchentheke auf.",
        hints: ["Rutschgefahr", "Harter Aufprall", "Boden war nass"]
    },
    {
        id: 14,
        title: "Das Spiegelbild",
        riddle: "Ein Mann rasiert sich vor dem Spiegel und stirbt dabei. Der Rasierer war scharf aber nicht defekt. Was geschah?",
        solution: "Er hatte einen Herzschrittmacher. Der elektrische Rasierer störte das Gerät und verursachte einen Herzstillstand.",
        hints: ["Elektrisches Gerät", "Medizinisches Implantat", "Störung"]
    },
    {
        id: 15,
        title: "Der Gartenteich",
        riddle: "Ein Mann fällt in seinen eigenen Gartenteich und ertrinkt, obwohl der Teich nur 50cm tief ist. Er konnte schwimmen. Was war passiert?",
        solution: "Der Teich war zugefroren. Er brach durch das Eis ein und konnte sich nicht mehr befreien, da er unter der Eisschicht gefangen war.",
        hints: ["Jahreszeit beachten", "Eisschicht", "Gefangen"]
    },
    {
        id: 16,
        title: "Die Treppe",
        riddle: "Eine Frau geht eine Treppe hinunter und stirbt. Sie ist nicht gestürzt oder gefallen. Was tötete sie?",
        solution: "Sie war allergisch gegen den Teppichkleber der neuen Teppichstufen. Beim Hinuntergehen atmete sie die giftigen Dämpfe ein.",
        hints: ["Allergie", "Neue Materialien", "Einatmen"]
    },
    {
        id: 17,
        title: "Das Picknick",
        riddle: "Eine Familie macht ein Picknick im Park. Nur der Vater stirbt, obwohl alle das gleiche Essen gegessen haben. Was war anders?",
        solution: "Der Vater war Diabetiker und aß die zuckerfreien Kekse, die versehentlich mit normalen Keksen vertauscht worden waren. Der Blutzuckerschock tötete ihn.",
        hints: ["Krankheit", "Vertauschung", "Zucker"]
    },
    {
        id: 18,
        title: "Die Dusche",
        riddle: "Ein Mann duscht und stirbt dabei. Das Wasser war nicht zu heiß und er ist nicht ausgerutscht. Was war die Ursache?",
        solution: "Er hatte eine Kohlenmonoxidvergiftung durch den defekten Durchlauferhitzer in der Dusche.",
        hints: ["Giftiges Gas", "Defektes Gerät", "Unsichtbare Gefahr"]
    },
    {
        id: 19,
        title: "Der Aufzug",
        riddle: "Eine Frau steigt in einen Aufzug und stirbt, bevor er sich bewegt. Was tötete sie?",
        solution: "Die Aufzugstüren klemmten sie ein und zerquetschten sie, als sie sich zu schließen versuchten.",
        hints: ["Technischer Defekt", "Klemmen", "Türen"]
    },
    {
        id: 20,
        title: "Das Fenster",
        riddle: "Ein Mann öffnet ein Fenster und stirbt sofort. Draußen war nichts Gefährliches zu sehen. Was geschah?",
        solution: "Er befand sich in einem Flugzeug in großer Höhe. Als er das Fenster öffnete, wurde er durch die Dekompression hinausgesogen.",
        hints: ["Besonderer Ort", "Druckunterschied", "Große Höhe"]
    },
    {
        id: 21,
        title: "Der Schminktisch",
        riddle: "Ein Mann sieht in den Spiegel eines Schminktisches, nimmt seine Waffe und erschießt sich. Auf dem Boden liegen Sägespäne.",
        solution: "Der Mann war ein Liliputaner im Zirkus, der als 'kleinster Mann der Welt' arbeitete. Jemand hatte die Beine des Schminktisches abgesägt. Als er in den Spiegel schaute, dachte er, er wäre gewachsen und würde seinen Job verlieren.",
        hints: ["Sägespäne sind wichtig", "Größe war sein Beruf", "Möbel wurden verändert"]
    },
    {
        id: 22,
        title: "Das Albatross-Schnitzel",
        riddle: "Ein Mann bestellt ein Albatross-Schnitzel, isst nur einen Bissen, bezahlt und erschießt sich dann auf dem Parkplatz.",
        solution: "Der Mann hatte einen Schiffbruch überlebt und war auf einer Insel gestrandet. Der Erste Offizier behauptete, Albatross-Fleisch zu bringen, aber die anderen Überlebenden verschwanden dabei immer. Als der Mann nun echtes Albatross-Fleisch probierte, erkannte er am anderen Geschmack, dass er damals Menschenfleisch gegessen hatte.",
        hints: ["Geschmack war anders als erwartet", "Schiffbruch in der Vergangenheit", "Andere Menschen verschwanden"]
    },
    {
        id: 23,
        title: "Tot in der Wüste",
        riddle: "Ein nackter Mann liegt tot in der Wüste mit einem halben Streichholz in der Hand.",
        solution: "Ein Heißluftballon drohte abzustürzen. Nachdem aller Ballast (auch die Kleidung) abgeworfen wurde, musste sich einer opfern. Sie zogen Streichhölzer - wer das kurze zog, musste springen.",
        hints: ["Er kam von oben", "Auswahlverfahren", "Ballast wurde abgeworfen"]
    },
    {
        id: 24,
        title: "Die Nette Bedienung",
        riddle: "Ein Mann bestellt Wasser, der Barkeeper zielt mit einer Waffe auf ihn. Der Mann bedankt sich und geht.",
        solution: "Der Mann hatte Schluckauf. Der Barkeeper erschreckte ihn mit der Waffe, wodurch der Schluckauf verschwand. Der Mann war dankbar für die ungewöhnliche aber effektive Heilung.",
        hints: ["Medizinisches Problem", "Schreckmoment war gewollt", "Heilung durch Überraschung"]
    },
    {
        id: 25,
        title: "Die Haifischsuppe",
        riddle: "Ein Mann bestellt eine Haifischsuppe, kostet nur einmal, geht in die Küche und tötet den Koch.",
        solution: "Nach einem Schiffsunglück waren die Überlebenden monatelang gefangen. Der Koch behauptete, Haifische zu fangen, aber Passagiere verschwanden immer wieder. Der Mann war mit seiner Frau an Bord, die auch verschwand. Als er im Lokal die echte Haifischsuppe kostete und merkte, dass sie anders schmeckte, wusste er, dass er damals seine eigene Frau gegessen hatte.",
        hints: ["Geschmack war anders", "Schiffsunglück in der Vergangenheit", "Menschen verschwanden"]
    },
    {
        id: 26,
        title: "Menü des Grauens",
        riddle: "In einem Fünf-Sterne-Restaurant mussten sich 4 Stunden nach einem vorzüglichen Vier-Gänge-Dinner 70 von 80 Gästen übergeben.",
        solution: "Das Restaurant befand sich auf einem Kreuzfahrtschiff. Nach dem Kapitänsdinner kam nachts ein Sturm mit Windstärke 9 auf, wodurch das Schiff so schwankte, dass die meisten Gäste seekrank wurden.",
        hints: ["Restaurant war an besonderem Ort", "Wetter änderte sich", "Bewegung war die Ursache"]
    },
    {
        id: 27,
        title: "Frischluftzufuhr",
        riddle: "Zwei Männer starben gleichzeitig, nur weil sie frische Luft schnuppern wollten.",
        solution: "Bei einem schwülen, nebligen Abend steckten beide Autofahrer ihre Köpfe aus dem Fenster, um frische Luft zu bekommen. Sie fuhren genau in diesem Moment aneinander vorbei, ihre Köpfe stießen zusammen und sie starben an der Kopfverletzung.",
        hints: ["Sie waren in Fahrzeugen", "Schlechte Sicht", "Kollision"]
    },
    {
        id: 28,
        title: "Telefon des Todes",
        riddle: "Eine Frau wird nachts vom Telefon geweckt, greift zum Hörer und stirbt, bevor sie sich meldet. Hätte sie nicht abgehoben, würde sie noch leben.",
        solution: "Die ängstliche Frau hatte einen geladenen Revolver auf dem Nachttisch. Nach einer durchfeierten Nacht griff sie verwirrt zum Revolver statt zum Telefonhörer und erschoss sich versehentlich.",
        hints: ["Verwechslung", "Gefährlicher Gegenstand am Nachttisch", "Verwirrter Zustand"]
    },
    {
        id: 29,
        title: "Johnnys letzter Tag",
        riddle: "Ein Mann kommt aus dem Urlaub, sieht Sägemehl im Wohnzimmer, schaut in den Badezimmerspiegel und begeht Selbstmord.",
        solution: "Er war der kleinste Zwerg der Welt im Zirkus. Der eifersüchtige zweitkleinste Zwerg sägte während seiner Abwesenheit alle Möbel 5 cm kürzer und hängte den Spiegel tiefer. Als Johnny nur noch seine Brust im Spiegel sah, dachte er, er sei gewachsen und hätte seine Attraktion verloren.",
        hints: ["Sägemehl deutet auf Veränderungen hin", "Größe war sein Beruf", "Möbel wurden manipuliert"]
    },
    {
        id: 30,
        title: "Zwei Tote",
        riddle: "In einem Raum sitzen zwei Tote. Auf dem Tisch liegen Streichhölzer und eine Pistole. Einer hat ein Loch im Kopf.",
        solution: "Die Szene wird durch das Bullauge eines gesunkenen U-Boots betrachtet. In der Pistole war nur eine Kugel. Die beiden Männer knobelten, wer sich erschießen durfte und wer den qualvollen Tod durch Ersticken erleiden musste.",
        hints: ["Unter Wasser", "Nur eine Kugel", "Auswahlverfahren"]
    },
    {
        id: 31,
        title: "Das Telefonat",
        riddle: "Ein Mann kann nicht schlafen, ruft jemanden an, fragt nach Herrn Meier, entschuldigt sich bei der Verneinung und kann dann beruhigt schlafen.",
        solution: "Der Nachbar schnarchte laut. Der Mann ließ sich mit dem Nebenzimmer verbinden, um den Schnarcher zu wecken. Die Frage nach Herrn Meier war nur Vorwand - sein Ziel war erreicht.",
        hints: ["Nachbar war das Problem", "Störende Geräusche", "Anruf hatte anderen Zweck"]
    },
    {
        id: 32,
        title: "Qualvoller Tod",
        riddle: "Ein Mann fällt 50 m in die Tiefe, überlebt den Fall, stirbt aber 5 Stunden später.",
        solution: "Der Mann war Mechaniker auf einer Bohrinsel. Er stürzte ins Meer, überlebte den Aufprall, konnte aber nicht an den Säulen hochklettern. Er starb an Entkräftung und Unterkühlung im Ozean.",
        hints: ["Er fiel ins Wasser", "Arbeitsplatz war besonders", "Konnte nicht herausklettern"]
    },
    {
        id: 33,
        title: "Die tote Schwimmerin",
        riddle: "Eine Frau springt ins Wasser zum Schwimmen, hört ein Geräusch und ertrinkt Stunden später.",
        solution: "Die blinde Schwimmerin orientierte sich an einem Wecker am Ufer, der nach 10 Minuten klingelte. Ein vorbeifahrendes Boot hatte denselben Wecker. Als dieser klingelte, folgte sie dem Boot aufs offene Meer und ertrank vor Erschöpfung.",
        hints: ["Sie konnte nicht sehen", "Orientierung durch Geräusch", "Falsches Signal"]
    },
    {
        id: 34,
        title: "Tod im Auto",
        riddle: "Eine Frau wird im verschlossenen Auto durch Kopfschuss getötet, aber es gibt keine Einschusslöcher.",
        solution: "Die Frau fuhr ein Cabrio mit offenem Dach, als die Kugel sie traf. Deshalb gab es keine Einschusslöcher im Wagen.",
        hints: ["Auto war nicht vollständig geschlossen", "Dach ist wichtig", "Kugel kam von oben"]
    },
    {
        id: 35,
        title: "Tödlicher IQ",
        riddle: "Peter musste sterben, weil er klüger wurde. Wäre er dumm geblieben, würde er noch leben.",
        solution: "Peter saß im Todestrakt in Virginia. Das Gesetz verbot die Hinrichtung von Menschen mit IQ unter 70. Peters IQ war 57, aber durch Bildung im Gefängnis stieg er über 70, wodurch das Todesurteil vollstreckt wurde.",
        hints: ["Gesetzliche Regelung", "IQ-Grenze", "Bildung war fatal"]
    },
    {
        id: 36,
        title: "Fehlende Munition",
        riddle: "Zwei Tote mit Loch im Kopf, einer hält einen Revolver, aber man findet nur ein Geschoss.",
        solution: "Die Polarforscher stritten sich in einer Eishöhle. Ein Schuss traf den einen in den Kopf. Der Knall löste einen Eiszapfen von der Decke, der den anderen durchbohrte.",
        hints: ["Kalte Umgebung", "Schallwirkung", "Natürliche Waffe"]
    },
    {
        id: 37,
        title: "Gerade noch rechtzeitig",
        riddle: "Weil der Mann nicht über das Geröll stolperte, hat die Frau überlebt.",
        solution: "Ein angeblich blinder Mann bat eine Frau, einen Brief zuzustellen. Als sie sah, wie er plötzlich problemlos über Schutt ging, wurde sie misstrauisch und ging zur Polizei. Unter der Adresse fand man ein Menschenfleischlager. Der Brief lautete: 'Hier kommt meine nächste Lieferung'.",
        hints: ["Falsche Behinderung", "Verdächtiger Brief", "Menschenfresser"]
    },
    {
        id: 38,
        title: "Der Fahrstuhl 2",
        riddle: "Als eine Frau den Fahrstuhlknopf drückte, wusste sie, dass ihr Mann gestorben war.",
        solution: "Der Fahrstuhl funktionierte nicht - Stromausfall. Ihr schwerkranker Mann lag zu Hause an einer Lungenmaschine, die ohne Strom nicht funktionierte. Er musste erstickt sein.",
        hints: ["Stromausfall", "Medizinisches Gerät", "Lebenserhaltung"]
    },
    {
        id: 39,
        title: "Western von Gestern",
        riddle: "Ein Mann starb während einer wilden Schießerei. Überall war Blut, aber der Pathologe fand keine Einschuss-Stelle.",
        solution: "Im Wilden Westen starteten Bankräuber eine Schießerei vor dem Saloon. Nebenan beim Barbier wurde gerade ein Kunde rasiert. Der Barbier erschrak so sehr, dass das Rasiermesser ausrutschte und dem Kunden die Kehle durchtrennte.",
        hints: ["Nachbargebäude", "Schreckreaktion", "Scharfes Werkzeug"]
    },
    {
        id: 40,
        title: "Der neue Schuh",
        riddle: "Eine Frau kauft sich morgens neue Schuhe und stirbt daraufhin abends.",
        solution: "Die Frau ist Assistentin von einem Messerwerfer. Die neuen Schuhe haben einen höheren Absatz als die Alten. Am Abend ist eine Show und da der Kopf der Assistentin nun höher ist, trifft sie eines der Messer in den Kopf.",
        hints: ["Berufliche Tätigkeit", "Höhenunterschied", "Präzision war wichtig"]
    },
    {
        id: 41,
        title: "Am falschen Ort",
        riddle: "Ein Taucher liegt tot im Wald. Was ist passiert?",
        solution: "Der Taucher wurde während eines Waldbrandes von einem Löschflugzeug während eines Tauchausfluges aufgenommen und dann zusammen mit dem Wasser über dem Wald abgelassen.",
        hints: ["Waldbrand", "Löschflugzeug", "Wassertransport"]
    },
    {
        id: 42,
        title: "Der Mond",
        riddle: "Ohne den Mond hätte sie gewusst wer der Mörder war.",
        solution: "Eine Frau lag am Strand und las einen Krimi. Sie schlief ein und während sie schlief kam die Flut, welche ihr Buch wegspülte. So erfuhr sie nie wer der Mörder der Geschichte war.",
        hints: ["Strand", "Gezeiten", "Buch verschwunden"]
    },
    {
        id: 43,
        title: "Massensterben auf der Party",
        riddle: "Ein Mann geht auf eine Party und trinkt einige Gläser Punsch. Weil er früh aufstehen muss verlässt er als erster die Party. Am Tag darauf hört er dass alle seine Kollegen an vergiftetem Punsch starben. Er aber hat gar nichts bemerkt und hatte keine Beschwerden. Warum ist er nicht gestorben?",
        solution: "Das Gift war mit in den Eiswürfeln eingefroren. Da der Mann als erster ging waren diese noch nicht geschmolzen später aber als alles Eis geschmolzen war hat das die Vergiftung der restlichen Partymitgliedern bewirkt.",
        hints: ["Eiswürfel", "Zeit war entscheidend", "Gift brauchte Zeit"]
    },
    {
        id: 44,
        title: "Peters Tod",
        riddle: "Peter störte Manfred. Das war Peters Tod. Warum?",
        solution: "Manfred arbeitete als Holzfäller. Als Peter ihm von hinten auf die Schulter klopfte, drehte er sich spontan um und erwischte Peter mit seiner Kettensäge.",
        hints: ["Gefährlicher Beruf", "Überraschung", "Scharfes Werkzeug"]
    },
    {
        id: 45,
        title: "Familienbande",
        riddle: "Eine Frau geht auf die Beerdigung ihrer Mutter. Dort sieht die Frau einen ihr fremden Mann. Am nächsten Tag tötet die Frau ihre Schwester.",
        solution: "Die Frau hat den fremden Mann auf der Beerdigung gesehen und sich sofort in ihn verliebt. Leider ist der Mann so schnell gegangen, dass die Frau keine Zeit hatte den Mann anzusprechen. Sie töte ihre Schwester in der Hoffnung, den Mann auf ihrer Beerdigung wieder zu sehen.",
        hints: ["Verliebt auf den ersten Blick", "Keine Kontaktmöglichkeit", "Hoffnung auf Wiedersehen"]
    },
    {
        id: 46,
        title: "Ein Tod in einem Museum",
        riddle: "Ein Mann, der eine Sturmhaube trägt, rennt aus einem Museum, wobei er ein Gemälde unter dem Arm trägt. Ein Polizist sieht ihn, erschießt ihn und begeht bald darauf Selbstmord. Ein paar Tage später wird der Mann mit dem Gemälde begraben und zum Ehrenmann ernannt.",
        solution: "Während einer Kälteperiode bricht ein Feuer in einem Museum aus und der Direktor versuchte, das wertvollste Gemälde der Sammlung zu retten. Der Polizist hatte das Feuer nicht bemerkt und dachte, dass der Mann mit dem Gemälde ein Dieb war. Er sagte zu ihm, dass er stehen bleiben sollte, doch da der Direktor taub war, hörte er den Polizisten nicht. Als der Polizist merkte, was er getan hatte, brachte er sich selbst um.",
        hints: ["Feuer im Gebäude", "Taub", "Missverständnis"]
    },
    {
        id: 47,
        title: "Der Erhängte in der Wüstenscheune",
        riddle: "Mitten in einer Wüste steht eine hölzerne Scheune, vor dem ein LKW parkt. In der Scheune finden man Toten, der 3 m über dem Boden an einem Strick um den Hals hängt. Es gibt weder Leitern oder sonstige Hilfsmittel, die darauf hindeuten, wie der Mann da hin gekommen ist. Im Sand vor der Hütte findet man nur seine eigenen Fußspuren.",
        solution: "Der Mann hat Selbstmord begangen. Er hatte auf dem LKW Eisblöcke geladen und diese in der Scheune aufgestapelt; dann ist er hinaufgeklettert, hat sich den Strick um den Hals gelegt und ist hinunter gesprungen. Das Eis ist in der Zwischenzeit geschmolzen.",
        hints: ["LKW-Ladung", "Hohe Temperatur", "Etwas ist verschwunden"]
    },
    {
        id: 48,
        title: "Hinter der Kellertüre",
        riddle: "Einem kleinen Mädchen wurde von den Eltern strengstens verboten, jemals die Kellertuer zu öffnen. Sie würde sonst Dinge sehen, die sie nicht sehen sollte. Eines Tages, als die Eltern ausgegangen waren, machte das Mädchen die Kellertuer dennoch auf. Was sah das Mädchen?",
        solution: "Das Mädchen war im Keller eingesperrt und machte die Türe von innen auf. Es sah die Welt draußen.",
        hints: ["Perspektive ist wichtig", "Eingesperrt", "Verbotene Außenwelt"]
    },
    {
        id: 49,
        title: "Ein vorzeitiger Tod",
        riddle: "Ein Mann, der erwartete, in ein paar Tagen zu sterben, stirbt früher als erwartet.",
        solution: "Der Mann war sehr krank und hatte sich dazu entschieden, seine Organe einem reichen Mann zu spenden. Weil der Sohn des reichen Mannes das Erbe des reichen Mannes bekommen wollte, vergiftete er den Spender, sodass seine Organe im Körper des Vaters nicht erneut funktionierten konnten.",
        hints: ["Organspende", "Erbe", "Sabotage"]
    },
    {
        id: 50,
        title: "Schuldig",
        riddle: "Anne beschuldigt ihre Schwester, Marie, Anne's Mann, Jakob, getötet zu haben. Der Richter spricht Marie ohne Zweifel schuldig. Trotzdem entscheidet der Richter sich dazu, Marie nicht ins Gefängnis zu stecken.",
        solution: "Anne und Marie waren siamesische Zwillinge. Eines Tages, als Anne abgelenkt war, vergiftete Marie Jakobs Getränk. Marie war definitiv schuldig, aber sie ins Gefängnis zu bringen, würde auch bedeuten, Anne, eine unschuldige Person, ins Gefängnis zu bringen.",
        hints: ["Körperlich verbunden", "Unschuldige würde mitbestraft", "Siamesische Zwillinge"]
    },
    {
        id: 51,
        title: "Der Reifen",
        riddle: "Ein Mann fährt über 500 km mit einem platten Reifen, aber er kommt ohne Zwischenfälle an seinem Ziel an. Wie kann das sein?",
        solution: "Bei dem platten Reifen handelt es sich um das Reserverad.",
        hints: ["Nicht alle Reifen werden benutzt", "Ersatzteil", "Reserverad"]
    },
    {
        id: 52,
        title: "Die seltsame Entenfamilie",
        riddle: "Drei Entchen schwimmen hintereinander im See. Das erste Entchen sagt: 'Hinter mir schwimmen zwei Entchen.' Das zweite Entchen sagt: 'Vor mir schwimmt ein Entchen, und hinter mir schwimmt ein Entchen.' Das dritte Entchen sagt: 'Vor mir schwimmen zwei Entchen, und hinter mir schwimmt ein Entchen.' Was ist hier passiert?",
        solution: "Das dritte Entchen hat gelogen.",
        hints: ["Mathematik stimmt nicht", "Eine Aussage ist falsch", "Lüge"]
    },
    {
        id: 53,
        title: "Der letzte Zug",
        riddle: "Oscar saß und las seine Zeitung, als er ein Geräusch hörte. Als er merkte, was passiert war, bereute er es, dass er den Zug nicht rechtzeitig erwischt hatte. Kurz darauf beging er Selbstmord.",
        solution: "Oscar war pleite. Er war Zugsammler und, um seine wirtschaftlichen Probleme zu lösen, wollte er seinen wertvollsten Zug verkaufen. Er hatte ihn geputzt und nicht ordentlich zurück auf den Tisch gestellt als er fertig war. Als er sich hinsetzte und begann, Zeitung zu lesen, hörte er, wie er vom Tisch fiel. Er konnte ihn nicht rechtzeitig erwischen, bevor er auf den Boden krachte.",
        hints: ["Spielzeug", "Finanzielle Probleme", "Wertvoller Gegenstand zerbrochen"]
    },
    {
        id: 54,
        title: "Mord im Zug",
        riddle: "Zwei gut gekleidete Personen sitzen sich im Zug gegenüber. Als einer seine Handschuhe auszieht, erschießt der andere ihn.",
        solution: "Der Schütze hatte vor langer Zeit seine Frau verloren - sie wurde ermordet und ein wertvoller Ring gestohlen. Als sein Gegenüber die Handschuhe auszog, erkannte er den seltenen Ring seiner Frau und wusste, dass dies der Mörder sein musste.",
        hints: ["Wertvoller Schmuck", "Verlorene Ehefrau", "Wiedererkennung"]
    },
    {
        id: 55,
        title: "Die Yacht",
        riddle: "Im Meer schwimmt eine herrenlose Yacht, um sie herum mehrere Wasserleichen. Vom Schiff hört man laute Musik.",
        solution: "Bei einer wilden Party sprangen alle Gäste ins Wasser zum Abkühlen. Niemand hatte daran gedacht, eine Strickleiter auszuwerfen. Die Bordwand war zu hoch zum Hochklettern, das Ufer nicht in Sicht. Alle Partygäste ertranken qualvoll.",
        hints: ["Party", "Schwimmen", "Kein Weg zurück aufs Schiff"]
    },
    {
        id: 56,
        title: "Selbstmord im Zug",
        riddle: "Ein Mann mit Augenbinde sitzt im Zugabteil. Nach der Durchfahrt durch einen Tunnel ist er tot - Selbstmord.",
        solution: "Der Mann war blind und hatte sich einer Augenoperation unterzogen. Auf der Heimfahrt, begleitet von einem Zivi, wurde er neugierig und hob die Augenbinde ab - dummerweise genau im Tunnel. Da er nur Dunkelheit sah, dachte er, die Operation sei fehlgeschlagen und beging Selbstmord.",
        hints: ["Augenoperation", "Tunneldunkelheit", "Falsche Schlussfolgerung"]
    },
    {
        id: 57,
        title: "Der Tote auf dem Feld",
        riddle: "Mitten auf einem 3 Hektar großen Feld liegt ein Toter ohne Spuren im Ackerboden. 100 Meter entfernt liegt ein Paket.",
        solution: "Das Paket ist ein Fallschirm. Der Mann ist aus einem Flugzeug abgesprungen und hatte einen defekten Fallschirm erwischt.",
        hints: ["Paket ist wichtig", "Er kam von oben", "Ausrüstung versagte"]
    },
    {
        id: 58,
        title: "Der tödliche Tanz",
        riddle: "Die Musik stoppte und die Tänzerin stirbt.",
        solution: "Es handelt sich um eine Seiltänzerin im Zirkus. Sie geht mit verbundenen Augen ohne Sicherung über das Seil. Sie hat mit einem Mitarbeiter vereinbart, dass sie nur noch einen großen Schritt machen muss um auf das Zielpodest zu gelangen, sobald die Musik ausgeschaltet wird. Der Mitarbeiter schaltet die Musik zu früh ab und die Tänzerin tritt mit ihrem letzten Schritt ins Leere, stürzt und stirbt.",
        hints: ["Seiltanz im Zirkus", "Verbundene Augen", "Falsches Timing"]
    },
    {
        id: 59,
        title: "Der elegante Mann",
        riddle: "Ein Mann ist richtig schick angezogen, sogar die Haare sind frisch gemacht. Musik läuft auch schon die ganze Zeit, trotzdem fordert ihn niemand zum Tanzen auf.",
        solution: "Der Mann ist tot und seine Beerdigung ist im Gange.",
        hints: ["Musik läuft", "Niemand tanzt", "Feierlichkeit"]
    },
    {
        id: 60,
        title: "Die Gabel",
        riddle: "Ein Mann kommt in eine Bar. Er hat eine Gabel dabei. Als er geht, muss er für seine Getränke nichts bezahlen und trotzdem ist der Barbesitzer sehr zufrieden. Wieso denn das?",
        solution: "Es handelt sich um den Klavierstimmer, der mit seiner Stimmgabel das Klavier in der Bar stimmte.",
        hints: ["Spezielle Gabel", "Musik", "Dienstleistung"]
    },
    {
        id: 61,
        title: "Die Bibliothek",
        riddle: "Eine Frau ging in die Bibliothek, nahm das Buch und weinte.",
        solution: "Die Frau war eine Schriftstellerin und schenkte der Bibliothek eines ihrer Bücher. Sie ließ ein Geschenk für einen ersten Leser zwischen den Seiten des Buches - einen 50-Dollar-Schein. Ein Jahr später kam sie in die Bibliothek, nahm das Buch und fand diesen Schein darin. Sie weinte, weil sie sah, dass niemand ihr Buch gelesen hatte.",
        hints: ["Eigenes Buch", "Geschenk zwischen Seiten", "Ein Jahr später"]
    },
    {
        id: 62,
        title: "Im Bus",
        riddle: "Im Bus wollte Katja einer Frau, die eben jetzt eingestiegen ist, ihren Platz anbieten. Aber sie war sehr verschämt und lehnte ab. Warum?",
        solution: "Kleine Katja saß auf dem Schoß ihres Vaters.",
        hints: ["Katja ist klein", "Kein eigener Platz", "Familie"]
    },
    {
        id: 63,
        title: "Die Melodie",
        riddle: "Nachdem sie die Melodie hörte, griff sie zur Pistole und erschoss einen fremden Mann. Warum?",
        solution: "Die Frau lag im Bett als ein Einbrecher ins Schlafzimmer kam und ihre Schmuckschatulle öffnete. Diese spielte eine Melodie ab. Die Frau erwachte und erschoss den Einbrecher.",
        hints: ["Schmuckschatulle", "Einbrecher", "Nächtlicher Alarm"]
    },
    {
        id: 64,
        title: "Aus dem sechsten Stock springen",
        riddle: "Eine Frau springt von der Fensterbank aus dem sechsten Stock. Trotzdem ist sie in keinster Weise verletzt.",
        solution: "Die Frau wollte Selbstmord begehen, doch sie überlegte es sich auf die letzte Sekunde noch anders und entschied sich dazu, wieder zurück in ihre Wohnung zu springen.",
        hints: ["Selbstmord geplant", "Meinungsänderung", "Sprung nach innen"]
    },
    {
        id: 65,
        title: "Kostenloses T-Shirt",
        riddle: "Tom sieht sich im Fernsehen eine Show an. Darin wird den ersten 200 Personen, die anrufen, ein T-Shirt versprochen. Mike rennt zum Telefon, ruft an und hat Glück. Er gewinnt ein T-Shirt, das wenige Tage später bei ihm im Briefkasten liegt. Obwohl es super aussieht und ihm wie angegossen passt, ärgert er sich kurze Zeit später sehr über seinen Gewinn und wünschte sich, er hätte nicht angerufen. Warum?",
        solution: "Tom hatte sich die Show bei einem Pay-TV-Sender mit einem gepatchten Receiver angeschaut. Der Sender strahlte die Sendung so aus, dass sie nur von Schwarzsehern empfangen werden konnte. Um das T-Shirt zu erhalten musste Tom seine Adresse angeben und konnte so als nicht zahlender Zuschauer identifiziert werden.",
        hints: ["Pay-TV", "Schwarzsehen", "Adresse preisgegeben"]
    },
    {
        id: 66,
        title: "Der Berliner",
        riddle: "Ein Berliner ist aus dem 13. Stock eines Hochhauses gefallen und ist am Boden von einem LKW überfahren worden. Trotzdem wurde kein Mensch verletzt. Wieso?",
        solution: "Ein Berliner ist ein Gebäckstück (Krapfen/Pfannkuchen). Dieser fiel aus dem Fenster und wurde überfahren.",
        hints: ["Nicht was du denkst", "Essen", "Gebäck"]
    },
    {
        id: 67,
        title: "Die Münze",
        riddle: "Ein Mann geht nach einer langen Sauftour stark angetrunken nach Hause. Auf der Straße entdeckt er eine Münze am Boden liegen. Obwohl weder Mond noch Sterne am Himmel sichtbar sind und auch keine Straßenlaterne an ist, hat er das Geldstück schon von weitem gesehen. Wie ist das möglich?",
        solution: "Es ist Tag.",
        hints: ["Tageszeit", "Natürliches Licht", "Sonne"]
    },
    {
        id: 68,
        title: "Als Martin aufwachte",
        riddle: "Als Martin morgens aufgewacht ist, war er überrascht, dass die Tür offen war. Sobald er die Türschwelle passierte, wurde er geköpft.",
        solution: "Martin ist ein Huhn. Als er aus dem Hühnerstall läuft, wird er vom Bauern geschlachtet.",
        hints: ["Martin ist ein Tier", "Bauernhof", "Schlachtung"]
    },
    {
        id: 69,
        title: "Nicht jetzt!",
        riddle: "Eine Frau ist zu Hause, traurig, und beobachtet die Straße durch ihr Fenster. Kurz darauf springt sie raus. Genau in diesem Moment hört sie das Telefon klingeln und bereut es, gesprungen zu sein.",
        solution: "Die Frau wartet auf einen wichtigen Anruf (z.B. Testergebnisse vom Arzt). Sie ist deprimiert und springt aus dem Fenster. Während sie fällt, hört sie das Telefon klingeln und bereut ihre Entscheidung.",
        hints: ["Wichtiger Anruf erwartet", "Depression", "Timing"]
    },
    {
        id: 70,
        title: "Emma und die Metallstange",
        riddle: "Emma lebt nicht mehr. Sie starb, als sie gerade essen wollte. Eine Metallstange liegt auf ihr. Wie ist sie gestorben?",
        solution: "Emma ist eine Maus. Sie wurde von einer Mausefalle getötet, als sie den Käse fressen wollte.",
        hints: ["Emma ist ein Tier", "Falle", "Käse"]
    },
    {
        id: 71,
        title: "Weil sie sich an die Bedienungsanleitung hielt",
        riddle: "Weil sie sich an die Bedienungsanleitung hielt, musste sie sterben.",
        solution: "Die Frau war blind und las die Bedienungsanleitung ihrer Medizin in Brailleschrift. Jemand hatte böswillig die Dosierungsangabe verändert, sodass sie eine tödliche Überdosis nahm.",
        hints: ["Blind", "Brailleschrift", "Sabotage"]
    },
    {
        id: 72,
        title: "Tot? Nein, aber bald!",
        riddle: "Ein Mann erwachte und zündete vorsichtig ein Streichholz an. Nachdem er sich umgesehen hatte, wusste er, dass er bald sterben würde.",
        solution: "Der Mann ist in einem U-Boot, das auf dem Meeresgrund liegt. Das Streichholz erlischt sofort wieder - ein Zeichen dafür, dass kein Sauerstoff mehr vorhanden ist.",
        hints: ["U-Boot", "Meeresgrund", "Sauerstoffmangel"]
    },
    {
        id: 73,
        title: "Paul und der Ringfinger",
        riddle: "Paul bricht nachts in ein Leichenschauhaus ein und schneidet einer Leiche den Ringfinger ab.",
        solution: "Paul hatte seiner Frau einen sehr wertvollen Ring geschenkt. Als sie starb, wurde sie mit dem Ring beerdigt. Paul brauchte dringend Geld und wollte den Ring zurückholen.",
        hints: ["Wertvoller Ring", "Verstorbene Ehefrau", "Geldnot"]
    },
    {
        id: 74,
        title: "Der Verkäufer",
        riddle: "Ein Verkäufer versucht zu sehr, seine Sachen zu verkaufen, was in seinem Tod resultiert.",
        solution: "Der Verkäufer demonstriert die Sicherheit seiner kugelsicheren Westen, indem er eine an sich selbst testet. Die Weste war jedoch defekt.",
        hints: ["Demonstration", "Kugelsichere Weste", "Selbsttest"]
    },
    {
        id: 75,
        title: "Wenn er die Brieftasche nicht gestohlen hätte",
        riddle: "Wenn er die Brieftasche nicht gestohlen hätte, wäre er nicht gestorben. Was ist passiert?",
        solution: "Der Dieb stahl die Brieftasche eines Diabetikers. In der Brieftasche befand sich ein Zettel mit wichtigen medizinischen Informationen. Als der Bestohlene einen diabetischen Schock erlitt, konnten die Rettungskräfte ihm nicht richtig helfen und er starb.",
        hints: ["Diabetes", "Medizinische Informationen", "Rettungskräfte"]
    },
    {
        id: 76,
        title: "Ein Mann liest in der Zeitung",
        riddle: "Ein Mann liest in der Tageszeitung von einem Unfall mit Todesfolge im Ausland. Als er den Namen des Toten liest ruft er die Polizei an und meldet einen wahrscheinlichen Mord.",
        solution: "Der Mann erkennt den Namen seines Zwillingsbruders, mit dem er vor Jahren die Identität getauscht hatte, um Versicherungsbetrug zu begehen. Da er selbst noch lebt, muss es Mord gewesen sein.",
        hints: ["Zwillingsbruder", "Identitätstausch", "Versicherungsbetrug"]
    },
    {
        id: 77,
        title: "Der Mann am Grab",
        riddle: "Ein Mann geht auf den Friedhof und geht direkt zu einem Grab. Auf diesem Grab steht sein eigener Name, sein Geburtstag und sein Sterbedatum. Er freut sich, warum?",
        solution: "Der Mann hatte seinen eigenen Tod vorgetäuscht und ist nun zurückgekehrt. Das Grab bestätigt, dass sein Plan funktioniert hat und alle glauben, er sei tot.",
        hints: ["Vorgetäuschter Tod", "Plan gelungen", "Neue Identität"]
    },
    {
        id: 79,
        title: "Zwei Boxer",
        riddle: "Zwei Männer boxen gegeneinander und beide gehen plötzlich zu Boden.",
        solution: "Die beiden Männer boxen auf einem Schiff, das gerade in schweren Seegang gerät. Beide verlieren das Gleichgewicht und fallen hin.",
        hints: ["Schiff", "Seegang", "Gleichgewicht"]
    },
    {
        id: 80,
        title: "In Amerika schufen sie eine Kanone",
        riddle: "In Amerika schufen sie eine Kanone, die Hühner abfeuerte. Wozu?",
        solution: "Die Kanone wurde entwickelt, um die Windschutzscheiben von Flugzeugen auf Vogelschlag zu testen. Tote Hühner wurden mit hoher Geschwindigkeit auf die Scheiben geschossen.",
        hints: ["Flugzeuge", "Vogelschlag", "Test"]
    },
    {
        id: 81,
        title: "Helene und das Flugzeug",
        riddle: "Helene hätte nie gedacht, dass ihre Entscheidung, mit dem Flugzeug zu fliegen, ihr Leben retten würde.",
        solution: "Helene hatte ursprünglich eine Schiffsreise gebucht. Sie entschied sich kurzfristig um und flog stattdessen. Das Schiff, auf dem sie hätte sein sollen, sank.",
        hints: ["Schiffsreise geplant", "Kurzfristige Änderung", "Schiff sank"]
    },
    {
        id: 82,
        title: "Zwei Ehepaare",
        riddle: "Zwei Ehepaare, ein älteres und ein jüngeres, verbringen einen gemütlichen Abend zu viert. Gegen 22 Uhr verabschieden sich die beiden Damen und begeben sich nach oben in die Schlafräume. Die beiden Männer unterhalten sich noch eine Zeit lang, dann brechen auch sie nach oben auf. Der jüngere Mann geht vor dem älteren die Treppe hinauf. Plötzlich wird dem älteren Mann schlecht, er fühlt einen Herzinfarkt nahen. Mit letzter Kraft zieht er eine Pistole und schießt auf den jüngeren Mann, der im Bein getroffen zu Boden geht. Was war da los?",
        solution: "Die beiden Ehepaare sind auf einem Schiff (Kreuzfahrt). Der ältere Mann bekommt einen Herzinfarkt, während sie die Treppe hochgehen. Er weiß, dass der jüngere Mann Arzt ist, kann aber nicht mehr sprechen. Deshalb schießt er ihm ins Bein, damit dieser stehen bleibt und ihm helfen kann.",
        hints: ["Auf einem Schiff", "Jüngerer Mann ist Arzt", "Konnte nicht sprechen"]
    },
    {
        id: 83,
        title: "Da ist Licht",
        riddle: "Lukas sieht das Licht und wird verwirrt. Kurz später stirbt er.",
        solution: "Lukas war ein Hase, der aus dem Haus geflohen ist, in dem er lebte. Er überquerte nachts die Straße, als die Scheinwerfer eines Autos ihn blendeten. Der Fahrer sah ihn nicht und überfuhr ihn.",
        hints: ["Lukas ist ein Tier", "Nacht", "Scheinwerfer"]
    },
    {
        id: 84,
        title: "Die Röhre",
        riddle: "Zwei Affen finden auf einer Wiese eine Röhre. Beide schauen in die jeweils gegenüberliegenden Enden. Die Röhre ist nicht besonders lang, nicht verstopft und gerade. Trotzdem können sich die beiden nicht sehen. Warum?",
        solution: "Sie schauen zu unterschiedlichen Zeiten in die Röhre.",
        hints: ["Zeit ist wichtig", "Nicht gleichzeitig", "Zeitpunkt"]
    },
    {
        id: 85,
        title: "Der Tote vor dem Bäckerladen",
        riddle: "Vor dem einzigen Bäckerladen im Ort liegt ein einen toter Mann, der einen Rucksack am Rücken trägt. Was ist passiert?",
        solution: "Der Mann war ein ordnungsgemäß abgesprungener Fallschirmspringer. Der Rucksack ist ein ordnungsgemäß verpackter Fallschirm, der leider nicht ordnungsgemäß funktioniert hat. Der Bäckerladen ist eine ordnungsgemäß gelegte falsche Fährte.",
        hints: ["Fallschirmspringer", "Rucksack ist Fallschirm", "Bäckerladen unwichtig"]
    },
    {
        id: 86,
        title: "Toilette",
        riddle: "Ein Mann sitzt in seinem Sessel. Während er da so sitzt, muss er dringend aufs Klo, er kann aber nicht. Wieso nicht?",
        solution: "Der Mann sitzt in einem Flugzeug, welches gerade zur Startbahn rollt, das Zeichen 'bitte anschnallen' leuchtet noch.",
        hints: ["Flugzeug", "Anschnallen", "Start"]
    },
    {
        id: 87,
        title: "Die Frau im Gebäude",
        riddle: "Eine Frau betritt in Begleitung eines Mannes, den sie sehr liebt ein Gebäude. Kurz darauf kommt sie mit einem anderen Mann, den sie sehr liebt wieder heraus. Was ist geschehen?",
        solution: "Es ist die Hochzeit der Frau. Sie wird von ihrem Vater in die Kirche gebracht und verlässt die Kirche mit ihrem Ehemann.",
        hints: ["Hochzeit", "Vater", "Ehemann"]
    },
    {
        id: 88,
        title: "Celine in der Menschenmenge",
        riddle: "Celine ist in einer Menschenmenge, als sie ermordet wird. Trotzdem hört niemand ihre Schreie.",
        solution: "Celine ist bei einem Rockkonzert oder in einer anderen sehr lauten Umgebung, wo ihre Schreie in dem Lärm untergehen.",
        hints: ["Laute Umgebung", "Konzert", "Lärm übertönt Schreie"]
    },
    {
        id: 89,
        title: "Eine großartige Aussicht!",
        riddle: "Eine Frau schaut durch das Fenster und sieht einen Mann mit einem Messer. Trotzdem hat sie nicht genug Zeit, die Polizei zu rufen, bevor sie ermordet wird.",
        solution: "Die Frau sieht den Mann mit dem Messer im Spiegelbild des Fensters. Er steht bereits hinter ihr im Raum.",
        hints: ["Spiegelbild", "Fenster", "Er ist schon da"]
    },
    {
        id: 90,
        title: "Eine Frau hat vor, ihren Mann zu töten",
        riddle: "Eine Frau hat vor, ihren Mann während des Essens zu töten. Jedoch begeht sie Selbstmord, während sie es zubereitet.",
        solution: "Die Frau bereitet Kugelfisch (Fugu) zu, um ihren Mann zu vergiften. Dabei vergiftet sie sich selbst versehentlich beim Zubereiten.",
        hints: ["Giftiger Fisch", "Fugu", "Selbstvergiftung"]
    },
    {
        id: 91,
        title: "Mann springt ohne Fallschirm",
        riddle: "Ein Mann springt ohne Fallschirm aus einem Flugzeug und überlebt.",
        solution: "Das Flugzeug steht noch am Boden / ist noch nicht gestartet.",
        hints: ["Flugzeug am Boden", "Nicht geflogen", "Kleiner Sprung"]
    },
    {
        id: 92,
        title: "Der Schuh im Safe",
        riddle: "Vor dem Schlafengehen versteckte die Frau ihren Schuh in einem Safe. Wozu?",
        solution: "Die Frau ist Schlafwandlerin. Sie versteckt einen Schuh im Safe, damit sie nachts nicht schlafwandeln kann, da sie ohne Schuhe nicht rausgehen würde.",
        hints: ["Schlafwandlerin", "Sicherheitsmaßnahme", "Ohne Schuhe"]
    },
    {
        id: 93,
        title: "Die Prüfung in der Militärschule",
        riddle: "Die Prüfung in einer Militärschule. Einer der Schüler nahm ein Ticket und begann sich auf eine Antwort vorzubereiten. Aber nach ein paar Minuten näherte er sich dem Lehrer, sagte nichts, gab ihm ein Studienbuch und verließ die Prüfung mit einer guten Note.",
        solution: "Auf dem Prüfungszettel stand: 'Handle!'. Der Schüler handelte sofort, indem er aufstand und die Prüfung beendete.",
        hints: ["Prüfungsaufgabe war ein Befehl", "Sofortiges Handeln", "Nicht denken"]
    },
    {
        id: 94,
        title: "Eine haarige Entscheidung",
        riddle: "Ein Mann kam auf seinen Reisen in eine Kleinstadt, in der er nie zuvor gewesen war und niemanden kannte. Da er sich gerne die Haare schneiden lassen wollte, hielt er nach einem Frisiersalon Ausschau. Die beiden einzigen Geschäfte dieser Art lagen nicht weit voneinander entfernt an der Hauptstraße. Der Fremde sah sich die beiden Geschäfte lange und aufmerksam an. Das eine war sehr sauber und ordentlich. Der ganze Laden machte einen tadellosen Eindruck. Der Friseur fegte eben einige Haare zusammen und wartete auf seinen nächsten Kunden. Der andere Salon war das krasse Gegenteil. Er sah ziemlich unordentlich und baufällig aus. Drinnen lümmelte der zerzauste Besitzer des Ladens in einem Stuhl und wartete auf sein nächstes Opfer. Die Preise waren in beiden Geschäften gleich. Nach sorgfältiger Überlegung beschloss der Reisende, zu dem unordentlich aussehenden Friseur zu gehen.",
        solution: "In einer Stadt mit nur zwei Friseuren schneiden sich die Friseure gegenseitig die Haare. Der ordentliche Friseur mit dem schlechten Haarschnitt wird vom unordentlichen Friseur frisiert, der unordentliche Friseur mit dem guten Haarschnitt vom ordentlichen. Also ist der ordentliche Friseur der bessere.",
        hints: ["Nur zwei Friseure", "Schneiden sich gegenseitig", "Haarschnitt zeigt Können"]
    },
    {
        id: 95,
        title: "Drei Männer im Auto",
        riddle: "Drei Männer sind mit einem Wagen unterwegs. Einer fährt. Die beiden anderen Männer sind nicht im Wagen, auch nicht auf dem Dach oder im Kofferraum. Wie ist das möglich?",
        solution: "Es handelt sich um einen Leichenwagen. Der Fahrer sitzt vorne, die beiden anderen Männer liegen hinten in Särgen.",
        hints: ["Besonderes Auto", "Totenwagen", "Särge"]
    },
    {
        id: 96,
        title: "Ein Mann liegt tot neben seinem Bett",
        riddle: "Ein Mann liegt tot neben seinem Bett. An der Zimmerdecke klebt Blut. Was ist passiert?",
        solution: "Der Mann hat eine Mücke an der Decke erschlagen. Dabei ist er vom Bett gefallen und hat sich das Genick gebrochen.",
        hints: ["Mücke", "Vom Bett gefallen", "Genickbruch"]
    },
    {
        id: 97,
        title: "Mann ist tot auf einer Insel",
        riddle: "Ein Mann ist tot. Er liegt allein mitten auf einer Insel. Was ist passiert?",
        solution: "Der Mann liegt auf einer Verkehrsinsel und wurde überfahren.",
        hints: ["Verkehrsinsel", "Überfahren", "Nicht Meeresinsel"]
    },
    {
        id: 98,
        title: "Duell mit Freude",
        riddle: "Einer Tätlichkeit folgt ein Duell. Der Schütze schießt und trifft den anderen am Kopf. Trotzdem bleibt der Getroffene unverletzt und freut sich sogar. Wieso denn das?",
        solution: "Es handelt sich um ein Fotoduell. Der 'Schütze' ist ein Fotograf, der ein Foto vom Kopf des anderen macht.",
        hints: ["Fotograf", "Kamera", "Foto schießen"]
    },
    {
        id: 99,
        title: "Mann schwimmt mit Seil",
        riddle: "Ein Mann ist tot. Er schwimmt bäuchlings im Wasser. Neben ihm treibt ein Seil. Was ist passiert?",
        solution: "Der Mann war Wasserski gefahren und ist gestürzt. Er konnte sich nicht rechtzeitig vom Seil lösen und wurde mitgeschleift, bis er ertrank.",
        hints: ["Wasserski", "Seil nicht gelöst", "Mitgeschleift"]
    },
    {
        id: 100,
        title: "Ein anderes Fernsehprogramm",
        riddle: "Ein anderes Fernsehprogramm hätte ihm das Leben gerettet. Wieso?",
        solution: "Der Mann sah einen spannenden Film/Krimi im Fernsehen und blieb deshalb länger auf. Hätte ein anderes Programm gelaufen, wäre er früher ins Bett gegangen und hätte das Gasleck in seinem Schlafzimmer bemerkt, bevor es zu spät war.",
        hints: ["Spannender Film", "Länger wach", "Gasleck im Schlafzimmer"]
    },
    {
        id: 102,
        title: "Bernd und das glatte Ding",
        riddle: "Bernd kann kaum erwarten ES endlich in den Händen zu halten, dieses tolle glatte, weiche Ding. Doch als er ES endlich hat, will er es sofort wieder los werden. Wieso?",
        solution: "Bernd wollte unbedingt einen Fisch fangen. Als er endlich einen gefangen hat, ist er glitschig und zappelt, sodass Bernd ihn schnell wieder ins Wasser wirft.",
        hints: ["Angeln", "Glitschig und zappelt", "Zurück ins Wasser"]
    },
    {
        id: 103,
        title: "Mann steht hinter Frau",
        riddle: "Ein Mann steht hinter einer Frau. Dieselbe Frau steht hinter diesem Mann. Wie kann das gehen?",
        solution: "Die beiden stehen Rücken an Rücken.",
        hints: ["Körperposition", "Rücken", "Beide schauen weg"]
    },
    {
        id: 104,
        title: "Zwei Babys",
        riddle: "Zwei Babys kommen zur Welt. Na gut, sagen wir: zwei Männer werden geboren. Obwohl A vor B geboren wurde und A auch älter ist als B, steht es in der Geburtsurkunde genau andersherum. Wie kann das sein?",
        solution: "Die beiden wurden in unterschiedlichen Zeitzonen geboren. A wurde z.B. um 23:30 Uhr in New York geboren, B um 5:00 Uhr in Berlin. Obwohl A zeitlich früher geboren wurde, ist das Datum bei B einen Tag früher.",
        hints: ["Zeitzonen", "Verschiedene Länder", "Datum vs. Zeit"]
    },
    {
        id: 105,
        title: "Mann nimmt vollen Eimer",
        riddle: "Ein Mann nimmt einen vollen Eimer. Er dreht diesen Eimer um und nichts läuft aus. Das Wasser im Eimer ist nicht gefroren. Wie geht das?",
        solution: "Der Mann schwingt den Eimer im Kreis (wie ein Lasso). Durch die Zentrifugalkraft bleibt das Wasser im Eimer.",
        hints: ["Bewegung", "Kreis", "Zentrifugalkraft"]
    },
    {
        id: 106,
        title: "Der Leiter im Zug",
        riddle: "Der Leiter eines großen Unternehmens stieg am Montag in eine volle Bahn. Er war sehr nervös und schwitze stark. Als er wieder ausstieg, war er wieder ganz relaxt. Warum?",
        solution: "Der Mann hatte Platzangst/Klaustrophobie. Als er aus dem vollen Zug ausstieg, war er erleichtert.",
        hints: ["Psychische Ursache", "Enge Räume", "Phobos"]
    },
    {
        id: 107,
        title: "Ein Mann wird wach",
        riddle: "Ein Mann wird wach, hört ein Geräusch und kriegt den Schreck seines Lebens. Was ist passiert?",
        solution: "Der Mann ist Leuchtturmwärter. Er hört das Geräusch eines Schiffshorns und realisiert, dass er vergessen hat, das Leuchtfeuer einzuschalten.",
        hints: ["Beruf am Meer", "Warnsignal", "Vergessene Pflicht"]
    },
    {
        id: 108,
        title: "Das Fenster",
        riddle: "Ein Mann schaut aus dem Fenster und sieht eine Frau vorbeigehen. Kurz darauf ist er tot. Was ist geschehen?",
        solution: "Der Mann saß in seinem Auto mit dem er an seinem Haus vorbeigefahren ist. Durch die junge Frau war er so abgelenkt, dass er einen Unfall verursacht hat bei dem er ums Leben gekommen ist.",
        hints: ["Im Auto", "Ablenkung", "Verkehrsunfall"]
    },
    {
        id: 109,
        title: "Betrunken am Steuer",
        riddle: "Ein Mann fährt betrunken Auto und verursacht einen Unfall an dem er eindeutig schuld ist. Das andere Fahrzeug hat einen Totalschaden und es gibt sogar einen Toten. Trotzdem kommt er mit einer Geldstrafe davon. Warum hat der Richter wohl so gnädig geurteilt?",
        solution: "Der Tote war der betrunkene Fahrer selbst. Er hat nur Sachschaden verursacht und sich selbst getötet.",
        hints: ["Wer ist tot?", "Selbstverschuldet", "Nur Sachschaden"]
    },
    {
        id: 110,
        title: "FKK-Strand",
        riddle: "Ein FKK-Strand gefüllt mit Leuten. Doch niemand ist völlig nackt. Wieso nicht? Können die alle nicht lesen?",
        solution: "Der FKK-Strand gehört zu einem All-Inklusive-Hotel. Die Gäste dürfen ihr Identitätsarmband nicht ablegen.",
        hints: ["Hotel-Regel", "Identifikation", "Armband"]
    },
    {
        id: 111,
        title: "Unter einer Straßenlaterne sitzend",
        riddle: "Eine Frau sitzt in der Fußgängerzone unter einer Straßenlaterne. Sie steht auf und wird festgenommen.",
        solution: "Die Frau saß in der Fußgängerzone und gab vor, nicht laufen zu können um, beim Betteln mehr Geld zu bekommen. Als sie am Ende des Tages aufstand um nach Hause zu gehen, sah sie ein Polizist, der an ihr vorbeiging, und nahm sie wegen Betruges fest.",
        hints: ["Vorgetäuschte Behinderung", "Betteln", "Betrug"]
    },
    {
        id: 112,
        title: "Mann kommt an Fenster vorbei",
        riddle: "Ein Mann kommt an einem Fenster vorbei. Kurz darauf ist er tot.",
        solution: "Der Mann springt aus einem hohen Stockwerk. Er kommt an einem Fenster eines unteren Stockwerks vorbei, bevor er am Boden aufschlägt.",
        hints: ["Hohe Gebäude", "Sprung", "Vorbeiflug"]
    },
    {
        id: 113,
        title: "Paul und Paula im Konzert",
        riddle: "Paul und Paula besuchen ein Konzert. Plötzlich wird Paul unruhig und beginnt Paula heftig zu treten. Enttäuscht verlässt Paula das Konzert und geht nach Hause. Was ist passiert?",
        solution: "Paul ist das ungeborene Baby im Bauch von Paula. Die laute Musik beim Konzert macht ihn unruhig und er tritt im Mutterleib. Paula hat Schmerzen und muss deshalb das Konzert verlassen.",
        hints: ["Schwangerschaft", "Ungeborenes Baby", "Laute Musik"]
    },
    {
        id: 114,
        title: "Obdachloser und der Arm",
        riddle: "Ein Obdachloser geht in eine Arztpraxis und lässt sich dort einen vollkommen gesunden Arm amputieren. Dieser wird kurz darauf mit der Post verschickt. Ein Mann öffnet das Paket und ist zufrieden. Was ist hier geschehen?",
        solution: "Es handelt sich um einen Versicherungsbetrug. Der 'Obdachlose' ist der Komplize des Mannes, der seine Hand verloren haben will, um Versicherungsgeld zu kassieren. Sie schicken den amputierten Arm als 'Beweis' an die Versicherung.",
        hints: ["Versicherung", "Betrug", "Falscher Beweis"]
    },
    {
        id: 115,
        title: "Mann besucht anderen Mann",
        riddle: "Ein Mann besucht einen anderen Mann, sagt etwas zu ihm, worauf ihn der Besuchte anlächelt. Daraufhin schlägt der Besucher mit aller Kraft auf den Besuchten ein, dieser stirbt an den Folgen.",
        solution: "Der Besucher ist ein Henker, der Besuchte ein zum Tode Verurteilter. Das Lächeln ist die letzte Geste des Verurteilten, bevor die Hinrichtung vollzogen wird.",
        hints: ["Justiz", "Todesstrafe", "Hinrichtung"]
    },
    {
        id: 116,
        title: "Mann und Hund auf Wiese",
        riddle: "Ein Mann und ein Hund liegen auf der grünen Wiese. Beide sind tot. Was ist passiert?",
        solution: "Der Mann war blind und sein Blindenhund führte ihn. Beide wurden vom Blitz getroffen.",
        hints: ["Blindenführhund", "Wetter", "Naturgewalt"]
    },
    {
        id: 117,
        title: "Nach dem Medizinerkonkress",
        riddle: "Nach einem Medizinerkonkress unterhalten sich zwei Männer sehr lange in der Hotelobby. Als es spät wird begeben sich beide Männer nach oben. Mitten auf der Treppe spürt der eine plötzlich einen Schmerz, zieht eine Pistole und schießt auf den anderen Mann.",
        solution: "Die beiden Männer sind auf einem Schiff. Der eine bekommt einen Herzinfarkt. Er weiß, dass der andere Arzt ist, kann aber nicht mehr sprechen. Also schießt er ihn ins Bein, damit er stehen bleibt und ihm hilft.",
        hints: ["Auf einem Schiff", "Herzinfarkt", "Stummer Hilferuf"]
    },
    {
        id: 118,
        title: "Die Frau und die Brücke",
        riddle: "Diese Geschichte spielt im Zweiten Weltkrieg. Eine schmale Brücke, die über eine Schlucht zwischen Deutschland und der Schweiz führte, wurde von einem deutschen Posten bewacht. Er hatte den Befehl, jeden zu erschießen, der versuchte, über die Brücke zu entkommen, und jeden zurückzuschicken, der die Brücke ohne Passierschein überqueren wollte. Der Posten befand sich auf deutscher Seite in einem Wachhäuschen, aus dem er alle drei Minuten herauskam, um die Brücke zu kontrollieren. Eine Frau, die unbedingt aus Deutschland fliehen musste, aber keinen Passierschein bekommen konnte, hatte sich in der Nähe der Brücke versteckt. Sie wusste, dass sie sich an dem Posten vorbeischleichen konnte, während er sich in dem Wachhäuschen aufhielt, doch es dauerte zwischen fünf und sechs Minuten, die Brücke zu überqueren.",
        solution: "Die Frau geht auf die Brücke, während der Wachmann im Häuschen ist. Nach 2,5 Minuten dreht sie um und geht rückwärts. Wenn der Wachmann herauskommt, denkt er, sie kommt aus der Schweiz und schickt sie 'zurück' - also in die Schweiz.",
        hints: ["Umkehren", "Täuschung", "Richtung verwechseln"]
    }
];

export default blackStories;