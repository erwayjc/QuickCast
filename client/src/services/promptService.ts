import { openDB } from 'idb';

interface PromptData {
  sectionId: string;
  promptText: string;
  lastUpdated: string;
}

interface PodcastInfo {
  hostName: string;
  targetAudience: string;
  description?: string;
}

const DB_NAME = 'quickcast-db';
const PROMPT_STORE = 'custom-prompts';
const PODCAST_INFO_STORE = 'podcast-info';
const DB_VERSION = 1;

// Initialize the IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PROMPT_STORE)) {
        db.createObjectStore(PROMPT_STORE, { keyPath: 'sectionId' });
      }
      if (!db.objectStoreNames.contains(PODCAST_INFO_STORE)) {
        db.createObjectStore(PODCAST_INFO_STORE, { keyPath: 'id' });
      }
    },
  });
};

// Save podcast info both to IndexedDB and backend
export const savePodcastInfo = async (info: PodcastInfo): Promise<boolean> => {
  try {
    // Save to backend first
    const response = await fetch('/api/podcast-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(info),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save podcast information');
    }

    // If backend save successful, save to IndexedDB
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

// Get podcast info from IndexedDB
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

// Save a custom prompt for a specific section
export const saveCustomPrompt = async (sectionId: string, promptText: string): Promise<boolean> => {
  try {
    const db = await initDB();
    await db.put(PROMPT_STORE, {
      sectionId,
      promptText,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error saving custom prompt:', error);
    throw new Error('Failed to save custom prompt');
  }
};

// Get a custom prompt for a specific section
export const getCustomPrompt = async (sectionId: string): Promise<string | null> => {
  try {
    const db = await initDB();
    const promptData = await db.get(PROMPT_STORE, sectionId) as PromptData | undefined;

    if (!promptData) {
      return null; // Return null if no custom prompt found
    }

    return promptData.promptText;
  } catch (error) {
    console.error('Error getting custom prompt:', error);
    throw new Error('Failed to retrieve custom prompt');
  }
};

// Delete a custom prompt for a specific section
export const deleteCustomPrompt = async (sectionId: string): Promise<boolean> => {
  try {
    const db = await initDB();
    await db.delete(PROMPT_STORE, sectionId);
    return true;
  } catch (error) {
    console.error('Error deleting custom prompt:', error);
    throw new Error('Failed to delete custom prompt');
  }
};

// Get all custom prompts
export const getAllCustomPrompts = async (): Promise<PromptData[]> => {
  try {
    const db = await initDB();
    return await db.getAll(PROMPT_STORE);
  } catch (error) {
    console.error('Error getting all custom prompts:', error);
    throw new Error('Failed to retrieve custom prompts');
  }
};


// Default prompts for each section
export const getDefaultPrompt = (sectionId: string): string => {
  const defaultPrompts: Record<string, string> = {
    'overview': 'Create a concise overview of this podcast episode where {host} discusses the following transcript:\n\n{transcript}\n\nThis podcast is aimed at {audience}.\n\nKeep it under 200 words and highlight the key points.',

    'transcript': 'Please clean up and format this raw transcript from {host}\'s podcast:\n\n{transcript}\n\nCorrect any obvious errors, remove filler words, and format it for readability.',

    'show-notes': 'Based on this podcast transcript where {host} speaks about:\n\n{transcript}\n\nCreate detailed show notes designed for {audience} with the following:\n- Key points with timestamps\n- Resources mentioned\n- Quotes worth highlighting\n- Action items for listeners',

    'tags': 'Based on this podcast transcript where {host} discusses:\n\n{transcript}\n\nGenerate 10-15 relevant tags/keywords that would help {audience} find this content. The tags should accurately represent the content and help with SEO and discoverability.',

    'titles': 'Based on this podcast transcript where {host} discusses:\n\n{transcript}\n\nGenerate 5 compelling title options for this episode. Titles should be catchy, under 60 characters, and accurately reflect the content for {audience}.',

    'process': 'Based on this podcast transcript where {host} explains:\n\n{transcript}\n\nOutline the key steps or process discussed in this episode in a clear, numbered format that would be useful to {audience}.'
  };

  return defaultPrompts[sectionId] || 'Generate content based on the transcript: {transcript}';
};