// Niederschlagsinformationen
export const getPrecipitationInfo = (amount) => {
  if (amount === 0) {
    return {
      description: "Kein Niederschlag",
      details: "Trocken - perfekt für Outdoor-Aktivitäten"
    };
  } else if (amount < 0.1) {
    return {
      description: "Sprühregen",
      details: "Sehr leichter Niederschlag - kaum spürbar, Regenjacke empfohlen"
    };
  } else if (amount < 0.5) {
    return {
      description: "Leichter Regen",
      details: "Schwacher Niederschlag - Regenschirm reicht aus"
    };
  } else if (amount < 1.5) {
    return {
      description: "Mäßiger Regen",
      details: "Normaler Regen - wasserdichte Kleidung empfohlen"
    };
  } else if (amount < 4) {
    return {
      description: "Starker Regen",
      details: "Kräftiger Niederschlag - Indoor-Aktivitäten bevorzugen"
    };
  } else if (amount < 10) {
    return {
      description: "Sehr starker Regen",
      details: "Intensiver Niederschlag - Vorsicht im Straßenverkehr, Überschwemmungsgefahr in tiefliegenden Gebieten"
    };
  } else {
    return {
      description: "Extremer Niederschlag",
      details: "⚠️ <strong>KRITISCH:</strong> Unwetter - Bleiben Sie zu Hause, Überschwemmungen möglich"
    };
  }
};

// Luftqualitätsindex Informationen
export const getAirQualityInfo = (aqi) => {
  if (aqi <= 50) {
    return {
      level: "Gut",
      color: "text-green-500",
      bgColor: "bg-green-50",
      darkBgColor: "bg-green-900",
      description: "Ausgezeichnet",
      details: "Die Luftqualität ist zufriedenstellend und birgt wenig oder gar kein Risiko."
    };
  } else if (aqi <= 100) {
    return {
      level: "Mäßig",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      darkBgColor: "bg-yellow-900",
      description: "Akzeptabel",
      details: "Luftqualität ist für die meisten Menschen akzeptabel. Empfindliche Personen sollten längere Outdoor-Aktivitäten reduzieren."
    };
  } else if (aqi <= 150) {
    return {
      level: "Ungesund für empfindliche Gruppen",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      darkBgColor: "bg-orange-900",
      description: "Bedenklich",
      details: "Mitglieder empfindlicher Gruppen können gesundheitliche Auswirkungen erfahren. Die breite Öffentlichkeit ist weniger wahrscheinlich betroffen."
    };
  } else if (aqi <= 200) {
    return {
      level: "Ungesund",
      color: "text-red-500",
      bgColor: "bg-red-50",
      darkBgColor: "bg-red-900",
      description: "Schlecht",
      details: "⚠️ Jeder kann anfangen, gesundheitliche Auswirkungen zu erfahren. Outdoor-Aktivitäten vermeiden."
    };
  } else if (aqi <= 300) {
    return {
      level: "Sehr ungesund",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      darkBgColor: "bg-purple-900",
      description: "Sehr schlecht",
      details: "⚠️ <strong>WARNUNG:</strong> Gesundheitsnotstand. Die gesamte Bevölkerung ist wahrscheinlich betroffen."
    };
  } else {
    return {
      level: "Gefährlich",
      color: "text-red-700",
      bgColor: "bg-red-100",
      darkBgColor: "bg-red-800",
      description: "Extrem gefährlich",
      details: "🚨 <strong>KRITISCH:</strong> Gesundheitsalarm - Alle sollten draußen körperliche Aktivitäten vermeiden."
    };
  }
};

// Windgeschwindigkeits-Informationen
export const getWindInfo = (speed) => {
  const kmh = Math.round(speed * 3.6);
  
  if (kmh < 1) {
    return { description: "Windstille", details: "Rauch steigt senkrecht auf" };
  } else if (kmh < 6) {
    return { description: "Leiser Zug", details: "Rauch zeigt Windrichtung an" };
  } else if (kmh < 12) {
    return { description: "Leichte Brise", details: "Blätter rascheln, Wind im Gesicht spürbar" };
  } else if (kmh < 20) {
    return { description: "Schwache Brise", details: "Blätter und dünne Zweige bewegen sich" };
  } else if (kmh < 29) {
    return { description: "Mäßige Brise", details: "Dünnere Äste bewegen sich, Papier wird aufgewirbelt" };
  } else if (kmh < 39) {
    return { description: "Frische Brise", details: "Kleinere Laubbäume schwanken" };
  } else if (kmh < 50) {
    return { description: "Starker Wind", details: "Große Äste bewegen sich, Regenschirm schwer zu halten" };
  } else if (kmh < 62) {
    return { description: "Steifer Wind", details: "Ganze Bäume bewegen sich, Widerstand beim Gehen" };
  } else if (kmh < 75) {
    return { description: "Stürmischer Wind", details: "⚠️ Zweige brechen, Gehen gegen Wind erschwert" };
  } else if (kmh < 89) {
    return { description: "Sturm", details: "⚠️ Äste brechen ab, leichte Schäden an Gebäuden" };
  } else if (kmh < 103) {
    return { description: "Schwerer Sturm", details: "🚨 Bäume werden entwurzelt, erhebliche Schäden" };
  } else {
    return { description: "Orkan", details: "🚨 <strong>KRITISCH:</strong> Schwere Verwüstungen, Lebensgefahr" };
  }
};

// Luftfeuchtigkeits-Informationen  
export const getHumidityInfo = (humidity) => {
  if (humidity < 30) {
    return {
      description: "Sehr trocken",
      details: "Kann zu trockener Haut und Atemwegsproblemen führen. Luftbefeuchter empfohlen."
    };
  } else if (humidity < 40) {
    return {
      description: "Trocken", 
      details: "Niedrige Luftfeuchtigkeit - gut für Menschen mit Atemproblemen"
    };
  } else if (humidity < 60) {
    return {
      description: "Optimal",
      details: "Ideale Luftfeuchtigkeit für Komfort und Gesundheit"
    };
  } else if (humidity < 70) {
    return {
      description: "Leicht feucht",
      details: "Etwas erhöhte Luftfeuchtigkeit - noch angenehm"
    };
  } else if (humidity < 80) {
    return {
      description: "Feucht",
      details: "Hohe Luftfeuchtigkeit - kann sich schwül anfühlen"
    };
  } else {
    return {
      description: "Sehr feucht",
      details: "Sehr hohe Luftfeuchtigkeit - unangenehm schwül, Schimmelgefahr"
    };
  }
};