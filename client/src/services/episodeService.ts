import { Episode } from '@shared/schema';

export async function getDraftEpisode(id: string): Promise<Episode> {
  const response = await fetch(`/api/episodes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch episode');
  }
  return response.json();
}

export async function updateDraftEpisode(id: string, update: Partial<Episode>): Promise<Episode> {
  const response = await fetch(`/api/episodes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });
  if (!response.ok) {
    throw new Error('Failed to update episode');
  }
  return response.json();
}

export async function generateAIContent(prompt: string): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error('Failed to generate content');
  }
  const data = await response.json();
  return data.content;
}
