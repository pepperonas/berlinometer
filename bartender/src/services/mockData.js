/**
 * Mock-Daten für die Entwicklung
 */
import { DRINK_CATEGORIES, EXPENSE_CATEGORIES, MONTHS } from '../utils/constants';

// Getränke-Daten
export const drinks = [
  {
    id: 'drink1',
    name: 'Mojito',
    category: 'cocktails',
    price: 8.50,
    cost: 2.35,
    ingredients: ['Rum', 'Minze', 'Limette', 'Zucker', 'Soda'],
    isActive: true,
    stock: 0,  // Wird frisch zubereitet
    popular: true,
  },
  {
    id: 'drink2',
    name: 'Bier vom Fass',
    category: 'beer',
    price: 3.80,
    cost: 1.20,
    ingredients: ['Bier'],
    isActive: true,
    stock: 48,
    popular: true,
  },
  {
    id: 'drink3',
    name: 'Hauswein Rot',
    category: 'wine',
    price: 4.50,
    cost: 1.80,
    ingredients: ['Rotwein'],
    isActive: true,
    stock: 24,
    popular: true,
  },
  {
    id: 'drink4',
    name: 'Gin Tonic',
    category: 'cocktails',
    price: 7.50,
    cost: 2.10,
    ingredients: ['Gin', 'Tonic Water', 'Limette'],
    isActive: true,
    stock: 0,
    popular: true,
  },
  {
    id: 'drink5',
    name: 'Cola',
    category: 'softDrinks',
    price: 2.80,
    cost: 0.60,
    ingredients: ['Cola'],
    isActive: true,
    stock: 120,
    popular: true,
  },
  {
    id: 'drink6',
    name: 'Whiskey',
    category: 'spirits',
    price: 6.50,
    cost: 2.20,
    ingredients: ['Whiskey'],
    isActive: true,
    stock: 18,
    popular: false,
  },
  {
    id: 'drink7',
    name: 'Aperol Spritz',
    category: 'cocktails',
    price: 6.90,
    cost: 1.90,
    ingredients: ['Aperol', 'Prosecco', 'Soda'],
    isActive: true,
    stock: 0,
    popular: true,
  },
  {
    id: 'drink8',
    name: 'Mineralwasser',
    category: 'softDrinks',
    price: 2.50,
    cost: 0.40,
    ingredients: ['Mineralwasser'],
    isActive: true,
    stock: 150,
    popular: false,
  },
];

// Personal-Daten
export const staff = [
  {
    id: 'staff1',
    name: 'Max Mustermann',
    role: 'bartender',
    hourlyRate: 15.50,
    hoursPerWeek: 30,
    startDate: '2021-05-15',
    phone: '+49 123 456789',
    email: 'max@example.com',
    isActive: true,
  },
  {
    id: 'staff2',
    name: 'Lisa Schmidt',
    role: 'manager',
    hourlyRate: 22.00,
    hoursPerWeek: 40,
    startDate: '2020-02-10',
    phone: '+49 123 456788',
    email: 'lisa@example.com',
    isActive: true,
  },
  {
    id: 'staff3',
    name: 'Tom Müller',
    role: 'waiter',
    hourlyRate: 14.00,
    hoursPerWeek: 25,
    startDate: '2022-01-05',
    phone: '+49 123 456787',
    email: 'tom@example.com',
    isActive: true,
  },
  {
    id: 'staff4',
    name: 'Julia Wagner',
    role: 'bartender',
    hourlyRate: 16.00,
    hoursPerWeek: 35,
    startDate: '2021-11-10',
    phone: '+49 123 456786',
    email: 'julia@example.com',
    isActive: true,
  },
  {
    id: 'staff5',
    name: 'Simon Koch',
    role: 'chef',
    hourlyRate: 18.50,
    hoursPerWeek: 40,
    startDate: '2022-03-01',
    phone: '+49 123 456785',
    email: 'simon@example.com',
    isActive: true,
  },
];

// Finanz-Daten
export const finances = {
  // Ausgaben
  expenses: [
    {
      id: 'exp1',
      category: 'rent',
      amount: 2500.00,
      date: '2023-04-01',
      description: 'Monatsmiete April',
      recurring: true,
    },
    {
      id: 'exp2',
      category: 'utilities',
      amount: 850.00,
      date: '2023-04-05',
      description: 'Strom, Wasser, Heizung',
      recurring: true,
    },
    {
      id: 'exp3',
      category: 'inventory',
      amount: 1200.00,
      date: '2023-04-08',
      description: 'Getränkelieferung',
      recurring: false,
    },
    {
      id: 'exp4',
      category: 'salaries',
      amount: 8500.00,
      date: '2023-04-15',
      description: 'Gehälter April',
      recurring: true,
    },
    {
      id: 'exp5',
      category: 'marketing',
      amount: 350.00,
      date: '2023-04-12',
      description: 'Social Media Werbung',
      recurring: true,
    },
    {
      id: 'exp6',
      category: 'maintenance',
      amount: 180.00,
      date: '2023-04-22',
      description: 'Reparatur Kühlschrank',
      recurring: false,
    },
  ],
  
  // Einnahmen
  income: [
    {
      id: 'inc1',
      category: 'bar',
      amount: 12500.00,
      date: '2023-04-30',
      description: 'Bareinnahmen April',
    },
    {
      id: 'inc2',
      category: 'food',
      amount: 8700.00,
      date: '2023-04-30',
      description: 'Essensverkäufe April',
    },
    {
      id: 'inc3',
      category: 'events',
      amount: 1800.00,
      date: '2023-04-15',
      description: 'Live-Musik Event',
    },
    {
      id: 'inc4',
      category: 'bar',
      amount: 3200.00,
      date: '2023-04-16',
      description: 'Samstagseinnahmen',
    },
  ],
};

// Dashboard-Daten
export const dashboardData = {
  stats: {
    revenue: {
      value: '24.380,00 €',
      trend: 8.5,
      trendDescription: 'vs. letzten Monat',
    },
    profit: {
      value: '10.800,00 €',
      trend: 5.2,
      trendDescription: 'vs. letzten Monat',
    },
    customers: {
      value: '1.450',
      trend: 12.3,
      trendDescription: 'vs. letzten Monat',
    },
    avgOrder: {
      value: '16,80 €',
      trend: -2.1,
      trendDescription: 'vs. letzten Monat',
    },
  },
  
  salesChart: {
    weekly: [
      { name: 'Montag', bar: 580, food: 320, events: 0 },
      { name: 'Dienstag', bar: 520, food: 280, events: 0 },
      { name: 'Mittwoch', bar: 610, food: 350, events: 200 },
      { name: 'Donnerstag', bar: 750, food: 410, events: 0 },
      { name: 'Freitag', bar: 1250, food: 680, events: 0 },
      { name: 'Samstag', bar: 1850, food: 950, events: 450 },
      { name: 'Sonntag', bar: 920, food: 580, events: 0 },
    ],
    monthly: Array.from({ length: 30 }, (_, i) => ({
      name: `${i + 1}`,
      bar: Math.floor(Math.random() * 1500) + 500,
      food: Math.floor(Math.random() * 800) + 300,
      events: i % 7 === 0 ? Math.floor(Math.random() * 500) + 200 : 0,
    })),
    yearly: MONTHS.map(month => ({
      name: month,
      bar: Math.floor(Math.random() * 25000) + 15000,
      food: Math.floor(Math.random() * 15000) + 10000,
      events: Math.floor(Math.random() * 5000) + 1000,
    })),
  },
  
  topSellingDrinks: [
    {
      id: 'drink1',
      name: 'Mojito',
      category: 'Cocktail',
      sales: 345,
      revenue: 2932.5,
    },
    {
      id: 'drink2',
      name: 'Bier vom Fass',
      category: 'Bier',
      sales: 820,
      revenue: 3116,
    },
    {
      id: 'drink7',
      name: 'Aperol Spritz',
      category: 'Cocktail',
      sales: 290,
      revenue: 2001,
    },
    {
      id: 'drink4',
      name: 'Gin Tonic',
      category: 'Cocktail',
      sales: 215,
      revenue: 1612.5,
    },
    {
      id: 'drink5',
      name: 'Cola',
      category: 'Alkoholfrei',
      sales: 410,
      revenue: 1148,
    },
  ],
  
  expensesChart: {
    monthly: EXPENSE_CATEGORIES.map(category => ({
      name: category.name,
      value: Math.floor(Math.random() * 3000) + 500,
      percent: 0, // wird berechnet
    })),
    quarterly: EXPENSE_CATEGORIES.map(category => ({
      name: category.name,
      value: Math.floor(Math.random() * 8000) + 1500,
      percent: 0, // wird berechnet
    })),
    yearly: EXPENSE_CATEGORIES.map(category => ({
      name: category.name,
      value: Math.floor(Math.random() * 30000) + 8000,
      percent: 0, // wird berechnet
    })),
  },
};

// Prozentuale Verteilung für die Ausgaben berechnen
['monthly', 'quarterly', 'yearly'].forEach(period => {
  const total = dashboardData.expensesChart[period].reduce((sum, item) => sum + item.value, 0);
  dashboardData.expensesChart[period].forEach(item => {
    item.percent = item.value / total;
  });
});

// Inventar-Daten
export const inventory = [
  {
    id: 'inv1',
    name: 'Rum',
    category: 'spirits',
    quantity: 25,
    unit: 'Flaschen',
    minQuantity: 5,
    lastOrderDate: '2023-03-15',
    supplier: 'Getränke Schmidt',
  },
  {
    id: 'inv2',
    name: 'Bier Fass',
    category: 'beer',
    quantity: 12,
    unit: 'Fässer',
    minQuantity: 3,
    lastOrderDate: '2023-04-01',
    supplier: 'Brauerei Müller',
  },
  {
    id: 'inv3',
    name: 'Rotwein',
    category: 'wine',
    quantity: 36,
    unit: 'Flaschen',
    minQuantity: 10,
    lastOrderDate: '2023-03-25',
    supplier: 'Weinhandel Meyer',
  },
  {
    id: 'inv4',
    name: 'Gin',
    category: 'spirits',
    quantity: 18,
    unit: 'Flaschen',
    minQuantity: 4,
    lastOrderDate: '2023-03-20',
    supplier: 'Getränke Schmidt',
  },
  {
    id: 'inv5',
    name: 'Cola',
    category: 'softDrinks',
    quantity: 120,
    unit: 'Flaschen',
    minQuantity: 30,
    lastOrderDate: '2023-04-05',
    supplier: 'Großhandel König',
  },
];

// Lieferanten-Daten
export const suppliers = [
  {
    id: 'sup1',
    name: 'Getränke Schmidt',
    contact: 'Michael Schmidt',
    phone: '+49 123 456789',
    email: 'info@getraenke-schmidt.de',
    address: 'Industriestraße 12, 10115 Berlin',
    notes: 'Liefert Dienstag und Freitag',
  },
  {
    id: 'sup2',
    name: 'Brauerei Müller',
    contact: 'Christina Müller',
    phone: '+49 123 456790',
    email: 'bestellung@brauerei-mueller.de',
    address: 'Brauereiweg 5, 20095 Hamburg',
    notes: 'Mindestbestellwert 200€',
  },
  {
    id: 'sup3',
    name: 'Weinhandel Meyer',
    contact: 'Robert Meyer',
    phone: '+49 123 456791',
    email: 'kontakt@weinhandel-meyer.de',
    address: 'Weinbergstr. 8, 50667 Köln',
    notes: 'Spezialangebote jeden 1. des Monats',
  },
  {
    id: 'sup4',
    name: 'Großhandel König',
    contact: 'Sabine König',
    phone: '+49 123 456792',
    email: 'service@grosshandel-koenig.de',
    address: 'Handelsplatz 22, 80331 München',
    notes: 'Liefert auch Samstags (Aufpreis)',
  },
];