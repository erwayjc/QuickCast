import { openDB } from 'idb';

interface PodcastInfo {
  hostName: string;
  targetAudience: string;
  description?: string;
}

const DB_NAME = 'quickcast-db';
const PODCAST_INFO_STORE = 'podcast-info';
const DB_VERSION = 1;

// Initialize the IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for podcast info if it doesn't exist
      if (!db.objectStoreNames.contains(PODCAST_INFO_STORE)) {
        db.createObjectStore(PODCAST_INFO_STORE, { keyPath: 'id' });
      }
    },
  });
};

/**
 * Saves podcast information to both the server and local storage
 */
export const savePodcastInfo = async (info: PodcastInfo): Promise<boolean> => {
  try {
    // First try to save to the server
    const response = await fetch('/api/podcast-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(info),
    });

    // If the server request fails, throw an error with the error message
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save podcast information to server');
    }

    // Then save to local IndexedDB
    const db = await initDB();
    await db.put(PODCAST_INFO_STORE, {
      id: 'podcast-info',
      ...info,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error saving podcast info:', error);
    throw error;
  }
};

/**
 * Retrieves podcast information from local storage
 * Falls back to default values if not found
 */
export const getPodcastInfo = async (): Promise<PodcastInfo> => {
  try {
    const db = await initDB();
    const infoData = await db.get(PODCAST_INFO_STORE, 'podcast-info');

    return {
      hostName: infoData?.hostName || '',
      targetAudience: infoData?.targetAudience || '',
      description: infoData?.description || ''
    };
  } catch (error) {
    console.error('Error getting podcast info:', error);
    return { hostName: '', targetAudience: '', description: '' };
  }
};