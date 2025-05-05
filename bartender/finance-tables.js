// Collection-Skript für Finanzen-Tabellen
// Führen Sie das Skript direkt in Ihrer IDE mit Datenbankzugriff aus

// Expenses-Collection erstellen
db.createCollection("expenses")

// Incomes-Collection erstellen
db.createCollection("incomes")

// Beispiel-Ausgaben einfügen
db.expenses.insertMany([
  {
    category: "rent",
    amount: 2500.00,
    date: new Date("2023-05-01"),
    description: "Monatsmiete Mai 2023",
    recurring: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "utilities",
    amount: 850.00,
    date: new Date("2023-05-05"),
    description: "Strom, Wasser, Heizung Mai 2023",
    recurring: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "inventory",
    amount: 1200.00,
    date: new Date("2023-05-08"),
    description: "Getränkelieferung",
    recurring: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "salaries", 
    amount: 8500.00,
    date: new Date("2023-05-15"),
    description: "Gehälter Mai 2023",
    recurring: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "marketing",
    amount: 350.00,
    date: new Date("2023-05-12"),
    description: "Social Media Werbung",
    recurring: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Beispiel-Einnahmen einfügen
db.incomes.insertMany([
  {
    category: "bar",
    amount: 12500.00,
    date: new Date("2023-05-31"),
    description: "Bareinnahmen Mai 2023",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "food",
    amount: 8700.00,
    date: new Date("2023-05-31"),
    description: "Essensverkäufe Mai 2023",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    category: "events",
    amount: 1800.00,
    date: new Date("2023-05-20"),
    description: "Live-Musik Event",
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// Prüfen, ob die Tabellen erfolgreich erstellt wurden
print("Expenses-Einträge:", db.expenses.countDocuments())
print("Incomes-Einträge:", db.incomes.countDocuments())

print("Finanz-Tabellen erfolgreich eingerichtet!")