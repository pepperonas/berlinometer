'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface OfflineSyncData {
  id: string;
  type: 'recipe-save' | 'recipe-rate' | 'recipe-delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingActions: number;
  syncPendingActions: () => Promise<void>;
  queueAction: (type: string, data: any) => Promise<void>;
  clearPendingActions: () => Promise<void>;
}

const DB_NAME = 'zauberkoch-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDatabase();
        setDb(database);
        
        // Count pending actions on startup
        const count = await countPendingActions(database);
        setPendingActions(count);
      } catch (error) {
        console.error('[OfflineSync] Failed to initialize database:', error);
      }
    };

    initDB();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[OfflineSync] Connection restored');
      setIsOnline(true);
      
      // Automatically sync pending actions when coming back online
      if (db && pendingActions > 0) {
        await syncPendingActions();
        toast.success(`${pendingActions} Aktionen synchronisiert! 🔄`);
      }
    };

    const handleOffline = () => {
      console.log('[OfflineSync] Connection lost');
      setIsOnline(false);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [db, pendingActions]);

  const openDatabase = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: false 
          });
          
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  };

  const countPendingActions = (database: IDBDatabase): Promise<number> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const getAllPendingActions = (database: IDBDatabase): Promise<OfflineSyncData[]> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const addPendingAction = (database: IDBDatabase, action: OfflineSyncData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(action);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const removePendingAction = (database: IDBDatabase, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const updatePendingAction = (database: IDBDatabase, action: OfflineSyncData): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(action);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  };

  const queueAction = useCallback(async (type: string, data: any): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const action: OfflineSyncData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    try {
      await addPendingAction(db, action);
      const count = await countPendingActions(db);
      setPendingActions(count);

      console.log('[OfflineSync] Action queued:', action.id);

      // If we're online, try to sync immediately
      if (isOnline) {
        await syncPendingActions();
      } else {
        // Register background sync if available
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register(type);
        }
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to queue action:', error);
      throw error;
    }
  }, [db, isOnline]);

  const syncPendingActions = useCallback(async (): Promise<void> => {
    if (!db || !isOnline) return;

    try {
      const actions = await getAllPendingActions(db);
      
      if (actions.length === 0) {
        setPendingActions(0);
        return;
      }

      console.log(`[OfflineSync] Syncing ${actions.length} pending actions`);

      for (const action of actions) {
        try {
          await syncSingleAction(action);
          await removePendingAction(db, action.id);
          console.log('[OfflineSync] Synced action:', action.id);
        } catch (error) {
          console.error('[OfflineSync] Failed to sync action:', action.id, error);
          
          // Increment retry count
          action.retryCount += 1;
          
          // Remove action if too many retries
          if (action.retryCount >= 3) {
            console.warn('[OfflineSync] Removing action after max retries:', action.id);
            await removePendingAction(db, action.id);
          } else {
            await updatePendingAction(db, action);
          }
        }
      }

      // Update pending count
      const count = await countPendingActions(db);
      setPendingActions(count);

    } catch (error) {
      console.error('[OfflineSync] Failed to sync pending actions:', error);
    }
  }, [db, isOnline]);

  const syncSingleAction = async (action: OfflineSyncData): Promise<void> => {
    switch (action.type) {
      case 'recipe-save':
        await fetch('/api/recipes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });
        break;

      case 'recipe-rate':
        await fetch('/api/recipes/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });
        break;

      case 'recipe-delete':
        await fetch('/api/recipes/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });
        break;

      default:
        console.warn('[OfflineSync] Unknown action type:', action.type);
    }
  };

  const clearPendingActions = useCallback(async (): Promise<void> => {
    if (!db) return;

    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.clear();
      setPendingActions(0);
      console.log('[OfflineSync] Cleared all pending actions');
    } catch (error) {
      console.error('[OfflineSync] Failed to clear pending actions:', error);
    }
  }, [db]);

  return {
    isOnline,
    pendingActions,
    syncPendingActions,
    queueAction,
    clearPendingActions,
  };
}