import { Metadata } from 'next';
import SharedRecipeView from '@/components/recipe/SharedRecipeView';

interface SharedRecipePageProps {
  params: { shareCode: string };
}

export async function generateMetadata({ params }: SharedRecipePageProps): Promise<Metadata> {
  try {
    // Fetch recipe data for metadata
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/shared/${params.shareCode}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const { recipe } = await response.json();
      return {
        title: `${recipe.title} - Geteiltes Rezept | ZauberKoch`,
        description: recipe.description || `Entdecke dieses leckere Rezept: ${recipe.title}. Generiert mit ZauberKoch - der KI-gestützten Rezept-App.`,
        openGraph: {
          title: `🍳 ${recipe.title}`,
          description: recipe.description || `Ein leckeres Rezept, geteilt über ZauberKoch`,
          type: 'article',
          images: [
            {
              url: '/favicon.ico',
              width: 512,
              height: 512,
              alt: 'ZauberKoch Logo'
            }
          ]
        },
        twitter: {
          card: 'summary',
          title: `🍳 ${recipe.title}`,
          description: recipe.description || `Ein leckeres Rezept, geteilt über ZauberKoch`,
          images: ['/favicon.ico']
        }
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Geteiltes Rezept - ZauberKoch',
    description: 'Ein leckeres Rezept, geteilt über ZauberKoch - die KI-gestützte Rezept-App.',
  };
}

export default function SharedRecipePage({ params }: SharedRecipePageProps) {
  return <SharedRecipeView shareCode={params.shareCode} />;
}