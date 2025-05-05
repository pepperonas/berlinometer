/**
 * Konstanten für Bartender App
 */

// Getränkekategorien
export const DRINK_CATEGORIES = [
  { id: 'beer', name: 'Bier' },
  { id: 'wine', name: 'Wein' },
  { id: 'spirits', name: 'Spirituosen' },
  { id: 'cocktails', name: 'Cocktails' },
  { id: 'softDrinks', name: 'Alkoholfreie Getränke' },
];

// Inventarkategorien
export const INVENTORY_CATEGORIES = [
  { id: 'spirits', name: 'Spirituosen' },
  { id: 'wine', name: 'Wein' },
  { id: 'beer', name: 'Bier' },
  { id: 'softDrinks', name: 'Alkoholfrei' },
  { id: 'mixer', name: 'Mixer' },
  { id: 'fruit', name: 'Früchte' },
  { id: 'other', name: 'Sonstiges' },
];

// Inventareinheiten
export const INVENTORY_UNITS = [
  { id: 'Flaschen', name: 'Flaschen' },
  { id: 'Kisten', name: 'Kisten' },
  { id: 'Kästen', name: 'Kästen' },
  { id: 'kg', name: 'Kilogramm' },
  { id: 'liter', name: 'Liter' },
  { id: 'Stück', name: 'Stück' },
  { id: 'other', name: 'Sonstiges' },
];

// Personalrollen
export const STAFF_ROLES = [
  { id: 'bartender', name: 'Barkeeper' },
  { id: 'waiter', name: 'Kellner' },
  { id: 'manager', name: 'Manager' },
  { id: 'chef', name: 'Koch' },
  { id: 'cleaner', name: 'Reinigungskraft' },
];

// Ausgabenkategorien
export const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'Miete' },
  { id: 'utilities', name: 'Nebenkosten' },
  { id: 'inventory', name: 'Inventar' },
  { id: 'salaries', name: 'Gehälter' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'maintenance', name: 'Instandhaltung' },
  { id: 'licenses', name: 'Lizenzen' },
  { id: 'other', name: 'Sonstiges' },
];

// Monate
export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

// Datumsformatierung
export const DATE_FORMAT = 'DD.MM.YYYY';

// Statuscodes
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

// Zahlungsmethoden
export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Bargeld' },
  { id: 'card', name: 'Kartenzahlung' },
  { id: 'mobile', name: 'Mobile Payment' },
  { id: 'invoice', name: 'Rechnung' },
];