import { Metadata } from 'next';
import RecipeListView from '@/components/recipe/RecipeListView';

export const metadata: Metadata = {
  title: 'Meine Rezepte - ZauberKoch',
  description: 'Entdecke und verwalte deine generierten und gespeicherten Rezepte. Durchsuche, bewerte und organisiere deine persönliche Rezeptsammlung.',
};

export default function RecipesPage() {
  return <RecipeListView />;
}