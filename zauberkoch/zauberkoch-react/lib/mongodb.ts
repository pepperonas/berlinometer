import { MongoClient, Db, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<{ db: Db }> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DATABASE || 'zauberkoch');
    
    // Create indexes if they don't exist
    await createIndexes(db);
    
    console.log('Connected to MongoDB');
    return { db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

async function createIndexes(db: Db) {
  try {
    // Create indexes for recipes collection
    const recipesCollection = db.collection('recipes');
    
    // Create standard indexes
    await createIndexIfNotExists(recipesCollection, { userId: 1, createdAt: -1 });
    await createIndexIfNotExists(recipesCollection, { userId: 1, saved: 1 });
    
    // Handle text index specially due to potential conflicts
    await createTextIndexSafely(recipesCollection);
    
    // Create indexes for users collection
    const usersCollection = db.collection('users');
    await createIndexIfNotExists(usersCollection, { email: 1 }, { unique: true });
    await createIndexIfNotExists(usersCollection, { googleId: 1 }, { sparse: true });
    
    console.log('Database indexes created successfully'); // Force recompilation
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

async function createIndexIfNotExists(collection: any, indexSpec: any, options: any = {}) {
  try {
    const existingIndexes = await collection.indexes();
    const indexKey = JSON.stringify(indexSpec);
    
    const indexExists = existingIndexes.some((index: any) => {
      return JSON.stringify(index.key) === indexKey;
    });
    
    if (!indexExists) {
      await collection.createIndex(indexSpec, options);
    }
  } catch (error) {
    // Ignore index already exists errors
    if ((error as any).code !== 85 && (error as any).code !== 11000) {
      console.warn('Warning creating index:', error);
    }
  }
}

async function createTextIndexSafely(collection: any) {
  try {
    const existingIndexes = await collection.indexes();
    const desiredTextIndex = { title: 'text', description: 'text' };
    
    // Check if we already have the exact text index we want
    const hasCorrectTextIndex = existingIndexes.some((index: any) => {
      return index.key && index.key._fts === 'text' && 
             index.weights && 
             index.weights.title === 1 && 
             index.weights.description === 1;
    });
    
    if (hasCorrectTextIndex) {
      return; // Already have the correct index
    }
    
    // Check for conflicting text indexes
    const conflictingTextIndexes = existingIndexes.filter((index: any) => {
      return index.key && index.key._fts === 'text' && 
             index.weights && 
             (index.weights.instructions || !index.weights.description);
    });
    
    // Drop conflicting indexes first
    for (const conflictingIndex of conflictingTextIndexes) {
      try {
        console.log(`Dropping conflicting text index: ${conflictingIndex.name}`);
        await collection.dropIndex(conflictingIndex.name);
      } catch (dropError) {
        console.warn('Could not drop conflicting index:', dropError);
      }
    }
    
    // Now create the correct text index
    await collection.createIndex(desiredTextIndex);
    console.log('Text search index created successfully');
    
  } catch (error) {
    // If we still get a conflict, just warn and continue
    console.warn('Could not create text search index:', error);
  }
}

export default clientPromise;