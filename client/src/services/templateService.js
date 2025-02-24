import { openDB } from 'idb';

const DB_NAME = 'quickcast-db';
const TEMPLATE_STORE = 'templates';
const DB_VERSION = 1;

// Initialize the IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for templates if it doesn't exist
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
        db.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' });
      }
    },
  });
};

// Save a template
export const saveTemplate = async (template) => {
  try {
    const db = await initDB();
    await db.put(TEMPLATE_STORE, {
      ...template,
      dateCreated: new Date().toISOString()
    });
    return template.id;
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
};

// Get all templates
export const getTemplates = async () => {
  try {
    const db = await initDB();
    const allTemplates = await db.getAll(TEMPLATE_STORE);

    // Group templates by type
    const introTemplates = allTemplates.filter(t => t.type === 'intro');
    const outroTemplates = allTemplates.filter(t => t.type === 'outro');

    return {
      intro: introTemplates,
      outro: outroTemplates
    };
  } catch (error) {
    console.error('Error getting templates:', error);
    throw new Error('Failed to retrieve templates');
  }
};

// Get a specific template by ID
export const getTemplateById = async (id) => {
  try {
    const db = await initDB();
    const template = await db.get(TEMPLATE_STORE, id);

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  } catch (error) {
    console.error('Error getting template:', error);
    throw new Error('Failed to retrieve template');
  }
};

// Delete a template
export const deleteTemplate = async (id) => {
  try {
    const db = await initDB();
    await db.delete(TEMPLATE_STORE, id);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw new Error('Failed to delete template');
  }
};

// Get templates by type
export const getTemplatesByType = async (type) => {
  try {
    const allTemplates = await getTemplates();
    return allTemplates[type] || [];
  } catch (error) {
    console.error(`Error getting ${type} templates:`, error);
    throw new Error(`Failed to retrieve ${type} templates`);
  }
};