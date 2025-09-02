import { MongoClient, Db, Collection } from 'mongodb';
import type { 
  User, 
  Recipe, 
  UserSettings, 
  FoodPreference, 
  ApiLog, 
  Referral,
  SharedRecipe 
} from '@/types';

interface DatabaseCollections {
  users: Collection<User>;
  recipes: Collection<Recipe>;
  userSettings: Collection<UserSettings>;
  foodPreferences: Collection<FoodPreference>;
  apiLogs: Collection<ApiLog>;
  referrals: Collection<Referral>;
  sharedRecipes: Collection<SharedRecipe>;
  passwordResetTokens: Collection<{
    userId: string;
    token: string;
    expiryDate: Date;
    created: Date;
  }>;
  verificationTokens: Collection<{
    userId: string;
    token: string;
    expiryDate: Date;
    created: Date;
  }>;
  bruteForceAttempts: Collection<{
    identifier: string;
    attemptCount: number;
    lastAttempt: Date;
    blockedUntil?: Date;
  }>;
  userSessions: Collection<{
    userId: string;
    sessionId: string;
    refreshToken: string;
    expiresAt: Date;
    created: Date;
    lastUsed: Date;
    userAgent?: string;
    ipAddress?: string;
  }>;
  subscription_intents: Collection<{
    _id?: any;
    paypalSubscriptionId: string;
    userId: string;
    planId: string;
    status: string;
    activatedAt?: Date;
    expirationDate?: Date;
    created: Date;
  }>;
  subscription_logs: Collection<{
    userId: string;
    subscriptionId: string;
    action: string;
    planId: string;
    expirationDate?: Date;
    createdAt: Date;
  }>;
  webhook_logs: Collection<{
    type: string;
    data: any;
    timestamp: Date;
  }>;
  payment_logs: Collection<{
    userId: string;
    type: string;
    amount?: number;
    currency?: string;
    status: string;
    paymentId?: string;
    timestamp: Date;
  }>;
  recipe_generations: Collection<{
    userId: string;
    createdAt: Date;
  }>;
}

class DatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private static instance: DatabaseManager;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<void> {
    if (this.client && this.db) {
      return;
    }

    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zauberkoch';
      
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db('zauberkoch');
      
      console.log('Connected to MongoDB');
      
      // Create indexes
      await this.createIndexes();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollections(): DatabaseCollections {
    const db = this.getDatabase();
    
    return {
      users: db.collection<User>('users'),
      recipes: db.collection<Recipe>('recipes'),
      userSettings: db.collection<UserSettings>('userSettings'),
      foodPreferences: db.collection<FoodPreference>('foodPreferences'),
      apiLogs: db.collection<ApiLog>('apiLogs'),
      referrals: db.collection<Referral>('referrals'),
      sharedRecipes: db.collection<SharedRecipe>('sharedRecipes'),
      passwordResetTokens: db.collection('passwordResetTokens'),
      verificationTokens: db.collection('verificationTokens'),
      bruteForceAttempts: db.collection('bruteForceAttempts'),
      userSessions: db.collection('userSessions'),
      subscription_intents: db.collection('subscription_intents'),
      subscription_logs: db.collection('subscription_logs'),
      webhook_logs: db.collection('webhook_logs'),
      payment_logs: db.collection('payment_logs'),
      recipe_generations: db.collection('recipe_generations'),
    };
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Users collection indexes
      await this.db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
        { key: { referralCode: 1 }, unique: true },
        { key: { premiumExpiration: 1 } },
        { key: { created: 1 } },
        { key: { lastSeen: 1 } },
      ]);

      // Recipes collection indexes
      await this.db.collection('recipes').createIndexes([
        { key: { userId: 1, created: -1 } },
        { key: { userId: 1, isFavorite: 1 } },
        { key: { title: 'text', instructions: 'text' } },
        { key: { created: -1 } },
        { key: { servings: 1 } },
      ]);

      // User settings indexes
      await this.db.collection('userSettings').createIndexes([
        { key: { userId: 1 }, unique: true },
        { key: { updated: 1 } },
      ]);

      // Food preferences indexes
      await this.db.collection('foodPreferences').createIndexes([
        { key: { userId: 1 } },
        { key: { userId: 1, name: 1 }, unique: true },
        { key: { created: 1 } },
      ]);

      // API logs indexes
      await this.db.collection('apiLogs').createIndexes([
        { key: { userId: 1, created: -1 } },
        { key: { apiProvider: 1, created: -1 } },
        { key: { type: 1, created: -1 } },
        { key: { created: -1 } },
        { key: { executionTime: 1 } },
      ]);

      // Referrals indexes
      await this.db.collection('referrals').createIndexes([
        { key: { referralCode: 1 }, unique: true },
        { key: { referrerUserId: 1 } },
        { key: { referredUserId: 1 } },
        { key: { created: 1 } },
      ]);

      // Shared recipes indexes
      await this.db.collection('sharedRecipes').createIndexes([
        { key: { shareCode: 1 }, unique: true },
        { key: { recipeId: 1 } },
        { key: { created: 1 } },
      ]);

      // Token collections indexes
      await this.db.collection('passwordResetTokens').createIndexes([
        { key: { token: 1 }, unique: true },
        { key: { userId: 1 } },
        { key: { expiryDate: 1 }, expireAfterSeconds: 0 },
      ]);

      await this.db.collection('verificationTokens').createIndexes([
        { key: { token: 1 }, unique: true },
        { key: { userId: 1 } },
        { key: { expiryDate: 1 }, expireAfterSeconds: 0 },
      ]);

      // Security indexes
      await this.db.collection('bruteForceAttempts').createIndexes([
        { key: { identifier: 1 } },
        { key: { blockedUntil: 1 }, expireAfterSeconds: 0, sparse: true },
        { key: { lastAttempt: 1 } },
      ]);

      // Sessions indexes
      await this.db.collection('userSessions').createIndexes([
        { key: { userId: 1 } },
        { key: { sessionId: 1 }, unique: true },
        { key: { refreshToken: 1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
        { key: { created: 1 } },
      ]);

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Failed to create database indexes:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    
    try {
      await this.db?.admin().ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  // Connection status
  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }

  // Get connection stats
  async getStats(): Promise<any> {
    try {
      const stats = await this.db?.stats();
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }
}

// Singleton instance
const database = DatabaseManager.getInstance();

// Connection helper
export async function connectToDatabase(): Promise<DatabaseCollections> {
  await database.connect();
  return database.getCollections();
}

// Disconnect helper
export async function disconnectFromDatabase(): Promise<void> {
  await database.disconnect();
}

// Helper functions for common operations
export class UserRepository {
  private collections: DatabaseCollections;

  constructor(collections: DatabaseCollections) {
    this.collections = collections;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.collections.users.findOne({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.collections.users.findOne({ username });
  }

  async findById(id: string): Promise<User | null> {
    return await this.collections.users.findOne({ id });
  }

  async create(user: Omit<User, 'id' | 'created' | 'lastSeen'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: new Date().getTime().toString(),
      created: new Date(),
      lastSeen: new Date(),
    };

    await this.collections.users.insertOne(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<boolean> {
    const result = await this.collections.users.updateOne(
      { id },
      { 
        $set: { 
          ...updates, 
          lastSeen: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.collections.users.updateOne(
      { id },
      { $set: { lastSeen: new Date() } }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.users.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

export class RecipeRepository {
  private collections: DatabaseCollections;

  constructor(collections: DatabaseCollections) {
    this.collections = collections;
  }

  async findByUserId(
    userId: string, 
    options?: { 
      limit?: number; 
      skip?: number; 
      sort?: any;
      filter?: any;
    }
  ): Promise<Recipe[]> {
    const query = { userId, ...options?.filter };
    
    let cursor = this.collections.recipes.find(query);
    
    if (options?.sort) {
      cursor = cursor.sort(options.sort);
    }
    
    if (options?.skip) {
      cursor = cursor.skip(options.skip);
    }
    
    if (options?.limit) {
      cursor = cursor.limit(options.limit);
    }
    
    return await cursor.toArray();
  }

  async findById(id: string): Promise<Recipe | null> {
    return await this.collections.recipes.findOne({ id });
  }

  async create(recipe: Omit<Recipe, 'id' | 'created' | 'updated'>): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: new Date().getTime().toString(),
      created: new Date(),
      updated: new Date(),
    };

    await this.collections.recipes.insertOne(newRecipe);
    return newRecipe;
  }

  async update(id: string, updates: Partial<Recipe>): Promise<boolean> {
    const result = await this.collections.recipes.updateOne(
      { id },
      { 
        $set: { 
          ...updates, 
          updated: new Date() 
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collections.recipes.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<boolean> {
    const result = await this.collections.recipes.updateOne(
      { id },
      { $set: { isFavorite, updated: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async countByUserId(userId: string, filter?: any): Promise<number> {
    const query = { userId, ...filter };
    return await this.collections.recipes.countDocuments(query);
  }

  async search(
    userId: string, 
    searchTerm: string,
    options?: { limit?: number; skip?: number }
  ): Promise<Recipe[]> {
    const query = {
      userId,
      $text: { $search: searchTerm }
    };

    let cursor = this.collections.recipes
      .find(query)
      .sort({ score: { $meta: 'textScore' } });
    
    if (options?.skip) {
      cursor = cursor.skip(options.skip);
    }
    
    if (options?.limit) {
      cursor = cursor.limit(options.limit);
    }
    
    return await cursor.toArray();
  }
}

// Export database instance
export { database };
export default database;