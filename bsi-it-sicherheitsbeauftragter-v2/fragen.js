// IT-Sicherheit Fragenkatalog
const allQuestions = {
    'it-sicherheit': [
        {
            id: "1.1",
            question: "Welche Anforderungen der ISO/IEC 27001 müssen erfüllt werden? (1)",
            options: [
                {
                    text: "Es müssen alle Anforderungen des ISO/IEC 27001 erfüllt werden",
                    correct: true
                },
                {
                    text: "Es sollten die meisten Anforderungen des ISO/IEC 27001 erfüllt werden",
                    correct: false
                },
                {
                    text: "Nur die Anforderungen der ISO/IEC 27001 bezüglich der Informationssicherheitspolitik.",
                    correct: false
                },
                {
                    text: "Nur die Anforderungen der ISO/IEC 27000 müssen erfüllt werden.",
                    correct: false
                }
            ]
        },
        {
            id: "1.2",
            question: "Der Abschnitt „Bewertung der Leistung entspricht im PDCA-Zyklus der Phase…(1)",
            options: [
                {
                    text: "...PLAN",
                    correct: false
                },
                {
                    text: "...DO",
                    correct: false
                },
                {
                    text: "...CHECK",
                    correct: true
                },
                {
                    text: "...ACT",
                    correct: false
                }
            ]
        },
        {
            id: "1.3",
            question: "Die Verteilung der Rollen, Verantwortlichkeiten und Befugnisse in der Organisation in Bezug auf ISMS…(1+)",
            options: [
                {
                    text: "…wird von der ISO/IEC 27001 genau vorgegeben.",
                    correct: false
                },
                {
                    text: "…erfolgt in Anbetracht der erforderlichen Fachkenntnisse und Sozialkompetenzen.",
                    correct: true
                },
                {
                    text: "…wird von der obersten Leitung vorgenommen.",
                    correct: true
                },
                {
                    text: "…muss veröffentlicht werden",
                    correct: false
                }
            ]
        },
        {
            id: "1.4",
            question: "In welchen Zeitabständen müssen Organisationen gem. ISO/IEC 27001 interne Audits durchführen? (1)",
            options: [
                {
                    text: "Jährlich",
                    correct: true
                },
                {
                    text: "Alle zwei Jahre",
                    correct: false
                },
                {
                    text: "In den jeweils von der Geschäftsführung geplanten Abständen.",
                    correct: false
                },
                {
                    text: "Alle drei Jahre",
                    correct: false
                }
            ]
        },
        {
            id: "1.5",
            question: "Was sind die Aufgaben innerhalb des ISM-Teams? (1+)",
            options: [
                {
                    text: "Erstellung eines Sicherheitskonzeptes",
                    correct: true
                },
                {
                    text: "Zertifizierung eines Sicherheitsprozesses",
                    correct: false
                },
                {
                    text: "Bestimmung der Informationssicherheitsziele und -strategien",
                    correct: true
                },
                {
                    text: "Konzeption von Schulungs- und Sensibilisierungsprogrammen",
                    correct: true
                }
            ]
        },
        {
            id: "1.6",
            question: "Im Rahmen einer Informationssicherheitsrisikobeurteilung müssen die Risiken… (1+)",
            options: [
                {
                    text: "..analysiert werden",
                    correct: true
                },
                {
                    text: "...identifiziert werden",
                    correct: true
                },
                {
                    text: "...bewertet werden",
                    correct: true
                },
                {
                    text: "...auditiert werden.",
                    correct: false
                }
            ]
        },
        {
            id: "1.7",
            question: "Was spielt bei der Festlegung des Anwendungsbereichs eines ISMS gem. ISO/IEC 27001 keine Rolle? (1)",
            options: [
                {
                    text: "Anzahl der Standorte der Organisation.",
                    correct: false
                },
                {
                    text: "Budget der Organisation.",
                    correct: true
                },
                {
                    text: "Werte der Organisation",
                    correct: false
                },
                {
                    text: "Anforderungen der interessierten Parteien",
                    correct: false
                }
            ]
        },
        {
            id: "1.8",
            question: "Was ist bei der Festlegung des Scope im Sinne eines ISMS zu beachten? (1+)",
            options: [
                {
                    text: "Ob alle Kern- und Supportprozesse bekannt und berücksichtigt werden",
                    correct: true
                },
                {
                    text: "Wenn sich IT-Hardware in der Cloud befindet, muss der Scope nicht berücksichtigt werden.",
                    correct: false
                },
                {
                    text: "Gesetze und Vorschriften müssen im Scope berücksichtigt werden",
                    correct: true
                },
                {
                    text: "Es müssen Produkte und Technologien definiert werden",
                    correct: false
                }
            ]
        },
        {
            id: "1.9",
            question: "Welches der folgenden Regelwerke für Informationssicherheit ist international genormt? (1)",
            options: [
                {
                    text: "COBIT",
                    correct: false
                },
                {
                    text: "IT-Grundschutz-Standards",
                    correct: false
                },
                {
                    text: "ISO/IEC 27001",
                    correct: true
                },
                {
                    text: "ITIL",
                    correct: false
                }
            ]
        },
        {
            id: "1.10",
            question: "Was bedeutet die Abkürzung SoA? (1)",
            options: [
                {
                    text: "Statement of Application",
                    correct: false
                },
                {
                    text: "Service of Applicability",
                    correct: false
                },
                {
                    text: "Statement of Applicability",
                    correct: true
                },
                {
                    text: "Service of Application",
                    correct: false
                }
            ]
        },
        {
            id: "1.11",
            question: "Operative Aufgaben im Umfeld der Informationssicherheit werden umgesetzt vom: (1)",
            options: [
                {
                    text: "CIO",
                    correct: false
                },
                {
                    text: "CISO",
                    correct: false
                },
                {
                    text: "ISO",
                    correct: true
                },
                {
                    text: "CSO",
                    correct: false
                }
            ]
        },
        {
            id: "1.12",
            question: "Ein ISMS ist zertifizierbar nach der… (1)",
            options: [
                {
                    text: "…ISO/IEC 27001",
                    correct: true
                },
                {
                    text: "…ISO/IEC 27002",
                    correct: false
                },
                {
                    text: "…ISO/IEC 27004",
                    correct: false
                },
                {
                    text: "…ISO/IEC 27005",
                    correct: false
                }
            ]
        },
        {
            id: "1.13",
            question: "Was sind die grundlegenden Schutzziele der Informationssicherheit? (1+)",
            options: [
                {
                    text: "Vertraulichkeit",
                    correct: true
                },
                {
                    text: "Transparenz",
                    correct: false
                },
                {
                    text: "Verfügbarkeit",
                    correct: true
                },
                {
                    text: "Integrität",
                    correct: true
                }
            ]
        },
        {
            id: "1.14",
            question: "Was versteht man unter Assets/Werte im Sinne eines ISMS? (1+)",
            options: [
                {
                    text: "Vermögen des Unternehmens",
                    correct: true
                },
                {
                    text: "Ausgelagerte Services",
                    correct: true
                },
                {
                    text: "IT-Hardware/IT-Software",
                    correct: true
                },
                {
                    text: "Personen/Personengruppe, die relevante Informationen besitzen",
                    correct: true
                }
            ]
        },
        {
            id: "1.15",
            question: "Was sind die Unterschiede zwischen Datenschutz und Informationssicherheit? (1+)",
            options: [
                {
                    text: "Die Umsetzung des Datenschutzes unterliegt strengen gesetzlichen Anforderungen",
                    correct: true
                },
                {
                    text: "Beim Datenschutz können Unternehmen unterschiedliche Ansätze und Konzepte einführen.",
                    correct: false
                },
                {
                    text: "Bei der Informationssicherheit können Unternehmen unterschiedliche Ansätze und Konzepte einführen",
                    correct: true
                },
                {
                    text: "Die Umsetzung der Informationssicherheit unterliegt strengen gesetzlichen Anforderungen",
                    correct: false
                }
            ]
        },
        {
            id: "1.16",
            question: "Was ist das Ziel des Informationssicherheitsrisikobehandlungsprozesses? (1+)",
            options: [
                {
                    text: "Bei den Risikoeigentümern eine Genehmigung einzuholen",
                    correct: false
                },
                {
                    text: "Maßnahmen zur Umsetzung der Optionen festzulegen",
                    correct: true
                },
                {
                    text: "Dass er im Einklang mit der Informationssicherheitspolitik steht",
                    correct: true
                },
                {
                    text: "Angemessene Optionen für die Risikobehandlung auszuwählen",
                    correct: true
                }
            ]
        },
        {
            id: "1.17",
            question: "Welche Aufgaben haben üblicherweise Informationssicherheitsbeauftragte? (1+)",
            options: [
                {
                    text: "die Entwicklung von Sicherheitskonzepten zu koordinieren",
                    correct: true
                },
                {
                    text: "die eingesetzte Sicherheitstechnik zu konfigurieren",
                    correct: false
                },
                {
                    text: "der Leitungsebene über den Stand der Informationssicherheit zu berichten",
                    correct: true
                },
                {
                    text: "Presseanfragen zu dem Stand der Informationssicherheit im Unternehmen zu beantworten",
                    correct: false
                }
            ]
        },
        {
            id: "1.18",
            question: "Wer ist für die Freigabe der Leitlinie zur Informationssicherheit verantwortlich? (1)",
            options: [
                {
                    text: "das IS-Management-Team",
                    correct: false
                },
                {
                    text: "der ISB",
                    correct: false
                },
                {
                    text: "die Unternehmens- oder Behördenleitung",
                    correct: true
                },
                {
                    text: "die Öffentlichkeitsabteilung eines Unternehmens oder einer Behörde",
                    correct: false
                }
            ]
        },
        {
            id: "1.19",
            question: "Welche wesentlichen Ziele muss ein ISO/ eine ISMS-Organisation verfolgen? (1+)",
            options: [
                {
                    text: "Sicherheitsvorfälle aufdecken und angemessen untersuchen",
                    correct: true
                },
                {
                    text: "Das Management von der Notwendigkeit der Informationssicherheit überzeugen",
                    correct: false
                },
                {
                    text: "Sensibilisierungs- und Schulungsmaßnahmen initiieren",
                    correct: true
                },
                {
                    text: "Die Einhaltung von Richtlinien kontrollieren",
                    correct: true
                }
            ]
        },
        {
            id: "1.20",
            question: "Die Europäische Datenschutzgrundverordnung (EU-DSGVO) gilt...(1+)",
            options: [
                {
                    text: "...nicht für die Einrichtung des Gesundheitswesens, da diese einer eigenen Datenschutzgesetzgebung unterworfen sind.",
                    correct: false
                },
                {
                    text: "...für alle öffentlichen Einrichtung des Bundes, die personenbezogenen Daten verarbeiten",
                    correct: true
                },
                {
                    text: "...für alle nicht-öffentlichen Einrichtungen, die personenbezogene Daten verarbeiten",
                    correct: true
                },
                {
                    text: "...nicht für Kleinunternehmer",
                    correct: false
                }
            ]
        },
        {
            id: "1.21",
            question: "Die Verantwortung der obersten Leitung gemäß der ISO/IEC 27001 umfasst: (1+)",
            options: [
                {
                    text: "Bildung eines 5-köpfigem ISM-Teams",
                    correct: false
                },
                {
                    text: "Förderung der fortlaufenden Verbesserung",
                    correct: true
                },
                {
                    text: "Festlegung der Informationssicherheitspolitik",
                    correct: true
                },
                {
                    text: "Bereitstellung der für das ISMS erforderlichen Ressourcen",
                    correct: true
                }
            ]
        },
        {
            id: "1.22",
            question: "Zu den externen Themen/Faktoren, die den Kontext der Organisation beeinflussen können, gehören: (1+)",
            options: [
                {
                    text: "Gesetze",
                    correct: true
                },
                {
                    text: "Markt",
                    correct: true
                },
                {
                    text: "Unternehmenswerte",
                    correct: false
                },
                {
                    text: "Wissen der Organisation",
                    correct: false
                }
            ]
        },
        {
            id: "1.23",
            question: "Compliance-Richtlinien dienen... (1)",
            options: [
                {
                    text: "...der Festlegung von Informationssicherheitskennzahlen",
                    correct: false
                },
                {
                    text: "...der Umsetzung und Einhaltung regulatorischer, vertraglicher und gesetzlicher Vorgaben",
                    correct: true
                },
                {
                    text: "...der Software-Steuerung",
                    correct: false
                },
                {
                    text: "...der Verwaltung von Lieferantenbeziehungen",
                    correct: false
                }
            ]
        },
        {
            id: "1.24",
            question: "Warum wird eine Managementbewertung (Management-Review) durchgeführt? (1)",
            options: [
                {
                    text: "Als Nachweis für die Zertifizierungsstelle zur Einführung des ISMS",
                    correct: false
                },
                {
                    text: "Die Managementbewertung ist die Grundlage für die Konformitätsbewertung durch einen externen Auditor",
                    correct: false
                },
                {
                    text: "Um die fortdauernde Eignung, Angemessenheit und Wirksamkeit des ISMS sicherzustellen",
                    correct: true
                },
                {
                    text: "Um eine einmalige Bewertung der Qualifikationen der obersten Leitung zu dokumentieren",
                    correct: false
                }
            ]
        },
        {
            id: "1.25",
            question: "Welche Vorteile kann eine Zertifizierung nach ISO/IEC 27001 bringen? (1+)",
            options: [
                {
                    text: "Erhöhung der Wettbewerbsfähigkeit",
                    correct: true
                },
                {
                    text: "Erhöhung des Haftungsrisikos",
                    correct: false
                },
                {
                    text: "Höhere Rechtssicherheit",
                    correct: true
                },
                {
                    text: "Höheres Risiko für die Datensicherheit",
                    correct: false
                }
            ]
        },
        {
            id: "1.26",
            question: "Welche Aussagen bezüglich des internen Audits gemäß ISO/IEC 27001 sind nicht richtig? (1+)",
            options: [
                {
                    text: "Im internen Audit muss man alle Bereiche des Unternehmens überprüfen",
                    correct: true
                },
                {
                    text: "Im internen Audit wird die Wirksamkeit des ISMS überprüft",
                    correct: false
                },
                {
                    text: "Das interne Audit ist alle 2 Jahre durchzuführen",
                    correct: true
                },
                {
                    text: "Interne Audits dürfen zur Gewährung der Objektivität nur von externem Personal durchgeführt werden",
                    correct: true
                }
            ]
        },
        {
            id: "1.27",
            question: "Was ist unter dem Schutzziel \"Verfügbarkeit\" im Sinne der Informationssicherheit zu verstehen? (1)",
            options: [
                {
                    text: "Alle Daten stehen jedem zur Verfügung",
                    correct: false
                },
                {
                    text: "Daten sind für befugte Personen verfügbar und der Zugang zu ihnen kann nach einem physischen oder technischen Zwischenfall rasch wiederhergestellt werden",
                    correct: true
                },
                {
                    text: "Vor der Erfassung der Daten wird die Verfügbarkeit der benötigten Ressourcen geprüft",
                    correct: false
                },
                {
                    text: "Die Berechtigung zur Verarbeitung der Daten darf jedem erteilt werden",
                    correct: false
                }
            ]
        },
        {
            id: "1.28",
            question: "Welche sind die grundsätzlichen Aufgaben der IT-Sicherheit? (1+)",
            options: [
                {
                    text: "Integrität der IT-Systeme sicherstellen",
                    correct: true
                },
                {
                    text: "Verfügbarkeit der IT-Systeme sicherstellen",
                    correct: true
                },
                {
                    text: "Schutz der Personen",
                    correct: false
                },
                {
                    text: "Vertraulichkeit der Information sicherstellen",
                    correct: true
                }
            ]
        },
        {
            id: "1.29",
            question: "Die Informationssicherheitspolitik gemäß der ISO/IEC 27001... (1)",
            options: [
                {
                    text: "...ist Aufgabe des IT-Administrators",
                    correct: false
                },
                {
                    text: "...wird von der Norm genau vorgegeben",
                    correct: false
                },
                {
                    text: "...muss nicht als dokumentierte Information vorliegen",
                    correct: false
                },
                {
                    text: "...ist die Verantwortung der Führung",
                    correct: true
                }
            ]
        },
        {
            id: "1.30",
            question: "Wie oft muss eine Risikobeurteilung durchgeführt werden? (1+)",
            options: [
                {
                    text: "Einmal im Jahr",
                    correct: false
                },
                {
                    text: "In den geplanten Abständen",
                    correct: true
                },
                {
                    text: "Dreimal im Jahr",
                    correct: false
                },
                {
                    text: "Nach erheblichen internen Veränderungen",
                    correct: true
                }
            ]
        },
        {
            id: "1.31",
            question: "Wie muss beim Auftreten einer Nichtkonformität reagiert werden? (1+)",
            options: [
                {
                    text: "Sofortige Durchführung einer Managementbewertung",
                    correct: false
                },
                {
                    text: "Ursachenforschung einleiten",
                    correct: true
                },
                {
                    text: "Zunächst die Freigabe des Geschäftsführers abwarten",
                    correct: false
                },
                {
                    text: "Erforderliche Maßnahmen ergreifen",
                    correct: true
                }
            ]
        },
        {
            id: "1.32",
            question: "Gefährdung entsteht beim Zusammentreffen von: (1)",
            options: [
                {
                    text: "Eintrittswahrscheinlichkeit und Wirkungsdauer",
                    correct: false
                },
                {
                    text: "Risiko und Anzahl der Sicherheitsvorfälle",
                    correct: false
                },
                {
                    text: "Bedrohung und Schwachstelle",
                    correct: true
                },
                {
                    text: "Ausfall und Schadenshöhe",
                    correct: false
                }
            ]
        },
        {
            id: "1.33",
            question: "Im Rahmen des Business Continuity Managements... (1+)",
            options: [
                {
                    text: "...werden verschiedenen Ereignissen (Incidents) betrachtet, wie z.B. IT-Systemausfall oder Personalausfall",
                    correct: true
                },
                {
                    text: "...wird hauptsächlich eine Ursachenanalyse durchgeführt",
                    correct: false
                },
                {
                    text: "...ist das Hauptziel, Maßnahmen festzulegen, die verhindern, dass Notfallsituationen überhaupt entstehen",
                    correct: true
                },
                {
                    text: "...müssen die festgelegten Maßnahmen zur Aufrechterhaltung der Informationssicherheit in regelmäßigen Abständen überprüft werden",
                    correct: false
                }
            ]
        },
        {
            id: "1.34",
            question: "Gemäß der ISO/IEC 27001 sollte die Informationssicherheitsrichtlinie (IS-Politik) … (1+)",
            options: [
                {
                    text: "…veröffentlicht werden.",
                    correct: true
                },
                {
                    text: "…von dem Informationssicherheitsbeauftragten verabschiedet werden.",
                    correct: false
                },
                {
                    text: "…den Beschäftigten und allen maßgeblichen externen Parteien kommuniziert werden",
                    correct: true
                },
                {
                    text: "…nicht als dokumentierte Information verfügbar sein",
                    correct: false
                }
            ]
        },
        {
            id: "1.35",
            question: "Warum ist die Lenkung dokumentierter Information erforderlich? (1+)",
            options: [
                {
                    text: "Um die Nachvollziehbarkeit von Änderungen der dokumentierten Informationen sicherzustellen.",
                    correct: true
                },
                {
                    text: "Um sicherzustellen, dass keine falschen oder nicht mehr aktuell dokumentierte Informationen verwendet werden",
                    correct: true
                },
                {
                    text: "Um den Zugriff aller interessierten Personen auf die dokumentierte Information jederzeit sicherzustellen.",
                    correct: false
                },
                {
                    text: "Um die Verfügbarkeit dokumentierter Informationen sicherzustellen",
                    correct: true
                }
            ]
        },
        {
            id: "1.36",
            question: "Was ist der Unterschied zwischen Bedrohung und Schwachstelle im Bereich Informationssicherheit? (1+)",
            options: [
                {
                    text: "Eine Bedrohung wird durch eine schon vorhandene Schwachstelle zur Gefährdung für ein Objekt.",
                    correct: true
                },
                {
                    text: "Durch eine Schwachstelle wird ein Objekt sehr anfällig für eine Bedrohung",
                    correct: true
                },
                {
                    text: "Eine Bedrohung ist ein Umstand oder Ereignis, durch den oder das ein Schaden entstehen kann.",
                    correct: true
                },
                {
                    text: "Eine Bedrohung führt immer zum Schaden.",
                    correct: false
                }
            ]
        },
        {
            id: "1.37",
            question: "Welche Norm enthält Umsetzungsempfehlungen zu den Maßnahmen der ISO/IEC 27001? (1)",
            options: [
                {
                    text: "ISO/IEC 27001a",
                    correct: false
                },
                {
                    text: "ISO/IEC 27002",
                    correct: true
                },
                {
                    text: "ISO/IEC 27006",
                    correct: false
                },
                {
                    text: "ISO/IEC 27007",
                    correct: false
                }
            ]
        },
        {
            id: "1.38",
            question: "Welche Schritte sind für den Aufbau eines ISMS gemäß ISO/IEC 27001 erforderlich? (1+)",
            options: [
                {
                    text: "Implementierung eines Risikoprozesses",
                    correct: true
                },
                {
                    text: "Ermittlung von Controls zur Risikobehandlung",
                    correct: false
                },
                {
                    text: "Identifizierung der Geschäftsprozesse",
                    correct: true
                },
                {
                    text: "Kontext der Organisation festlegen",
                    correct: true
                }
            ]
        },
        {
            id: "1.39",
            question: "Eine Risiko-Matrix... (1+)",
            options: [
                {
                    text: "...unterteilt die Risiken in beherrschbare und nicht beherrschbare Risiken",
                    correct: false
                },
                {
                    text: "...ist eine eindimensionale Visualisierung der Risiken",
                    correct: false
                },
                {
                    text: "...ist eine graphische Darstellung der identifizierten und bewerteten Risiken",
                    correct: true
                },
                {
                    text: "...kategorisiert die Risiken nach Eintrittshäufigkeit und Schadenshöhe",
                    correct: true
                }
            ]
        },
        {
            id: "1.40",
            question: "Im Access Management wir der Begriff \"Zutritt\" benutzt. Was bedeutet dieser? (1)",
            options: [
                {
                    text: "Die Fähigkeit sich an Systemen anmelden zu können.",
                    correct: false
                },
                {
                    text: "Die Fähigkeit auf Daten und Informationen zugreifen zu können.",
                    correct: false
                },
                {
                    text: "Die Fähigkeit als physische Person an datenverbeitende Anlagen und Speichermedien zu gelangen.",
                    correct: true
                },
                {
                    text: "Keine der genannten Aussagen ist richtig",
                    correct: false
                }
            ]
        },
        {
            id: "1.41",
            question: "Was versteht ISO/IEC 27000 unter dem Begriff Vertraulichkeit? (1)",
            options: [
                {
                    text: "Den Abschluss einer Vertraulichkeitsvereinbarung",
                    correct: false
                },
                {
                    text: "Die Geheimhaltungsverpflichtung aller Mitarbeiter, die Zugriff auf das ISMS haben",
                    correct: false
                },
                {
                    text: "Die Vertraulichkeit schützt die Werte im Hinblick auf ihre Richtigkeit und Vollständigkeit",
                    correct: false
                },
                {
                    text: "Eine Information ist für unautorisierte Personen, Entitäten oder Prozesse nicht zugänglich",
                    correct: true
                }
            ]
        },
        {
            id: "1.42",
            question: "Was versteht ISO/IEC 27000 unter dem Begriff Verfügbarkeit? (1)",
            options: [
                {
                    text: "Die Eigenschaft einer Information oder eines Wertes, für eine berechtigte Person oder Entität zugreifbar und nutzbar zu sein",
                    correct: true
                },
                {
                    text: "Die Eigenschaft einer informationsverarbeitenden Einrichtung, genügend Ressourcen für eine Aufgabe zur Verfügung zu haben",
                    correct: false
                },
                {
                    text: "Die Eigenschaft einer Information oder eines Wertes, vor Manipulation geschützt zu sein",
                    correct: false
                },
                {
                    text: "Die Eigenschaft einer Information oder eines Wertes, vor Offenlegung geschützt zu sein",
                    correct: false
                }
            ]
        },
        {
            id: "1.43",
            question: "Was bezeichnet ISO/IEC 27000 mit dem Begriff „dokumentierte Information\"? (1)",
            options: [
                {
                    text: "Beschreibung dessen, was als Ergebnis umgesetzter Maßnahmen erzielt werden soll",
                    correct: false
                },
                {
                    text: "Information, die von einer Organisation gelenkt und aufrechterhalten werden muss, und das Medium, auf dem sie enthalten ist",
                    correct: true
                },
                {
                    text: "Satz von in Wechselbeziehungen stehenden Mitteln und Tätigkeiten, die Eingaben in Ergebnisse umwandeln",
                    correct: false
                },
                {
                    text: "Alles, was für eine Organisation von Wert ist",
                    correct: false
                }
            ]
        },
        {
            id: "1.44",
            question: "Was versteht man gemäß ISO/IEC 27000 unter einem Prozess? (1)",
            options: [
                {
                    text: "Eine Maßnahme zur Veränderung eines Risikos",
                    correct: false
                },
                {
                    text: "Die Ausführung eines Computerprogramms durch eine informationsverarbeitende Einrichtung",
                    correct: false
                },
                {
                    text: "Ein Satz von zusammenhängenden und sich gegenseitig beeinflussenden Tätigkeiten, der Eingaben in Ergebnisse umwandelt",
                    correct: true
                },
                {
                    text: "Gerichtsverhandlung",
                    correct: false
                }
            ]
        },
        {
            id: "1.45",
            question: "Wobei handelt es sich nicht um einen relevanten Aspekt der Informationssicherheitsrisikobehandlung gemäß ISO/IEC 27001? (1)",
            options: [
                {
                    text: "Auswahl angemessener Optionen für die Risikobehandlung",
                    correct: false
                },
                {
                    text: "Erstellung einer Erklärung zur Anwendbarkeit",
                    correct: false
                },
                {
                    text: "Formulierung eines Plans für die Risikobehandlung",
                    correct: false
                },
                {
                    text: "Einholen der Genehmigung für die Akzeptanz von Restrisiken bei der Zertifizierungsstelle",
                    correct: true
                }
            ]
        },
        {
            id: "1.46",
            question: "Wie definiert ISO/IEC 27000 den Begriff Risikoanalyse? (1)",
            options: [
                {
                    text: "Koordinierte Aktivitäten zur Leitung und Kontrolle einer Organisation in Bezug auf Risiken",
                    correct: false
                },
                {
                    text: "Prozess für die Auswahl von Maßnahmen zur Behandlung identifizierter Risiken",
                    correct: false
                },
                {
                    text: "Festlegungen, um die Signifikanz eines Risikos zu bewerten",
                    correct: false
                },
                {
                    text: "Prozess, um die Beschaffenheit eines Risikos zu verstehen und das Risikoniveau zu bestimmen",
                    correct: true
                }
            ]
        },
        {
            id: "1.47",
            question: "Welche Arten von Audits sind in der Regel nach ISO/IEC 27000 zu unterscheiden? (1)",
            options: [
                {
                    text: "Vollständige und unvollständige",
                    correct: false
                },
                {
                    text: "Interne und externe",
                    correct: true
                },
                {
                    text: "Objektive und subjektive",
                    correct: false
                },
                {
                    text: "Angekündigte und unangekündigte",
                    correct: false
                }
            ]
        },
        {
            id: "1.48",
            question: "Welche Aufgabe hat ein Risikoeigentümer im Hinblick auf die Informationssicherheitsrisikobehandlung? (1)",
            options: [
                {
                    text: "Der Risikoeigentümer muss alle Restrisiken identifizieren und beseitigen",
                    correct: false
                },
                {
                    text: "Der Risikoeigentümer muss den vorgeschlagenen Restrisiken zustimmen",
                    correct: true
                },
                {
                    text: "Der Risikoeigentümer ist für die Umsetzung des ISMS zuständig",
                    correct: false
                },
                {
                    text: "Der Risikoeigentümer schreibt die Festlegungen des ISMS in einem Managementplan nieder",
                    correct: false
                }
            ]
        },
        {
            id: "1.49",
            question: "Über das Access Management gibt es die Möglichkeit, Sicherheitsbereiche einzurichten. Was ist bei der Erstellung eines Sicherheitsbereiches zu beachten? (1+)",
            options: [
                {
                    text: "Unbeaufsichtigte Tätigkeiten in Sicherheitsbereichen sollten vermieden werden",
                    correct: true
                },
                {
                    text: "Es müssen verfahren für die Arbeit in Sicherheitsbereichen ausgearbeitet und angewendet werden",
                    correct: true
                },
                {
                    text: "Das Mitführen von Foto-, Video-, oder Audio Aufzeichnungsgeräten sollte untersagt werden",
                    correct: true
                },
                {
                    text: "Sicherheitsbereiche sollten in unterschiedliche Zonen gegliedert und definiert werden",
                    correct: true
                }
            ]
        },
        {
            id: "1.50",
            question: "Wie hängen die drei Standards ISO 9000, ISO/IEC 20000 und ISO/IEC 27001 zusammen? (1)",
            options: [
                {
                    text: "ISO/IEC 27000 ist eine Kombination aus ISO 9000 und ISO/IEC 20000",
                    correct: false
                },
                {
                    text: "Diese drei Normen behandeln Managementsysteme in zum Teil überlappenden Anwendungsbereichen",
                    correct: true
                },
                {
                    text: "Diese drei Normen behandeln Management und Qualitätssicherung",
                    correct: false
                },
                {
                    text: "Die Zertifizierungen für diese Standards bauen aufeinander auf, d. h. eine Zertifizierung nach ISO/IEC 27001 ist nur möglich, wenn das Unternehmen auch nach ISO 9000 zertifiziert wurde",
                    correct: false
                }
            ]
        }
    ]
};
