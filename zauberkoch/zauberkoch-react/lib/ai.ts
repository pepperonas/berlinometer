import { AI_PROVIDERS } from './constants';
import type { Recipe, ApiLog, RecipeGenerationForm } from '@/types';

// AI Provider Types
export type AIProvider = 'openai' | 'deepseek' | 'grok';

export interface AIResponse {
  success: boolean;
  recipe?: Recipe;
  error?: string;
  executionTime: number;
  tokensUsed?: number;
  provider: AIProvider;
}

export interface PromptBuilder {
  type: 'food' | 'cocktail';
  preferences: RecipeGenerationForm;
  language: 'de' | 'en';
  isPremium: boolean;
}

// Recipe JSON structure expected from AI
export interface AIRecipeResponse {
  title: string;
  description?: string;
  preparationTime: string;
  cost: string;
  servings: number;
  ingredients: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  instructions: string;
  tips?: string;
  importantNotes?: string;
  alcoholContent?: string; // for cocktails
}

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateRecipe(
    promptBuilder: PromptBuilder,
    userId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const { preferences, language, isPremium, type } = promptBuilder;
    
    try {
      // Build the prompt
      const prompt = this.buildPrompt(promptBuilder);
      
      // Choose AI provider
      const provider = preferences.api || 'openai';
      
      // Call the appropriate AI service
      let aiResponse: string;
      let tokensUsed = 0;
      
      switch (provider) {
        case 'openai':
          const openaiResult = await this.callOpenAI(prompt);
          aiResponse = openaiResult.response;
          tokensUsed = openaiResult.tokensUsed;
          break;
          
        case 'deepseek':
          const deepseekResult = await this.callDeepSeek(prompt);
          aiResponse = deepseekResult.response;
          tokensUsed = deepseekResult.tokensUsed;
          break;
          
        case 'grok':
          const grokResult = await this.callGrok(prompt);
          aiResponse = grokResult.response;
          tokensUsed = grokResult.tokensUsed;
          break;
          
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
      
      // Parse the AI response into a recipe
      const recipe = await this.parseAIResponse(aiResponse, type, userId);
      
      const executionTime = Date.now() - startTime;
      
      // Log the API call (this would be handled by the calling function)
      // await this.logAPICall(userId, prompt, aiResponse, provider, executionTime, type);
      
      return {
        success: true,
        recipe,
        executionTime,
        tokensUsed,
        provider,
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('AI recipe generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime,
        provider: preferences.api || 'openai',
      };
    }
  }

  private buildPrompt(builder: PromptBuilder): string {
    const { type, preferences, language, isPremium } = builder;
    
    const isGerman = language === 'de';
    
    let prompt = '';
    
    // System instruction
    if (type === 'food') {
      prompt += isGerman 
        ? 'Du bist ein professioneller Koch-Assistent. Erstelle detaillierte, leckere Rezepte basierend auf den gegebenen Parametern.\n\n'
        : 'You are a professional chef assistant. Create detailed, delicious recipes based on the given parameters.\n\n';
    } else {
      prompt += isGerman
        ? 'Du bist ein erfahrener Barkeeper. Erstelle kreative Cocktail-Rezepte basierend auf den gegebenen Parametern.\n\n'
        : 'You are an experienced bartender. Create creative cocktail recipes based on the given parameters.\n\n';
    }

    // Recipe request
    prompt += isGerman
      ? 'Erstelle ein abwechslungsreiches, leckeres Rezept basierend auf den folgenden Parametern:\n\n'
      : 'Create a varied, delicious recipe based on the following parameters:\n\n';

    // Diet type / drink type
    if (type === 'food') {
      prompt += isGerman ? '**Ernährungstyp:** ' : '**Diet Type:** ';
      switch (preferences.dietType) {
        case 'vegetarian':
          prompt += isGerman ? 'Vegetarisch\n' : 'Vegetarian\n';
          break;
        case 'vegan':
          prompt += isGerman ? 'Vegan\n' : 'Vegan\n';
          break;
        case 'keto':
          prompt += isGerman ? 'Ketogen\n' : 'Ketogenic\n';
          break;
        default:
          prompt += isGerman ? 'Alles\n' : 'All foods\n';
      }
    } else {
      prompt += isGerman ? '**Getränketyp:** ' : '**Drink Type:** ';
      switch (preferences.dietType) {
        case 'non_alcoholic':
          prompt += isGerman ? 'Alkoholfrei\n' : 'Non-alcoholic\n';
          break;
        case 'low_alcohol':
          prompt += isGerman ? 'Wenig Alkohol\n' : 'Low alcohol\n';
          break;
        default:
          prompt += isGerman ? 'Mit Alkohol\n' : 'Alcoholic\n';
      }
    }

    // Goal (for food) or style (for cocktails)
    if (preferences.goal) {
      prompt += isGerman ? '**Ziel:** ' : '**Goal:** ';
      switch (preferences.goal) {
        case 'healthy':
          prompt += isGerman ? 'Gesund\n' : 'Healthy\n';
          break;
        case 'weight_loss':
          prompt += isGerman ? 'Gewichtsreduktion\n' : 'Weight loss\n';
          break;
        case 'muscle':
          prompt += isGerman ? 'Muskelaufbau\n' : 'Muscle building\n';
          break;
        case 'comfort':
          prompt += isGerman ? 'Comfort Food\n' : 'Comfort food\n';
          break;
        case 'quick':
          prompt += isGerman ? 'Schnell zubereitet\n' : 'Quick preparation\n';
          break;
      }
    }

    // Region/Style
    if (preferences.region) {
      prompt += isGerman ? '**Region/Stil:** ' : '**Region/Style:** ';
      prompt += preferences.region.charAt(0).toUpperCase() + preferences.region.slice(1) + '\n';
    }

    // Servings
    prompt += isGerman ? '**Portionen:** ' : '**Servings:** ';
    prompt += `${preferences.servings}\n`;

    // Preferences based on sliders
    if (preferences.diversity && preferences.diversity > 3) {
      prompt += isGerman 
        ? '**Besonderheit:** Kreativ und außergewöhnlich\n'
        : '**Special:** Creative and unusual\n';
    }

    if (preferences.duration) {
      if (preferences.duration <= 2) {
        prompt += isGerman 
          ? '**Zubereitungszeit:** Sehr schnell (unter 30 Min)\n'
          : '**Preparation time:** Very quick (under 30 min)\n';
      } else if (preferences.duration >= 4) {
        prompt += isGerman
          ? '**Zubereitungszeit:** Kann länger dauern (über 1h)\n'
          : '**Preparation time:** Can take longer (over 1h)\n';
      }
    }

    if (preferences.cost) {
      if (preferences.cost <= 2) {
        prompt += isGerman
          ? '**Budget:** Günstig\n'
          : '**Budget:** Inexpensive\n';
      } else if (preferences.cost >= 4) {
        prompt += isGerman
          ? '**Budget:** Premium-Zutaten erlaubt\n'
          : '**Budget:** Premium ingredients allowed\n';
      }
    }

    // Premium features
    if (isPremium && preferences.additionalWishes) {
      prompt += isGerman ? '**Zusätzliche Wünsche:** ' : '**Additional wishes:** ';
      prompt += `${preferences.additionalWishes}\n`;
    }

    // Output format instruction
    prompt += '\n';
    prompt += isGerman
      ? 'WICHTIG: Antworte ausschließlich mit einem gültigen JSON-Objekt in folgendem Format:\n'
      : 'IMPORTANT: Respond only with a valid JSON object in the following format:\n';

    const jsonExample = {
      title: isGerman ? "Name des Rezepts" : "Recipe name",
      description: isGerman ? "Kurze Beschreibung" : "Short description",
      preparationTime: "30 Min",
      cost: "€€",
      servings: preferences.servings,
      ingredients: [
        {
          name: isGerman ? "Zutatname" : "Ingredient name",
          quantity: "100",
          unit: "g"
        }
      ],
      instructions: isGerman 
        ? "Schritt-für-Schritt Anleitung..." 
        : "Step-by-step instructions...",
      tips: isGerman 
        ? "Nützliche Tipps..." 
        : "Useful tips...",
      importantNotes: isGerman
        ? "Wichtige Hinweise..."
        : "Important notes..."
    };

    if (type === 'cocktail') {
      (jsonExample as any).alcoholContent = "15%";
    }

    prompt += '\n```json\n' + JSON.stringify(jsonExample, null, 2) + '\n```\n';

    return prompt;
  }

  private async callOpenAI(prompt: string): Promise<{ response: string; tokensUsed: number }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_PROVIDERS.openai.model,
        messages: [
          {
            role: 'system',
            content: AI_PROVIDERS.openai.systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_PROVIDERS.openai.maxTokens,
        temperature: AI_PROVIDERS.openai.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      response: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callDeepSeek(prompt: string): Promise<{ response: string; tokensUsed: number }> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_PROVIDERS.deepseek.model,
        messages: [
          {
            role: 'system',
            content: AI_PROVIDERS.deepseek.systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_PROVIDERS.deepseek.maxTokens,
        temperature: AI_PROVIDERS.deepseek.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      response: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async callGrok(prompt: string): Promise<{ response: string; tokensUsed: number }> {
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      throw new Error('Grok API key not configured');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_PROVIDERS.grok.model,
        messages: [
          {
            role: 'system',
            content: AI_PROVIDERS.grok.systemPrompt,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: AI_PROVIDERS.grok.maxTokens,
        temperature: AI_PROVIDERS.grok.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Grok API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      response: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private async parseAIResponse(
    aiResponse: string, 
    type: 'food' | 'cocktail',
    userId: string
  ): Promise<Recipe> {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonContent = aiResponse.trim();
      
      // Remove markdown code block markers if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/i, '');
      }
      if (jsonContent.endsWith('```')) {
        jsonContent = jsonContent.replace(/\s*```$/, '');
      }
      
      // Try to parse JSON
      const parsedRecipe: AIRecipeResponse = JSON.parse(jsonContent);
      
      // Validate required fields
      if (!parsedRecipe.title || !parsedRecipe.ingredients || !parsedRecipe.instructions) {
        throw new Error('Invalid recipe structure: missing required fields');
      }
      
      // Convert to our Recipe format
      const recipe: Recipe = {
        id: '', // Will be set when saving to database
        userId,
        title: parsedRecipe.title,
        description: parsedRecipe.description,
        preparationTime: parsedRecipe.preparationTime || 'Unknown',
        cost: parsedRecipe.cost || 'Unknown',
        servings: parsedRecipe.servings || 2,
        instructions: parsedRecipe.instructions,
        tips: parsedRecipe.tips,
        importantNotes: parsedRecipe.importantNotes,
        ingredients: parsedRecipe.ingredients.map((ingredient, index) => ({
          id: `ing_${index}`,
          name: ingredient.name,
          quantity: ingredient.quantity || '',
          unit: ingredient.unit || '',
        })),
        isFavorite: false,
        alcoholContent: type === 'cocktail' ? parsedRecipe.alcoholContent : undefined,
        created: new Date(),
        updated: new Date(),
      };
      
      return recipe;
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw AI response:', aiResponse);
      
      throw new Error('Failed to parse recipe from AI response');
    }
  }

  // Rate limiting check
  async checkRateLimit(userId: string, isPremium: boolean): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    // This would typically be implemented with Redis or database
    // For now, returning a simple implementation
    
    const limits = isPremium 
      ? { perDay: 50, perHour: 10 }
      : { perDay: 3, perHour: 3 };
    
    // In a real implementation, you'd check the database/cache here
    // For now, always allowing (implement rate limiting in production)
    return {
      allowed: true,
      remaining: limits.perDay,
    };
  }

  // Get available providers based on user's subscription
  getAvailableProviders(isPremium: boolean): AIProvider[] {
    return isPremium 
      ? ['openai', 'deepseek', 'grok']
      : ['openai']; // Free users only get OpenAI
  }

  // Get provider info
  getProviderInfo(provider: AIProvider) {
    return AI_PROVIDERS[provider];
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
export default aiService;