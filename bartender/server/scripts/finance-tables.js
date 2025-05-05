// MongoDB Shell Script für Finanzen-Modul
// Dieses Skript kann direkt in der MongoDB Shell ausgeführt werden
// Führe es mit: mongo bartender finance-tables.js

// Collections für Finanzen erstellen, falls sie nicht existieren
db.createCollection("expenses")
db.createCollection("incomes")

// Prüfen ob die Collections existieren und Datensätze enthalten
const expenseCount = db.expenses.count()
const incomeCount = db.incomes.count()

print(`Collection "expenses" existiert mit ${expenseCount} Dokumenten`)
print(`Collection "incomes" existiert mit ${incomeCount} Dokumenten`)

// Beispieldaten nur hinzufügen, wenn noch keine vorhanden sind
if (expenseCount === 0) {
  print("Füge Beispiel-Ausgaben ein...")
  
  db.expenses.insertMany([
    {
      category: 'rent',
      amount: 1500,
      date: new Date(2023, 10, 1),
      description: 'Monatsmiete November',
      recurring: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'utilities',
      amount: 350,
      date: new Date(2023, 10, 5),
      description: 'Strom und Wasser',
      recurring: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'inventory',
      amount: 750,
      date: new Date(2023, 10, 10),
      description: 'Neue Gläser und Barequipment',
      recurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'salaries',
      amount: 3200,
      date: new Date(2023, 10, 15),
      description: 'Gehälter Personal November',
      recurring: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'marketing',
      amount: 200,
      date: new Date(2023, 10, 20),
      description: 'Social Media Werbung',
      recurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  print(`${db.expenses.count() - expenseCount} Beispiel-Ausgaben erfolgreich erstellt.`)
}

if (incomeCount === 0) {
  print("Füge Beispiel-Einnahmen ein...")
  
  db.incomes.insertMany([
    {
      category: 'bar',
      amount: 2800,
      date: new Date(2023, 10, 30),
      description: 'Bar-Einnahmen November',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'food',
      amount: 1200,
      date: new Date(2023, 10, 30),
      description: 'Essen-Verkäufe November',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'events',
      amount: 800,
      date: new Date(2023, 10, 25),
      description: 'Firmenfeier Schmidt GmbH',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'merchandise',
      amount: 150,
      date: new Date(2023, 10, 28),
      description: 'T-Shirt und Gläser Verkauf',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      category: 'gifts',
      amount: 300,
      date: new Date(2023, 10, 15),
      description: 'Gutschein-Verkäufe',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  print(`${db.incomes.count() - incomeCount} Beispiel-Einnahmen erfolgreich erstellt.`)
}

// Bestätigung anzeigen
print("\nFinanzen-Collections erfolgreich eingerichtet!")
print(`Ausgaben: ${db.expenses.count()} Einträge`)
print(`Einnahmen: ${db.incomes.count()} Einträge`)