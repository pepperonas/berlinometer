import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/database';
import { verifyAccessToken } from '@/lib/auth';
import { AI_PROVIDERS } from '@/lib/constants';
import type { RecipeRequest, Recipe, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    const body: RecipeRequest = await request.json();
    
    // Validate request
    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { message: 'Mindestens eine Zutat ist erforderlich' },
        { status: 400 }
      );
    }

    if (!body.servings || body.servings < 1 || body.servings > 20) {
      return NextResponse.json(
        { message: 'Ungültige Portionsanzahl' },
        { status: 400 }
      );
    }

    const collections = await connectToDatabase();
    
    // Get user data
    const user = await collections.users.findOne({ 
      id: payload.userId 
    }) as User | null;

    if (!user) {
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if user is premium or has remaining free generations
    const isPremium = user.premiumExpiration && new Date(user.premiumExpiration) > new Date();
    
    if (!isPremium) {
      const today = new Date().toISOString().split('T')[0];
      const todaysGenerations = await collections.recipe_generations.countDocuments({
        userId: payload.userId,
        createdAt: {
          $gte: new Date(today),
          $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (todaysGenerations >= 3) {
        return NextResponse.json(
          { 
            message: 'Tageslimit erreicht. Upgrade auf Premium für unbegrenzte Rezepte.',
            code: 'DAILY_LIMIT_REACHED'
          },
          { status: 429 }
        );
      }
    }

    // Generate recipe using AI
    const recipe = await generateRecipe(body, user);

    // Save generation record
    await collections.recipe_generations.insertOne({
      userId: payload.userId,
      createdAt: new Date(),
    });

    return NextResponse.json({
      recipe,
      message: 'Rezept erfolgreich generiert'
    });

  } catch (error) {
    console.error('Recipe generation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { message: 'KI-Service vorübergehend nicht verfügbar. Bitte versuche es in wenigen Minuten erneut.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('quota exceeded')) {
        return NextResponse.json(
          { message: 'KI-Service-Limit erreicht. Bitte versuche es später erneut.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Interner Serverfehler bei der Rezeptgenerierung' },
      { status: 500 }
    );
  }
}

async function generateRecipe(request: RecipeRequest, user: User): Promise<Recipe> {
  const provider = AI_PROVIDERS[request.aiProvider as keyof typeof AI_PROVIDERS] || AI_PROVIDERS.openai;
  
  // Create prompt for AI
  const prompt = createRecipePrompt(request);
  
  try {
    let response: any;
    
    switch (request.aiProvider) {
      case 'openai':
        response = await generateWithOpenAI(prompt);
        break;
      case 'deepseek':
        response = await generateWithDeepSeek(prompt);
        break;
      case 'grok':
        response = await generateWithGrok(prompt);
        break;
      default:
        throw new Error(`Unbekannter AI Provider: ${request.aiProvider}`);
    }

    // Parse and structure the recipe
    const recipe: Recipe = {
      id: generateRecipeId(),
      userId: user.id,
      title: response.title || 'Generiertes Rezept',
      description: response.description || '',
      preparationTime: `${request.cookingTime} minutes`,
      cost: 'Medium',
      servings: request.servings,
      instructions: response.instructions ? response.instructions.join('\n\n') : '',
      ingredients: response.ingredients || [],
      isFavorite: false,
      created: new Date(),
      updated: new Date(),
    };

    return recipe;
    
  } catch (error) {
    console.error(`Error generating recipe with ${request.aiProvider}:`, error);
    throw error;
  }
}

function createRecipePrompt(request: RecipeRequest): string {
  let prompt = `Erstelle ein detailliertes Rezept auf Deutsch mit folgenden Anforderungen:

Verfügbare Zutaten: ${request.ingredients.join(', ')}
Portionen: ${request.servings}
Zubereitungszeit: ${request.cookingTime} Minuten
Schwierigkeit: ${request.difficulty}`;

  if (request.preferences && request.preferences.length > 0) {
    prompt += `\nErnährungsvorlieben: ${request.preferences.join(', ')}`;
  }

  if (request.additionalRequests) {
    prompt += `\nZusätzliche Anforderungen: ${request.additionalRequests}`;
  }

  prompt += `\n\nBitte antworte mit einem JSON-Objekt in folgendem Format:
{
  "title": "Rezeptname",
  "description": "Kurze Beschreibung des Gerichts",
  "ingredients": [
    {
      "name": "Zutatname",
      "amount": "Menge",
      "unit": "Einheit"
    }
  ],
  "instructions": [
    "Schritt 1",
    "Schritt 2",
    ...
  ],
  "nutritionalInfo": {
    "calories": 450,
    "protein": 25,
    "carbs": 30,
    "fat": 15
  }
}

Wichtig:
- Verwende hauptsächlich die angegebenen Zutaten
- Halte die Zubereitungszeit ein
- Berücksichtige die Ernährungsvorlieben
- Gib realistische Nährwerte an
- Schreibe klare, verständliche Anweisungen
- Alle Mengenangaben für die angegebene Portionszahl`;

  return prompt;
}

async function generateWithOpenAI(prompt: string): Promise<any> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API Key nicht konfiguriert');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Koch und Ernährungsexperte. Erstelle kreative und gesunde Rezepte basierend auf den verfügbaren Zutaten.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Leere Antwort von OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Ungültige JSON-Antwort von OpenAI');
  }
}

async function generateWithDeepSeek(prompt: string): Promise<any> {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API Key nicht konfiguriert');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Koch und Ernährungsexperte. Erstelle kreative und gesunde Rezepte basierend auf den verfügbaren Zutaten.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`DeepSeek API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Leere Antwort von DeepSeek');
  }

  try {
    // Extract JSON from response (DeepSeek might return JSON wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Struktur gefunden');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse DeepSeek response:', content);
    throw new Error('Ungültige JSON-Antwort von DeepSeek');
  }
}

async function generateWithGrok(prompt: string): Promise<any> {
  const grokApiKey = process.env.GROK_API_KEY;
  
  if (!grokApiKey) {
    throw new Error('Grok API Key nicht konfiguriert');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${grokApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener Koch und Ernährungsexperte. Erstelle kreative und gesunde Rezepte basierend auf den verfügbaren Zutaten.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Grok API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Leere Antwort von Grok');
  }

  try {
    // Extract JSON from response (Grok might return JSON wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Keine gültige JSON-Struktur gefunden');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse Grok response:', content);
    throw new Error('Ungültige JSON-Antwort von Grok');
  }
}

function generateRecipeId(): string {
  return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}