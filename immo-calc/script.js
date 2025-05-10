// DOM Utility Funktionen
function get(id) {
    return document.getElementById(id);
}

function formatEuro(value) {
    return value.toLocaleString("de-DE", {style: "currency", currency: "EUR"});
}

function formatPercent(value) {
    return value.toFixed(2) + " %";
}

// Event Listener für Tab Navigation
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Tabs umschalten
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        get(tabId).classList.add('active');
    });
});

// Event Listener für Info Buttons
document.querySelectorAll('.info-btn').forEach(button => {
    button.addEventListener('click', () => {
        const infoId = button.getAttribute('data-info');
        const popup = get(infoId);
        popup.style.display = 'flex';
    });
});

// Event Listener für Popup-Schließen-Buttons
document.querySelectorAll('.close-popup').forEach(button => {
    button.addEventListener('click', () => {
        const popup = button.closest('.info-popup') || button.closest('.calculator-popup');
        popup.style.display = 'none';
    });
});

// Event Listener für Accordion im Hilfe-Bereich
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const accordionItem = header.parentElement;
        accordionItem.classList.toggle('active');
    });
});

// Nebenkosten-Rechner
const nebenkostenBtn = get('nebenkosten-calc');
nebenkostenBtn.addEventListener('click', () => {
    const popup = get('nebenkosten-rechner');
    popup.style.display = 'flex';
    
    // Aktuellen Kaufpreis übernehmen
    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
    get('nb-kaufpreis').value = kaufpreis;
    berechneNebenkosten();
});

function berechneNebenkosten() {
    const kaufpreis = parseFloat(get('nb-kaufpreis').value) || 0;
    const grunderwerbsteuer = parseFloat(get('nb-grunderwerbsteuer').value) || 0;
    const notar = parseFloat(get('nb-notar').value) || 0;
    const makler = parseFloat(get('nb-makler').value) || 0;
    
    const gesamtNebenkosten = 
        (kaufpreis * grunderwerbsteuer / 100) + 
        (kaufpreis * notar / 100) + 
        (kaufpreis * makler / 100);
    
    get('nb-ergebnis').textContent = formatEuro(gesamtNebenkosten);
}

get('nb-kaufpreis').addEventListener('input', berechneNebenkosten);
get('nb-grunderwerbsteuer').addEventListener('input', berechneNebenkosten);
get('nb-notar').addEventListener('input', berechneNebenkosten);
get('nb-makler').addEventListener('input', berechneNebenkosten);

get('nb-anwenden').addEventListener('click', () => {
    const gesamtNebenkosten = parseFloat(get('nb-ergebnis').textContent.replace(/[^\d,-]/g, '').replace(',', '.'));
    get('nebenkosten').value = Math.round(gesamtNebenkosten);
    get('nebenkosten-rechner').style.display = 'none';
    updateBerechnungen();
});

// Nicht umlagefähige Kosten-Rechner
const nichtUmlageBtn = get('nichtumlage-calc');
nichtUmlageBtn.addEventListener('click', () => {
    const popup = get('nichtumlage-rechner');
    popup.style.display = 'flex';
    berechneNichtumlageKosten();
});

function berechneNichtumlageKosten() {
    const hausverwaltung = parseFloat(get('nu-hausverwaltung').value) || 0;
    const versicherung = parseFloat(get('nu-versicherung').value) || 0;
    const instandhaltung = parseFloat(get('nu-instandhaltung').value) || 0;
    
    const gesamtNichtumlage = hausverwaltung + versicherung + instandhaltung;
    
    get('nu-ergebnis').textContent = formatEuro(gesamtNichtumlage);
}

document.querySelectorAll('.preset-btn').forEach(button => {
    button.addEventListener('click', () => {
        const wert = parseInt(button.getAttribute('data-value'));
        
        // Standardwerte für Neubau, Durchschnitt und Altbau
        if (wert === 65) {
            get('nu-hausverwaltung').value = 25;
            get('nu-versicherung').value = 10;
            get('nu-instandhaltung').value = 30;
        } else if (wert === 80) {
            get('nu-hausverwaltung').value = 25;
            get('nu-versicherung').value = 15;
            get('nu-instandhaltung').value = 40;
        } else if (wert === 110) {
            get('nu-hausverwaltung').value = 30;
            get('nu-versicherung').value = 20;
            get('nu-instandhaltung').value = 60;
        }
        
        berechneNichtumlageKosten();
    });
});

get('nu-hausverwaltung').addEventListener('input', berechneNichtumlageKosten);
get('nu-versicherung').addEventListener('input', berechneNichtumlageKosten);
get('nu-instandhaltung').addEventListener('input', berechneNichtumlageKosten);

get('nu-anwenden').addEventListener('click', () => {
    const gesamtNichtumlage = parseFloat(get('nu-ergebnis').textContent.replace(/[^\d,-]/g, '').replace(',', '.'));
    get('nichtumlage').value = Math.round(gesamtNichtumlage);
    get('nichtumlage-rechner').style.display = 'none';
    updateBerechnungen();
});

// Kreditraten-Rechner
const rateBtn = get('rate-calc');
rateBtn.addEventListener('click', () => {
    const popup = get('rate-rechner');
    popup.style.display = 'flex';
    
    // Daten aus Hauptrechner übernehmen
    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
    const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
    const eigenkapital = parseFloat(get('eigenkapital').value) || 0;
    const darlehen = Math.max(0, (kaufpreis + nebenkosten) - eigenkapital);
    
    const zins = parseFloat(get('zins').value) || 3.5;
    const tilgung = parseFloat(get('tilgung').value) || 2.0;
    
    get('kr-darlehen').value = darlehen;
    get('kr-zins').value = zins;
    get('kr-tilgung').value = tilgung;
    
    berechneKreditrate();
});

function berechneKreditrate() {
    const darlehen = parseFloat(get('kr-darlehen').value) || 0;
    const zins = parseFloat(get('kr-zins').value) / 100 || 0;
    const tilgung = parseFloat(get('kr-tilgung').value) / 100 || 0;
    const laufzeit = parseFloat(get('laufzeit').value) || 10;
    
    // Monatliche Rate berechnen (Zins + Tilgung)
    const monatsZins = zins / 12;
    const monatsTilgung = tilgung / 12;
    const monatsRate = darlehen * (monatsZins + monatsTilgung);
    
    // Restschuld nach Zinsbindung berechnen
    let restschuld = darlehen;
    let monate = laufzeit * 12;
    
    for (let i = 0; i < monate; i++) {
        const zinsen = restschuld * monatsZins;
        const tilgungsAnteil = monatsRate - zinsen;
        restschuld -= tilgungsAnteil;
    }
    
    if (restschuld < 0) restschuld = 0;
    
    // Zinsbindungsende
    const zinsbindungsEnde = new Date().getFullYear() + laufzeit;
    
    get('kr-ergebnis').textContent = formatEuro(monatsRate);
    get('kr-zinsbindung').textContent = zinsbindungsEnde;
    get('kr-restschuld').textContent = formatEuro(restschuld);
}

get('kr-darlehen').addEventListener('input', berechneKreditrate);
get('kr-zins').addEventListener('input', berechneKreditrate);
get('kr-tilgung').addEventListener('input', berechneKreditrate);

get('kr-anwenden').addEventListener('click', () => {
    const monatsRate = parseFloat(get('kr-ergebnis').textContent.replace(/[^\d,-]/g, '').replace(',', '.'));
    get('rate').value = Math.round(monatsRate);
    get('rate-rechner').style.display = 'none';
    updateBerechnungen();
});

// Hauptberechnungsfunktion
function updateBerechnungen() {
    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
    const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
    const eigenkapital = parseFloat(get('eigenkapital').value) || 0;
    const rate = parseFloat(get('rate').value) || 1;
    const zinssatz = parseFloat(get('zins').value) / 100 || 0;
    const tilgungssatz = parseFloat(get('tilgung').value) / 100 || 0;
    const miete = parseFloat(get('miete').value) || 0;
    const nichtumlage = parseFloat(get('nichtumlage').value) || 0;
    const steigerung = parseFloat(get('steigerung').value) || 0;
    const mietsteigerung = parseFloat(get('mietsteigerung').value) || 0;
    const flaeche = parseFloat(get('flaeche').value) || 1;
    const ruecklage = parseFloat(get('ruecklage').value) || 0;
    const leerstand = parseFloat(get('leerstand').value) / 100 || 0;

    const gesamtkosten = kaufpreis + nebenkosten;
    const darlehen = Math.max(0, gesamtkosten - eigenkapital);
    const eigenkapitalQuote = (eigenkapital / gesamtkosten) * 100;
    const quadratmeterpreis = kaufpreis / flaeche;
    
    // Jährliche Beträge
    const mieteJahr = miete * 12;
    const nuJahr = nichtumlage * 12;
    const ruecklageJahr = ruecklage * flaeche;
    const leerstandAbzug = mieteJahr * leerstand;
    
    // Nettoertrag
    const nettoEinnahme = mieteJahr - nuJahr - ruecklageJahr - leerstandAbzug;
    
    // Monatlicher Cashflow
    const cashflow = (nettoEinnahme / 12) - rate;
    
    // Renditeberechnungen
    const brutto = (mieteJahr / gesamtkosten) * 100;
    const netto = (nettoEinnahme / gesamtkosten) * 100;
    
    // Ergebnisse anzeigen
    get('gesamtkosten').textContent = formatEuro(gesamtkosten);
    get('fremdfinanzierung').textContent = formatEuro(darlehen);
    get('eigenkapitalquote').textContent = formatPercent(eigenkapitalQuote);
    get('quadratmeterpreis').textContent = formatEuro(quadratmeterpreis) + " / m²";
    
    get('bruttoRendite').textContent = formatPercent(brutto);
    get('formelBrutto').textContent = 
        `(${formatEuro(mieteJahr)} Jahresmiete ÷ ${formatEuro(gesamtkosten)} Gesamtkosten) × 100`;
    
    get('nettoRendite').textContent = formatPercent(netto);
    get('formelNetto').textContent = 
        `(${formatEuro(mieteJahr)} Jahresmiete - ${formatEuro(nuJahr + ruecklageJahr + leerstandAbzug)} Kosten ÷ ${formatEuro(gesamtkosten)}) × 100`;
    
    get('cashflow').textContent = formatEuro(cashflow) + " / Monat";
    
    // Tilgungsberechnung und Break-Even
    const tilgungsinfo = get('tilgungsinfo');
    const tilgungsformel = get('tilgungsformel');
    const breakEvenBox = get('breakEvenBox');
    
    if (darlehen > 0) {
        let rest = darlehen;
        const zinsmonat = zinssatz / 12;
        let monate = 0;
        let gezahlt = 0;
        
        // Amortiationsplan berechnen
        while (rest > 0 && monate < 1200) { // Limit 100 Jahre
            const zinsen = rest * zinsmonat;
            const tilgung = rate - zinsen;
            if (tilgung <= 0) break;
            rest -= tilgung;
            gezahlt += rate;
            monate++;
        }
        
        const jahre = monate / 12;
        const jahrFertig = new Date().getFullYear() + Math.ceil(jahre);
        tilgungsinfo.textContent = `${formatPercent(jahre)} Jahre ≈ ${jahrFertig}`;
        tilgungsformel.textContent = 
            `Berechnet mit ${formatPercent(zinssatz * 100)} Zinsen und anfänglich ${formatPercent(tilgungssatz * 100)} Tilgung pro Jahr`;
        
        const kapitaldienst = gezahlt;
        const breakEvenJahre = kapitaldienst / nettoEinnahme;
        const breakEvenJahr = new Date().getFullYear() + Math.ceil(breakEvenJahre);
        
        if (nettoEinnahme <= 0) {
            breakEvenBox.textContent = "⚠️ Kein Break-even möglich: Negative Nettomieteinnahmen";
        } else {
            breakEvenBox.textContent = `${formatPercent(breakEvenJahre)} Jahre ≈ ${breakEvenJahr}`;
        }
    } else {
        // Ohne Finanzierung
        const breakEvenJahre = gesamtkosten / nettoEinnahme;
        const breakEvenJahr = new Date().getFullYear() + Math.ceil(breakEvenJahre);
        tilgungsinfo.textContent = "∞ Jahren (keine Finanzierung)";
        tilgungsformel.textContent = "Keine Finanzierung gewählt";
        
        if (nettoEinnahme <= 0) {
            breakEvenBox.textContent = "⚠️ Kein Break-even möglich: Negative Nettomieteinnahmen";
        } else {
            breakEvenBox.textContent = `${formatPercent(breakEvenJahre)} Jahre ≈ ${breakEvenJahr}`;
        }
    }
    
    // Wertentwicklung berechnen
    const faktor = Math.pow(1 + steigerung / 100, 10);
    const zukunftswert = kaufpreis * faktor;
    get('wertentwicklung').textContent = formatEuro(zukunftswert);
    get('wertverhaeltnis').textContent = 
        `+${formatEuro(zukunftswert - kaufpreis)} (${((faktor - 1) * 100).toFixed(1)}% in 10 Jahren)`;
}

// Erweiterte Analyse-Funktionen
get('calculate-advanced').addEventListener('click', () => {
    berechneWirtschaftlichkeit();
    zeichneCashflowDiagramm();
    zeichneKapitalentwicklungDiagramm();
});

function berechneWirtschaftlichkeit() {
    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
    const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
    const eigenkapital = parseFloat(get('eigenkapital').value) || 0;
    const rate = parseFloat(get('rate').value) || 0;
    const zinssatz = parseFloat(get('zins').value) / 100 || 0;
    const miete = parseFloat(get('miete').value) || 0;
    const nichtumlage = parseFloat(get('nichtumlage').value) || 0;
    const steigerung = parseFloat(get('steigerung').value) / 100 || 0;
    const mietsteigerung = parseFloat(get('mietsteigerung').value) / 100 || 0;
    const berechnungszeitraum = parseInt(get('berechnungszeitraum').value) || 20;
    const inflation = parseFloat(get('inflation').value) / 100 || 0.02;
    const anschlusszins = parseFloat(get('anschlussfinanzierung').value) / 100 || 0.04;
    const laufzeit = parseFloat(get('laufzeit').value) || 10;
    
    const gesamtkosten = kaufpreis + nebenkosten;
    const darlehen = Math.max(0, gesamtkosten - eigenkapital);
    
    // Berechnung von ROI, IRR und Kapitalrenditen über den Berechnungszeitraum
    let cashflows = [];
    let kumulierterUeberschuss = -eigenkapital; // Anfängliches Investment (negativ)
    const monatlicheRate = rate;
    
    let aktuellesMietniveau = miete;
    let aktuellerImmobilienwert = kaufpreis;
    let restDarlehen = darlehen;
    let aktuelleZinsbindung = true;
    
    // Für jeden Zeitpunkt (Jahr) berechnen
    for (let jahr = 1; jahr <= berechnungszeitraum; jahr++) {
        // Wertsteigerung
        aktuellerImmobilienwert *= (1 + steigerung);
        
        // Mietsteigerung
        aktuellesMietniveau *= (1 + mietsteigerung);
        const jahresmiete = aktuellesMietniveau * 12;
        
        // Inflationsanpassung für nicht umlagefähige Kosten
        const inflationsfaktor = Math.pow(1 + inflation, jahr);
        const jahresNebenkosten = nichtumlage * 12 * inflationsfaktor;
        
        // Nettoeinnahmen
        const nettoMieteinnahme = jahresmiete - jahresNebenkosten;
        
        // Zinsbindung prüfen und ggf. Rate anpassen
        if (aktuelleZinsbindung && jahr > laufzeit) {
            // Zinsbindung endet, neue Rate mit Anschlusszins berechnen
            let neueTilgungsrate = 0;
            
            // Tilgungsanteil berechnen
            if (restDarlehen > 0) {
                // Restlaufzeit berechnen (angenommen 30 Jahre Gesamtlaufzeit)
                const restlaufzeitJahre = 30 - laufzeit;
                // Standardmäßigen Tilgungssatz fortführen oder anpassen
                const tilgungssatz = parseFloat(get('tilgung').value) / 100 || 0.02;
                neueTilgungsrate = (anschlusszins + tilgungssatz) * restDarlehen / 12;
            }
            
            aktuelleZinsbindung = false;
        }
        
        // Cashflow
        const jahreszahlungen = monatlicheRate * 12;
        const jahresCashflow = nettoMieteinnahme - jahreszahlungen;
        
        // Restdarlehen aktualisieren
        if (restDarlehen > 0) {
            const jahreszinsen = restDarlehen * (aktuelleZinsbindung ? zinssatz : anschlusszins);
            const jahrTilgung = Math.min(jahreszahlungen - jahreszinsen, restDarlehen);
            restDarlehen -= jahrTilgung;
        }
        
        // Kumulierten Überschuss berechnen
        kumulierterUeberschuss += jahresCashflow;
        
        // Cashflow-Array für IRR-Berechnung
        cashflows.push(jahresCashflow);
    }
    
    // Gesamtkapitalrendite (ohne Berücksichtigung der Zeit)
    const gesamtkapitalrendite = (kumulierterUeberschuss + aktuellerImmobilienwert - kaufpreis) / gesamtkosten * 100;
    
    // Eigenkapitalrendite
    const eigenkapitalrendite = (kumulierterUeberschuss + aktuellerImmobilienwert - kaufpreis) / eigenkapital * 100;
    
    // Return on Investment (ROI)
    const roi = (kumulierterUeberschuss / eigenkapital) * 100;
    
    // IRR-Schätzung (vereinfacht)
    let irr = 0;
    try {
        irr = schaetzeIRR([-eigenkapital, ...cashflows], 0.05) * 100;
    } catch (e) {
        irr = 0;
    }
    
    // Ergebnisse anzeigen
    get('roi-result').textContent = formatPercent(roi);
    get('irr-result').textContent = formatPercent(irr);
    get('gesamtkapitalrendite-result').textContent = formatPercent(gesamtkapitalrendite);
    get('eigenkapitalrendite-result').textContent = formatPercent(eigenkapitalrendite);
}

// Hilfsfunktion zur IRR-Schätzung
function schaetzeIRR(cashflows, vermutung = 0.1, maxIterationen = 100, genauigkeit = 0.0001) {
    let rate = vermutung;
    let iteration = 0;
    
    while (iteration < maxIterationen) {
        let npv = 0;
        let derivat = 0;
        
        for (let i = 0; i < cashflows.length; i++) {
            npv += cashflows[i] / Math.pow(1 + rate, i);
            derivat -= i * cashflows[i] / Math.pow(1 + rate, i + 1);
        }
        
        if (Math.abs(npv) < genauigkeit) {
            return rate;
        }
        
        // Newton-Raphson-Schritt
        rate = rate - npv / derivat;
        
        if (rate < -0.999) {
            return 0; // IRR nicht berechenbar
        }
        
        iteration++;
    }
    
    return rate;
}

// Diagramme zeichnen
function zeichneCashflowDiagramm() {
    const ctx = get('cashflow-chart').getContext('2d');
    const berechnungszeitraum = parseInt(get('berechnungszeitraum').value) || 20;
    const miete = parseFloat(get('miete').value) || 0;
    const nichtumlage = parseFloat(get('nichtumlage').value) || 0;
    const rate = parseFloat(get('rate').value) || 0;
    const mietsteigerung = parseFloat(get('mietsteigerung').value) / 100 || 0;
    const inflation = parseFloat(get('inflation').value) / 100 || 0.02;
    
    // Cashflow pro Jahr berechnen
    let labels = [];
    let einnahmenData = [];
    let ausgabenData = [];
    let cashflowData = [];
    
    let aktuellesMietniveau = miete;
    
    for (let jahr = 1; jahr <= berechnungszeitraum; jahr++) {
        labels.push('Jahr ' + jahr);
        
        // Mietsteigerung
        aktuellesMietniveau *= (1 + mietsteigerung);
        const jahresmiete = aktuellesMietniveau * 12;
        
        // Inflationsanpassung für nicht umlagefähige Kosten
        const inflationsfaktor = Math.pow(1 + inflation, jahr);
        const jahresNebenkosten = nichtumlage * 12 * inflationsfaktor;
        
        // Jährliche Kreditrate
        const jahresRate = rate * 12;
        
        // Daten speichern
        einnahmenData.push(jahresmiete);
        ausgabenData.push(jahresNebenkosten + jahresRate);
        cashflowData.push(jahresmiete - jahresNebenkosten - jahresRate);
    }
    
    // Chart.js Diagramm
    if (window.cashflowChart) {
        window.cashflowChart.destroy();
    }
    
    window.cashflowChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Einnahmen (€)',
                    data: einnahmenData,
                    backgroundColor: 'rgba(40, 199, 111, 0.5)',
                    borderColor: 'rgba(40, 199, 111, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Ausgaben (€)',
                    data: ausgabenData,
                    backgroundColor: 'rgba(234, 84, 85, 0.5)',
                    borderColor: 'rgba(234, 84, 85, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Cashflow (€)',
                    data: cashflowData,
                    backgroundColor: 'rgba(58, 119, 255, 0.5)',
                    borderColor: 'rgba(58, 119, 255, 1)',
                    type: 'line',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('de-DE') + ' €';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function zeichneKapitalentwicklungDiagramm() {
    const ctx = get('kapital-chart').getContext('2d');
    const berechnungszeitraum = parseInt(get('berechnungszeitraum').value) || 20;
    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
    const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
    const eigenkapital = parseFloat(get('eigenkapital').value) || 0;
    const steigerung = parseFloat(get('steigerung').value) / 100 || 0;
    const darlehen = Math.max(0, (kaufpreis + nebenkosten) - eigenkapital);
    const zinssatz = parseFloat(get('zins').value) / 100 || 0;
    const tilgungssatz = parseFloat(get('tilgung').value) / 100 || 0;
    const anschlusszins = parseFloat(get('anschlussfinanzierung').value) / 100 || 0.04;
    const laufzeit = parseFloat(get('laufzeit').value) || 10;
    const rate = parseFloat(get('rate').value) || 0;
    
    // Kapitalentwicklung berechnen
    let labels = ['Start'];
    let immobilienwerteData = [kaufpreis];
    let darlehenData = [darlehen];
    let eigenkapitalData = [eigenkapital];
    
    let aktuellerImmobilienwert = kaufpreis;
    let restDarlehen = darlehen;
    let aktuelleZinsbindung = true;
    let aktuelleRate = rate;
    
    for (let jahr = 1; jahr <= berechnungszeitraum; jahr++) {
        labels.push('Jahr ' + jahr);
        
        // Wertsteigerung
        aktuellerImmobilienwert *= (1 + steigerung);
        
        // Zinsbindung prüfen und ggf. Rate anpassen
        if (aktuelleZinsbindung && jahr > laufzeit) {
            // Zinsbindung endet, neue Rate mit Anschlusszins berechnen
            if (restDarlehen > 0) {
                // Restlaufzeit (angenommen 30 Jahre Gesamtlaufzeit)
                const restlaufzeitJahre = 30 - laufzeit;
                // Rate neu berechnen mit Anschlusszins
                aktuelleRate = (restDarlehen * (anschlusszins + tilgungssatz)) / 12;
            }
            aktuelleZinsbindung = false;
        }
        
        // Restdarlehen aktualisieren
        if (restDarlehen > 0) {
            const jahreszinsen = restDarlehen * (aktuelleZinsbindung ? zinssatz : anschlusszins);
            const jahreszahlungen = aktuelleRate * 12;
            const jahrTilgung = Math.min(jahreszahlungen - jahreszinsen, restDarlehen);
            restDarlehen -= jahrTilgung;
            
            if (restDarlehen < 0) restDarlehen = 0;
        }
        
        // Aktuelles Eigenkapital (Immobilienwert - Restdarlehen)
        const aktuellesEigenkapital = aktuellerImmobilienwert - restDarlehen;
        
        // Daten speichern
        immobilienwerteData.push(aktuellerImmobilienwert);
        darlehenData.push(restDarlehen);
        eigenkapitalData.push(aktuellesEigenkapital);
    }
    
    // Chart.js Diagramm
    if (window.kapitalChart) {
        window.kapitalChart.destroy();
    }
    
    window.kapitalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Immobilienwert (€)',
                    data: immobilienwerteData,
                    backgroundColor: 'rgba(115, 103, 240, 0.2)',
                    borderColor: 'rgba(115, 103, 240, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Restdarlehen (€)',
                    data: darlehenData,
                    backgroundColor: 'rgba(234, 84, 85, 0.2)',
                    borderColor: 'rgba(234, 84, 85, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Eigenkapital (€)',
                    data: eigenkapitalData,
                    backgroundColor: 'rgba(40, 199, 111, 0.2)',
                    borderColor: 'rgba(40, 199, 111, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('de-DE') + ' €';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.raw);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Objektvergleich-Funktionen
let objektvergleich = [];

get('add-object').addEventListener('click', () => {
    if (objektvergleich.length >= 3) {
        alert('Es können maximal 3 Objekte verglichen werden.');
        return;
    }
    
    // Aktuelles Objekt speichern
    const objekt = {
        name: `Objekt ${objektvergleich.length + 1}`,
        kaufpreis: parseFloat(get('kaufpreis').value) || 0,
        nebenkosten: parseFloat(get('nebenkosten').value) || 0,
        eigenkapital: parseFloat(get('eigenkapital').value) || 0,
        flaeche: parseFloat(get('flaeche').value) || 1,
        miete: parseFloat(get('miete').value) || 0,
        bruttorendite: parseFloat(get('bruttoRendite').textContent),
        nettorendite: parseFloat(get('nettoRendite').textContent),
        cashflow: parseFloat(get('cashflow').textContent.replace(/[^\d,-]/g, '').replace(',', '.'))
    };
    
    objektvergleich.push(objekt);
    updateVergleichsTabelle();
});

get('reset-comparison').addEventListener('click', () => {
    objektvergleich = [];
    updateVergleichsTabelle();
});

function updateVergleichsTabelle() {
    const container = get('comparison-container');
    
    if (objektvergleich.length === 0) {
        container.innerHTML = '<div class="comparison-message">Klicken Sie auf "Objekt hinzufügen", um aktuelle Berechnungsdaten als Vergleichsobjekt zu speichern</div>';
        return;
    }
    
    let html = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Kennzahl</th>
                    ${objektvergleich.map((obj, index) => `
                        <th>
                            <div class="objekt-name">
                                <input type="text" value="${obj.name}" class="objekt-name-input" data-index="${index}">
                            </div>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Kaufpreis</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.kaufpreis)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Gesamtkosten</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.kaufpreis + obj.nebenkosten)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Wohnfläche</td>
                    ${objektvergleich.map(obj => `<td>${obj.flaeche} m²</td>`).join('')}
                </tr>
                <tr>
                    <td>Quadratmeterpreis</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.kaufpreis / obj.flaeche)} / m²</td>`).join('')}
                </tr>
                <tr>
                    <td>Monatliche Miete</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.miete)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Kaltmiete pro m²</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.miete / obj.flaeche)} / m²</td>`).join('')}
                </tr>
                <tr>
                    <td>Bruttorendite</td>
                    ${objektvergleich.map(obj => `<td>${formatPercent(obj.bruttorendite)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Nettorendite</td>
                    ${objektvergleich.map(obj => `<td>${formatPercent(obj.nettorendite)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Cash-Flow</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.cashflow)} / Monat</td>`).join('')}
                </tr>
                <tr>
                    <td>Eigenkapitaleinsatz</td>
                    ${objektvergleich.map(obj => `<td>${formatEuro(obj.eigenkapital)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Eigenkapitalquote</td>
                    ${objektvergleich.map(obj => {
                        const quote = (obj.eigenkapital / (obj.kaufpreis + obj.nebenkosten)) * 100;
                        return `<td>${formatPercent(quote)}</td>`;
                    }).join('')}
                </tr>
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    
    // Event Listener für Objektnamen-Änderung
    document.querySelectorAll('.objekt-name-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            objektvergleich[index].name = e.target.value;
        });
    });
}

// Finanzierungsart Toggle-Funktion
function toggleFinanzierungsart() {
    const isFremdfinanzierung = get('finanzierungsart').checked;
    const finanzierungsInputs = document.querySelectorAll('.finanzierung-inputs input, .finanzierung-inputs button');

    // Felder für Fremdfinanzierung aktivieren/deaktivieren
    finanzierungsInputs.forEach(input => {
        input.disabled = !isFremdfinanzierung;
    });

    // Eigenkapital-Feld verhalten
    if (!isFremdfinanzierung) {
        // Bei Eigenkapitalfinanzierung: Gesamtkosten berechnen und als Eigenkapital setzen
        const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
        const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
        const gesamtkosten = kaufpreis + nebenkosten;

        // Eigenkapital auf Gesamtkosten setzen
        get('eigenkapital').value = gesamtkosten;

        // Kreditrate auf 0 setzen
        get('rate').value = 0;
    }

    // Berechnung aktualisieren
    updateBerechnungen();
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    // Initialen Zustand der Finanzierungsart setzen
    toggleFinanzierungsart();

    // Event-Listener für Finanzierungsart-Toggle
    get('finanzierungsart').addEventListener('change', toggleFinanzierungsart);

    // Event-Listener für alle Input-Felder
    const inputIds = [
        'kaufpreis', 'nebenkosten', 'flaeche',
        'eigenkapital', 'zins', 'tilgung', 'laufzeit', 'rate',
        'miete', 'nichtumlage', 'ruecklage', 'leerstand',
        'steigerung', 'mietsteigerung'
    ];

    inputIds.forEach(id => {
        get(id).addEventListener('input', function() {
            // Spezialbehandlung für Kaufpreis und Nebenkosten bei Eigenkapitalfinanzierung
            if (!get('finanzierungsart').checked) {
                if (id === 'kaufpreis' || id === 'nebenkosten') {
                    // Bei Änderung von Kaufpreis oder Nebenkosten automatisch Eigenkapital anpassen
                    const kaufpreis = parseFloat(get('kaufpreis').value) || 0;
                    const nebenkosten = parseFloat(get('nebenkosten').value) || 0;
                    get('eigenkapital').value = kaufpreis + nebenkosten;
                }
            }
            updateBerechnungen();
        });
    });
});