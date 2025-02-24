import { openDB } from 'idb';

const DB_NAME = 'quickcast-db';
const PROMPT_STORE = 'custom-prompts';
const DB_VERSION = 1;

// Initialize the IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for custom prompts if it doesn't exist
      if (!db.objectStoreNames.contains(PROMPT_STORE)) {
        db.createObjectStore(PROMPT_STORE, { keyPath: 'sectionId' });
      }
    },
  });
};

// Save a custom prompt for a specific section
export const saveCustomPrompt = async (sectionId, promptText) => {
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
export const getCustomPrompt = async (sectionId) => {
  try {
    const db = await initDB();
    const promptData = await db.get(PROMPT_STORE, sectionId);

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
export const deleteCustomPrompt = async (sectionId) => {
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
export const getAllCustomPrompts = async () => {
  try {
    const db = await initDB();
    return await db.getAll(PROMPT_STORE);
  } catch (error) {
    console.error('Error getting all custom prompts:', error);
    throw new Error('Failed to retrieve custom prompts');
  }
};

// Default prompts for each section
export const getDefaultPrompt = (sectionId) => {
  const defaultPrompts = {
    'overview': 'Create a concise overview of this podcast episode based on the following transcript:\n\n{transcript}\n\nKeep it under 200 words and highlight the key points.',

    'transcript': 'Please clean up and format this raw transcript:\n\n{transcript}\n\nCorrect any obvious errors, remove filler words, and format it for readability.',

    'show-notes': 'Based on this podcast transcript:\n\n{transcript}\n\nCreate detailed show notes with the following:\n- Key points with timestamps\n- Resources mentioned\n- Quotes worth highlighting\n- Action items for listeners',

    'tags': 'Based on this podcast transcript:\n\n{transcript}\n\nGenerate 10-15 relevant tags/keywords that accurately represent the content and would help with SEO and discoverability.',

    'titles': 'Based on this podcast transcript:\n\n{transcript}\n\nGenerate 5 compelling title options for this episode. Titles should be catchy, under 60 characters, and accurately reflect the content.',

    'process': 'Based on this podcast transcript:\n\n{transcript}\n\nOutline the key steps or process discussed in this episode in a clear, numbered format.'
  };

  return defaultPrompts[sectionId] || 'Generate content based on the transcript: {transcript}';
};