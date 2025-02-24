import { openDB } from 'idb';

const DB_NAME = 'quickcast-db';
const EPISODE_STORE = 'episodes';
const DB_VERSION = 1;

// Initialize the IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for episodes if it doesn't exist
      if (!db.objectStoreNames.contains(EPISODE_STORE)) {
        db.createObjectStore(EPISODE_STORE, { keyPath: 'id' });
      }
    },
  });
};

// Save an episode
export const saveEpisode = async (episode) => {
  try {
    const db = await initDB();

    // Ensure episode has an ID
    const episodeToSave = {
      ...episode,
      id: episode.id || Date.now().toString(),
      updatedAt: new Date().toISOString()
    };

    if (!episodeToSave.createdAt) {
      episodeToSave.createdAt = new Date().toISOString();
    }

    await db.put(EPISODE_STORE, episodeToSave);
    return episodeToSave.id;
  } catch (error) {
    console.error('Error saving episode:', error);
    throw new Error('Failed to save episode');
  }
};

// Get a specific episode by ID
export const getEpisodeById = async (id) => {
  try {
    const db = await initDB();
    const episode = await db.get(EPISODE_STORE, id);

    if (!episode) {
      throw new Error('Episode not found');
    }

    return episode;
  } catch (error) {
    console.error('Error getting episode:', error);
    throw new Error('Failed to retrieve episode');
  }
};

// Get draft episode by ID
export const getDraftEpisode = async (id) => {
  return getEpisodeById(id);
};

// Update draft episode
export const updateDraftEpisode = async (id, updates) => {
  try {
    const db = await initDB();
    const episode = await db.get(EPISODE_STORE, id);

    if (!episode) {
      throw new Error('Episode not found');
    }

    const updatedEpisode = {
      ...episode,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.put(EPISODE_STORE, updatedEpisode);
    return updatedEpisode;
  } catch (error) {
    console.error('Error updating episode:', error);
    throw new Error('Failed to update episode');
  }
};

// Delete an episode
export const deleteEpisode = async (id) => {
  try {
    const db = await initDB();
    await db.delete(EPISODE_STORE, id);
    return true;
  } catch (error) {
    console.error('Error deleting episode:', error);
    throw new Error('Failed to delete episode');
  }
};

// Get all episodes
export const getAllEpisodes = async () => {
  try {
    const db = await initDB();
    const episodes = await db.getAll(EPISODE_STORE);
    return episodes;
  } catch (error) {
    console.error('Error getting all episodes:', error);
    throw new Error('Failed to retrieve episodes');
  }
};

// Generate AI content using OpenAI API
export const generateAIContent = async (prompt) => {
  try {
    // Check if we're in development mode and should mock the API
    if (process.env.REACT_APP_MOCK_AI === 'true') {
      // Mock response for development
      console.log('Using mock AI response');
      return mockAIResponse(prompt);
    }

    // Real API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error generating content');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error('Failed to generate content: ' + (error.message || 'Unknown error'));
  }
};

// Mock AI response for development without API key
const mockAIResponse = (prompt) => {
  // Wait a bit to simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple mock response based on prompt type
      if (