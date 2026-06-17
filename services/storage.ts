
import { AppState, StyleProfile } from "../types";

const STORAGE_KEY = 'video_studio_profiles';
const DB_NAME = 'VideoStudioDB';
const DB_STORE = 'project_checkpoint';

// --- LOCAL STORAGE (Small Data: Profiles) ---

export interface SavedProfile {
  id: string;
  savedAt: string;
  profile: StyleProfile;
}

export const saveProfileToLibrary = (profile: StyleProfile): boolean => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: SavedProfile[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Check for duplicates based on source title to avoid spamming
    const title = profile._meta?.sourceTitle || 'Untitled';
    const isDuplicate = existing.some(p => p.profile._meta?.sourceTitle === title);
    
    // Create new entry
    const newEntry: SavedProfile = {
      id: `profile-${Date.now()}`,
      savedAt: new Date().toISOString(),
      profile: profile
    };

    if (isDuplicate) {
       const index = existing.findIndex(p => p.profile._meta?.sourceTitle === title);
       existing[index] = newEntry;
    } else {
       existing.unshift(newEntry);
    }

    if (existing.length > 20) existing.pop();

    // Safety checks for LocalStorage limits
    let newStr = JSON.stringify(existing);
    const SAFETY_LIMIT = 4800000; 

    if (newStr.length > SAFETY_LIMIT) {
        console.warn("Storage quota approaching. Stripping thumbnail from new entry.");
        const indexToModify = isDuplicate ? existing.findIndex(p => p.profile._meta?.sourceTitle === title) : 0;
        if (existing[indexToModify]?.profile?._meta) {
             const copy = { ...existing[indexToModify].profile };
             copy._meta = { ...copy._meta!, sourceThumbnail: '' };
             existing[indexToModify].profile = copy;
        }
        newStr = JSON.stringify(existing);
    }

    if (newStr.length > SAFETY_LIMIT) {
        console.warn("Storage still full. Stripping all thumbnails.");
        existing.forEach(p => { if (p.profile._meta) p.profile._meta.sourceThumbnail = ''; });
        newStr = JSON.stringify(existing);
    }

    if (newStr.length <= SAFETY_LIMIT) {
        localStorage.setItem(STORAGE_KEY, newStr);
        return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to save profile", e);
    return false;
  }
};

export const getSavedProfiles = (): SavedProfile[] => {
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    return str ? JSON.parse(str) : [];
  } catch (e) { return []; }
};

export const deleteSavedProfile = (id: string): SavedProfile[] => {
  try {
    const existing = getSavedProfiles();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) { return []; }
};

// --- INDEXED DB (Large Data: Auto-Save / Checkpoints) ---

// Simple Promise wrapper for IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveProjectCheckpoint = async (state: AppState): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    
    // We save the entire state as a single object with id 'autosave'
    // IndexedDB handles large blobs (images) efficiently.
    const record = {
        id: 'autosave',
        timestamp: Date.now(),
        state: state
    };
    
    store.put(record);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("Auto-save failed:", e);
  }
};

export const loadProjectCheckpoint = async (): Promise<AppState | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.get('autosave');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.state) {
            // Check if autosave is too old (e.g., > 24 hours)? 
            // For now, we trust the user to clear it if they want.
            resolve(result.state);
        } else {
            resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("Load checkpoint failed:", e);
    return null;
  }
};

export const clearProjectCheckpoint = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.delete('autosave');
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error("Clear checkpoint failed:", e);
  }
};
