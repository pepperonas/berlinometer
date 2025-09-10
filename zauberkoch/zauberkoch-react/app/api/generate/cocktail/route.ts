import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { checkUserLimits } from '@/lib/user-limits';
interface CocktailGenerationForm {
  drinkType: 'all' | 'alcoholic' | 'non_alcoholic' | 'low_alcohol';
  style: 'classic' | 'modern' | 'exotic' | 'simple';
  diversity: number;
  complexity: number;
  alcoholContent: number;
  glasses: number;
  isFruity: boolean;
  isDessert: boolean;
  focusPhrase: string;
  api: 'openai' | 'deepseek' | 'grok';
}

const COCKTAIL_PROMPT_TEMPLATE = `Du bist ein professioneller Barkeeper mit jahrelanger Erfahrung. Erstelle ein detailliertes Cocktail-Rezept basierend auf den folgenden Präferenzen:

Drink-Typ: {drinkType}
Stil: {style}
Alkoholgehalt: {alcoholContent}/5
Komplexität: {complexity}/5
Fruchtiger Geschmack: {fruity}
Dessert-Cocktail: {dessert}
Anzahl Gläser: {glasses}
Spezielle Wünsche: {focusPhrase}

Bitte erstelle ein detailliertes Cocktail-Rezept im folgenden JSON-Format:

{
  "name": "Name des Cocktails",
  "description": "Kurze Beschreibung des Cocktails und seines Geschmacks",
  "type": "cocktail",
  "alcoholStrength": "low/medium/high",
  "ingredients": [
    {
      "name": "Zutat",
      "amount": "Menge",
      "unit": "ml/cl/Stück/etc."
    }
  ],
  "instructions": [
    "Schritt 1: Detaillierte Anleitung",
    "Schritt 2: Weitere Schritte..."
  ],
  "glassType": "Glastyp (z.B. Highball, Martini, Old Fashioned)",
  "garnish": "Garnierung",
  "preparationTime": "5-10 Minuten",
  "difficulty": "easy/medium/hard",
  "flavorProfile": ["süß", "sauer", "bitter", "fruchtig", etc.],
  "tips": [
    "Tipp 1: Praktische Zubereitungstipps",
    "Tipp 2: Weitere hilfreiche Hinweise"
  ]
}

Antworte nur mit dem JSON-Objekt, ohne zusätzlichen Text.`;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Check user limits
    const canGenerate = await checkUserLimits(user.userId);
    if (!canGenerate) {
      return NextResponse.json(
        { message: 'Daily limit reached. Upgrade to premium for unlimited cocktails.' },
        { status: 429 }
      );
    }

    const formData: CocktailGenerationForm = await request.json();

    // Generate cocktail using AI
    const drinkTypeMap = {
      'all': 'Alkoholisch oder alkoholfrei',
      'alcoholic': 'Alkoholisch', 
      'non_alcoholic': 'Alkoholfrei',
      'low_alcohol': 'Niedriger Alkoholgehalt'
    };
    
    const styleMap = {
      'classic': 'Klassisch',
      'modern': 'Modern',
      'exotic': 'Exotisch',
      'simple': 'Einfach'
    };
    
    const prompt = COCKTAIL_PROMPT_TEMPLATE
      .replace('{drinkType}', drinkTypeMap[formData.drinkType] || 'Beliebig')
      .replace('{style}', styleMap[formData.style] || 'Beliebig')
      .replace('{alcoholContent}', formData.alcoholContent.toString())
      .replace('{complexity}', formData.complexity.toString())
      .replace('{fruity}', formData.isFruity ? 'Ja' : 'Nein')
      .replace('{dessert}', formData.isDessert ? 'Ja' : 'Nein')
      .replace('{glasses}', formData.glasses.toString())
      .replace('{focusPhrase}', formData.focusPhrase || 'Keine besonderen Wünsche');

    // Select AI API based on user preference
    let apiResponse;
    
    if (formData.api === 'openai') {
      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein professioneller Barkeeper. Antworte immer mit validem JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });
    } else {
      // For now, fallback to OpenAI for other APIs
      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Du bist ein professioneller Barkeeper. Antworte immer mit validem JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });
    }

    if (!apiResponse.ok) {
      throw new Error('AI service unavailable');
    }

    const aiResponse = await apiResponse.json();
    const cocktailText = aiResponse.choices[0]?.message?.content;

    if (!cocktailText) {
      throw new Error('No cocktail generated');
    }

    // Parse AI response
    let cocktail;
    try {
      cocktail = JSON.parse(cocktailText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Save cocktail to database
    const { db } = await connectToDatabase();
    const cocktailRecord = {
      ...cocktail,
      userId: user.userId,
      originalRequest: formData,
      createdAt: new Date(),
      updatedAt: new Date(),
      saved: false,
      rating: 0
    };

    const result = await db.collection('recipes').insertOne(cocktailRecord);
    cocktail.id = result.insertedId.toString();

    // Update user's generation count
    await db.collection('users').updateOne(
      { email: user.email },
      { 
        $inc: { 'dailyGenerations': 1 },
        $set: { 'lastGenerationDate': new Date() }
      }
    );

    return NextResponse.json({ cocktail });
  } catch (error) {
    console.error('Cocktail generation error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}