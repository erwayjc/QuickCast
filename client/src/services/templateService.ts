import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'quickcast-db';
const TEMPLATE_STORE = 'templates';
const DB_VERSION = 1;

interface Template {
  id: string;
  type: 'intro' | 'outro';
  content: string;
  dateCreated: string;
  [key: string]: unknown;
}

interface TemplateGroups {
  intro: Template[];
  outro: Template[];
}

// Initialize the IndexedDB
const initDB = async (): Promise<IDBPDatabase> => {
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
export const saveTemplate = async (template: Omit<Template, 'dateCreated'>): Promise<string> => {
  try {
    const db = await initDB();
    const templateWithDate = {
      ...template,
      dateCreated: new Date().toISOString()
    } satisfies Template;
    await db.put(TEMPLATE_STORE, templateWithDate);
    return templateWithDate.id;
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
};

// Get all templates
export const getTemplates = async (): Promise<TemplateGroups> => {
  try {
    const db = await initDB();
    const allTemplates = await db.getAll(TEMPLATE_STORE);

    // Group templates by type
    const introTemplates = allTemplates.filter((t): t is Template => t.type === 'intro');
    const outroTemplates = allTemplates.filter((t): t is Template => t.type === 'outro');

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
export const getTemplateById = async (id: string): Promise<Template> => {
  try {
    const db = await initDB();
    const template = await db.get(TEMPLATE_STORE, id);

    if (!template) {
      throw new Error('Template not found');
    }

    return template as Template;
  } catch (error) {
    console.error('Error getting template:', error);
    throw new Error('Failed to retrieve template');
  }
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<boolean> => {
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
export const getTemplatesByType = async (type: Template['type']): Promise<Template[]> => {
  try {
    const allTemplates = await getTemplates();
    return allTemplates[type] || [];
  } catch (error) {
    console.error(`Error getting ${type} templates:`, error);
    throw new Error(`Failed to retrieve ${type} templates`);
  }
};