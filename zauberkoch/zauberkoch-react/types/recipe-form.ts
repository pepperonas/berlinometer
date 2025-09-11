// TypeScript Interfaces für das moderne Rezept-Generator Interface

export type DietType = 'omnivore' | 'vegetarian' | 'vegan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type CuisineType = 
  | 'german' 
  | 'italian' 
  | 'asian' 
  | 'mexican' 
  | 'mediterranean' 
  | 'oriental' 
  | 'french' 
  | 'american' 
  | 'indian'
  | 'any';

export type GoalType = 
  | 'weight_loss'      // Abnehmen
  | 'weight_gain'      // Zunehmen  
  | 'muscle_building'  // Muskelaufbau
  | 'healthy_eating'   // Gesunde Ernährung
  | 'no_goal';         // Kein spezielles Ziel

export interface RecipeFormData {
  // Ernährungstyp
  dietType: DietType;
  
  // Ziele (Mehrfachauswahl möglich)
  goals: GoalType[];
  
  // Ausgeschlossene Zutaten
  excludedIngredients: string[];
  
  // Slider-Werte
  variety: number;        // Zutatenvielfalt (1-5: Minimal bis Sehr abwechslungsreich)
  cookingTime: number;    // Zubereitungszeit (5-60 Minuten)
  cost: number;           // Kosten (1-5: Sehr günstig bis Premium)
  servings: number;       // Portionen (1-8)
  
  // Wünsche als Tags
  wishes: string[];
  
  // Länderküche
  cuisine: CuisineType;
  
  // Mahlzeitentyp
  mealType: MealType;
  
  // KI-Provider (aus bestehendem System)
  aiProvider: 'openai' | 'deepseek' | 'grok';
}

// Optionen für Radiobuttons/Dropdowns
export interface DietOption {
  value: DietType;
  label: string;
  icon: string;
  description: string;
}

export interface GoalOption {
  value: GoalType;
  label: string;
  icon: string;
  description: string;
}

export interface MealOption {
  value: MealType;
  label: string;
  icon: string;
  description: string;
}

export interface CuisineOption {
  value: CuisineType;
  label: string;
  icon: string;
}

// Slider-Konfiguration
export interface SliderConfig {
  id: keyof Pick<RecipeFormData, 'variety' | 'cookingTime' | 'cost' | 'servings'>;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue: (value: number) => string;
  minLabel: string;
  maxLabel: string;
}

// Form-Validierung
export interface FormErrors {
  dietType?: string;
  goals?: string;
  excludedIngredients?: string;
  variety?: string;
  cookingTime?: string;
  cost?: string;
  servings?: string;
  wishes?: string;
  cuisine?: string;
  mealType?: string;
  aiProvider?: string;
}

// Default-Werte
export const DEFAULT_FORM_DATA: RecipeFormData = {
  dietType: 'omnivore',
  goals: ['no_goal'],
  excludedIngredients: [],
  variety: 3,
  cookingTime: 30,
  cost: 3,
  servings: 2,
  wishes: [],
  cuisine: 'any',
  mealType: 'dinner',
  aiProvider: 'openai',
};

// Konstanten für UI-Optionen
export const DIET_OPTIONS: DietOption[] = [
  {
    value: 'omnivore',
    label: 'Allesesser',
    icon: '🍖',
    description: 'Alle Zutaten sind erlaubt'
  },
  {
    value: 'vegetarian',
    label: 'Vegetarisch',
    icon: '🥦',
    description: 'Ohne Fleisch und Fisch'
  },
  {
    value: 'vegan',
    label: 'Vegan',
    icon: '🌱',
    description: 'Rein pflanzlich'
  }
];

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'no_goal',
    label: 'Kein spezielles Ziel',
    icon: '🍽️',
    description: 'Einfach nur lecker essen'
  },
  {
    value: 'weight_loss',
    label: 'Abnehmen',
    icon: '⚖️',
    description: 'Kalorienreduzierte Rezepte'
  },
  {
    value: 'weight_gain',
    label: 'Zunehmen',
    icon: '💪',
    description: 'Kalorienreiche Rezepte'
  },
  {
    value: 'muscle_building',
    label: 'Muskelaufbau',
    icon: '🏋️',
    description: 'Proteinreiche Rezepte'
  },
  {
    value: 'healthy_eating',
    label: 'Gesunde Ernährung',
    icon: '🍎',
    description: 'Ausgewogene, nährstoffreiche Rezepte'
  }
];

export const MEAL_OPTIONS: MealOption[] = [
  {
    value: 'breakfast',
    label: 'Frühstück',
    icon: '☀️',
    description: 'Perfekt für den Start in den Tag'
  },
  {
    value: 'lunch',
    label: 'Mittagessen',
    icon: '🌞',
    description: 'Sättigende Hauptmahlzeit'
  },
  {
    value: 'dinner',
    label: 'Abendessen',
    icon: '🌙',
    description: 'Entspanntes Dinner am Abend'
  },
  {
    value: 'snack',
    label: 'Snack',
    icon: '🍪',
    description: 'Kleine Zwischenmahlzeit'
  }
];

export const CUISINE_OPTIONS: CuisineOption[] = [
  { value: 'any', label: 'Beliebig', icon: '🌍' },
  { value: 'german', label: 'Deutsch', icon: '🥨' },
  { value: 'italian', label: 'Italienisch', icon: '🍝' },
  { value: 'asian', label: 'Asiatisch', icon: '🍜' },
  { value: 'mexican', label: 'Mexikanisch', icon: '🌮' },
  { value: 'mediterranean', label: 'Mediterran', icon: '🫒' },
  { value: 'oriental', label: 'Orientalisch', icon: '🧿' },
  { value: 'french', label: 'Französisch', icon: '🥖' },
  { value: 'american', label: 'Amerikanisch', icon: '🍔' },
  { value: 'indian', label: 'Indisch', icon: '🍛' }
];

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    id: 'variety',
    label: 'Zutatenvielfalt',
    icon: '🎯',
    min: 1,
    max: 5,
    step: 1,
    formatValue: (value) => {
      const labels = ['Minimal', 'Einfach', 'Mittel', 'Vielfältig', 'Sehr abwechslungsreich'];
      return labels[value - 1] || 'Unbekannt';
    },
    minLabel: 'Minimal',
    maxLabel: 'Sehr abwechslungsreich'
  },
  {
    id: 'cookingTime',
    label: 'Zubereitungszeit',
    icon: '⏱️',
    min: 5,
    max: 60,
    step: 5,
    unit: 'Min.',
    formatValue: (value) => `${value} Min.`,
    minLabel: '5 Min.',
    maxLabel: '60 Min.'
  },
  {
    id: 'cost',
    label: 'Kosten',
    icon: '💰',
    min: 1,
    max: 5,
    step: 1,
    formatValue: (value) => {
      const labels = ['Sehr günstig', 'Günstig', 'Mittel', 'Gehobene', 'Premium'];
      return labels[value - 1] || 'Unbekannt';
    },
    minLabel: 'Sehr günstig',
    maxLabel: 'Premium'
  },
  {
    id: 'servings',
    label: 'Portionen',
    icon: '👥',
    min: 1,
    max: 8,
    step: 1,
    unit: 'Portionen',
    formatValue: (value) => `${value} ${value === 1 ? 'Portion' : 'Portionen'}`,
    minLabel: '1',
    maxLabel: '8'
  }
];