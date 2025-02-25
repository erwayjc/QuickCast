import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'quickcast-db';
const AUDIO_STORE = 'audio-files';
const DB_VERSION = 1;

interface AudioData {
  id: string;
  name: string;
  fileName: string;
  type: 'intro' | 'outro';
  file: ArrayBuffer;
  contentType: string;
  dateCreated: string;
}

interface AudioFileReturn {
  id: string;
  name: string;
  file: File;
  type: 'intro' | 'outro';
  dateCreated: string;
}

interface GroupedAudioFiles {
  intro: AudioFileReturn[];
  outro: AudioFileReturn[];
}

// Initialize the IndexedDB
const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for audio files if it doesn't exist
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
    },
  });
};

// Save an audio file
export const saveAudioFile = async (
  file: File, 
  type: 'intro' | 'outro', 
  name: string
): Promise<string> => {
  try {
    const db = await initDB();
    const audioData: AudioData = {
      id: Date.now().toString(),
      name: name,
      fileName: file.name,
      type: type,
      file: await fileToArrayBuffer(file),
      contentType: file.type,
      dateCreated: new Date().toISOString()
    };

    await db.put(AUDIO_STORE, audioData);
    return audioData.id;
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
};

// Get all audio files
export const getAudioFiles = async (): Promise<GroupedAudioFiles> => {
  try {
    const db = await initDB();
    const allFiles = await db.getAll(AUDIO_STORE);

    // Group files by type and convert ArrayBuffer back to File
    const introFiles: AudioFileReturn[] = [];
    const outroFiles: AudioFileReturn[] = [];

    for (const fileData of allFiles) {
      const file = new File(
        [fileData.file], 
        fileData.fileName, 
        { type: fileData.contentType }
      );

      const fileObj: AudioFileReturn = {
        id: fileData.id,
        name: fileData.name,
        file: file,
        type: fileData.type,
        dateCreated: fileData.dateCreated
      };

      if (fileData.type === 'intro') {
        introFiles.push(fileObj);
      } else if (fileData.type === 'outro') {
        outroFiles.push(fileObj);
      }
    }

    return {
      intro: introFiles,
      outro: outroFiles
    };
  } catch (error) {
    console.error('Error getting audio files:', error);
    throw new Error('Failed to retrieve audio files');
  }
};

// Get a specific audio file by ID
export const getAudioFileById = async (id: string): Promise<AudioFileReturn> => {
  try {
    const db = await initDB();
    const fileData = await db.get(AUDIO_STORE, id);

    if (!fileData) {
      throw new Error('Audio file not found');
    }

    // Convert ArrayBuffer back to File
    const file = new File(
      [fileData.file], 
      fileData.fileName, 
      { type: fileData.contentType }
    );

    return {
      id: fileData.id,
      name: fileData.name,
      file: file,
      type: fileData.type,
      dateCreated: fileData.dateCreated
    };
  } catch (error) {
    console.error('Error getting audio file:', error);
    throw new Error('Failed to retrieve audio file');
  }
};

// Delete an audio file
export const deleteAudioFile = async (id: string): Promise<boolean> => {
  try {
    const db = await initDB();
    await db.delete(AUDIO_STORE, id);
    return true;
  } catch (error) {
    console.error('Error deleting audio file:', error);
    throw new Error('Failed to delete audio file');
  }
};

// Helper function to convert File to ArrayBuffer for storage
const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

// Helper function to get all audio files of a specific type
export const getAudioFilesByType = async (type: 'intro' | 'outro'): Promise<AudioFileReturn[]> => {
  try {
    const allFiles = await getAudioFiles();
    return allFiles[type] || [];
  } catch (error) {
    console.error(`Error getting ${type} audio files:`, error);
    throw new Error(`Failed to retrieve ${type} audio files`);
  }
};
