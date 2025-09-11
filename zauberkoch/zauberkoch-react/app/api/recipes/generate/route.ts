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

    // Demo mode: allow recipe generation without authentication
    let userId = 'demo-user';
    
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    const body: RecipeRequest = await request.json();
    
    // Smart ingredients handling - generate based on goals if no ingredients provided
    let ingredients = body.ingredients || [];
    if (ingredients.length === 0) {
      // Generate default ingredients based on goals and diet type
      const goalBasedIngredients: { [key: string]: string[] } = {
        'weight-loss': ['Gemüse', 'Salat', 'mageres Protein'],
        'weight-gain': ['Nüsse', 'Vollkornprodukte', 'gesunde Fette'],
        'muscle-building': ['Hähnchenbrust', 'Eier', 'Quinoa'],
        'healthy-eating': ['Vollkornprodukte', 'frisches Gemüse', 'Obst']
      };
      
      // Add ingredients based on selected goals
      if (body.goals && body.goals.length > 0) {
        body.goals.forEach(goal => {
          if (goalBasedIngredients[goal]) {
            ingredients.push(...goalBasedIngredients[goal]);
          }
        });
      }
      
      // Fallback: add universal ingredients if still empty
      if (ingredients.length === 0) {
        ingredients = ['Hauptzutat nach Wahl', 'Gemüse', 'Gewürze'];
      }
      
      // Remove duplicates
      ingredients = [...new Set(ingredients)];
    }

    if (!body.servings || body.servings < 1 || body.servings > 20) {
      return NextResponse.json(
        { message: 'Ungültige Portionsanzahl' },
        { status: 400 }
      );
    }

    // Create demo user object for non-authenticated requests
    const demoUser: User = {
      id: userId,
      email: 'demo@zauberkoch.com',
      name: 'Demo User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let user: User = demoUser;

    // If authenticated, try to get real user data
    if (token) {
      try {
        const collections = await connectToDatabase();
        const dbUser = await collections.users.findOne({ id: userId }) as User | null;
        if (dbUser) {
          user = dbUser;
        }
      } catch (_error) {
        console.log('Database connection failed, using demo user');
      }
    }

    // Update body with generated ingredients
    const updatedBody = { ...body, ingredients };
    
    // Generate recipe using AI (skip rate limiting for demo)
    const recipe = await generateRecipe(updatedBody, user);

    // Try to save generation record (ignore if database fails)
    try {
      if (token) {
        const collections = await connectToDatabase();
        await collections.recipe_generations.insertOne({
          userId: userId,
          createdAt: new Date(),
        });
      }
    } catch (_error) {
      console.log('Failed to save generation record, continuing...');
    }

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
      category: response.category || 'Hauptgericht',
      preparationTime: `${request.cookingTime} Minuten`,
      cookingTime: `${request.cookingTime}`,
      cost: 'Medium',
      difficulty: request.difficulty,
      servings: request.servings,
      instructions: response.instructions || [],
      cookingTips: response.cookingTips || '',
      servingTips: response.servingTips || '',
      ingredients: response.ingredients || [],
      nutritionalInfo: {
        calories: response.nutritionalInfo?.calories || 0,
        protein: response.nutritionalInfo?.protein || 0,
        carbs: response.nutritionalInfo?.carbs || 0,
        fat: response.nutritionalInfo?.fat || 0,
        fiber: response.nutritionalInfo?.fiber || 0
      },
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
  let prompt = `Du bist ein erfahrener Koch und Kochbuch-Autor. Erstelle ein authentisches, köstliches Rezept auf Deutsch mit folgenden Anforderungen:

🥘 VERFÜGBARE HAUPTZUTATEN: ${request.ingredients.join(', ')}
👥 PORTIONEN: ${request.servings}
⏰ ZUBEREITUNGSZEIT: ${request.cookingTime} Minuten
🎯 SCHWIERIGKEIT: ${request.difficulty}`;

  if (request.preferences && request.preferences.length > 0) {
    prompt += `\n🥗 ERNÄHRUNGSVORLIEBEN: ${request.preferences.join(', ')}`;
  }

  if (request.additionalRequests) {
    prompt += `\n📝 ZUSÄTZLICHE WÜNSCHE: ${request.additionalRequests}`;
  }

  prompt += `\n\n🎨 KREATIVE ANWEISUNGEN:
- Erfinde ein originelles, appetitliches Gericht basierend auf den Hauptzutaten
- Ergänze sinnvoll mit Standardzutaten (Gewürze, Öl, etc.)
- Mache das Rezept interessant und lecker, nicht langweilig
- Gib dem Gericht einen ansprechenden, kreativen Namen
- Schreibe eine verlockende Beschreibung, die Lust aufs Kochen macht
- Verwende präzise Mengenangaben und klare Schritte
- Füge Koch-Tipps für beste Ergebnisse hinzu

📋 ANTWORT-FORMAT (Nur gültiges JSON ohne Markdown):
{
  "title": "Kreativer appetitlicher Rezeptname",
  "description": "Verlockende 2-3 Sätze Beschreibung des Gerichts mit Geschmack und Textur",
  "category": "Kategorie (z.B. Hauptgericht, Beilage, Dessert)",
  "cookingTips": "1-2 professionelle Tipps für perfekte Zubereitung",
  "ingredients": [
    {
      "name": "Exakter Zutatname",
      "amount": "Präzise Menge",
      "unit": "g/ml/TL/EL/Stück",
      "preparation": "Vorbereitung (gewürfelt/gehackt/etc.)",
      "category": "Kategorie (Hauptzutat/Gewürz/Basis)"
    }
  ],
  "instructions": [
    "Detaillierter Schritt 1 mit Temperatur/Zeit wo nötig",
    "Detaillierter Schritt 2 mit spezifischen Anleitungen",
    "Weiterer Schritt mit Koch-Techniken und Hinweisen"
  ],
  "nutritionalInfo": {
    "calories": 450,
    "protein": 25,
    "carbs": 30,
    "fat": 15,
    "fiber": 8
  },
  "servingTips": "Empfehlungen zur Präsentation und Beilagen"
}

⚠️ WICHTIGE REGELN:
- Nur gültiges JSON zurückgeben, kein Markdown oder andere Formatierung
- Realistische Nährwerte pro Portion
- Deutsche Bezeichnungen und Maßeinheiten
- Mindestens 5-8 detaillierte Zubereitungsschritte
- Präzise Mengenangaben für ${request.servings} Portionen
- Halte die ${request.cookingTime} Minuten Zubereitungszeit ein`;

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
  } catch (_error) {
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
  } catch (_error) {
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
  } catch (_error) {
    console.error('Failed to parse Grok response:', content);
    throw new Error('Ungültige JSON-Antwort von Grok');
  }
}

function generateRecipeId(): string {
  return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}