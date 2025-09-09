import { Metadata } from 'next';
import NewRecipeForm from '@/components/recipe/NewRecipeForm';

export const metadata: Metadata = {
  title: 'Rezept generieren - ZauberKoch',
  description: 'Generiere personalisierte Rezepte mit künstlicher Intelligenz basierend auf deinen verfügbaren Zutaten und Vorlieben.',
};

export default function RecipeGeneratePage() {
  return <NewRecipeForm />;
}