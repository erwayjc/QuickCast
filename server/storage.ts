import { ref, get, set, remove, update, push, child } from "firebase/database";
import { database } from "../client/src/lib/firebase";
import type { Episode, InsertEpisode } from "@shared/schema";

export interface IStorage {
  getEpisodes(): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, data: Partial<Episode>): Promise<Episode | undefined>;
  publishEpisode(id: string): Promise<Episode | undefined>;
  deleteEpisode(id: string): Promise<void>;
}

export class FirebaseStorage implements IStorage {
  private episodesRef = ref(database, 'episodes');

  async getEpisodes(): Promise<Episode[]> {
    const snapshot = await get(this.episodesRef);
    if (!snapshot.exists()) return [];

    const episodes: Episode[] = [];
    snapshot.forEach((childSnapshot) => {
      episodes.push({
        id: childSnapshot.key!,
        ...childSnapshot.val()
      });
    });

    return episodes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getEpisode(id: string): Promise<Episode | undefined> {
    const snapshot = await get(child(this.episodesRef, id));
    if (!snapshot.exists()) return undefined;
    return { id: snapshot.key!, ...snapshot.val() };
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const newEpisodeRef = push(this.episodesRef);
    const now = new Date().toISOString();

    const episode: Episode = {
      ...insertEpisode,
      id: newEpisodeRef.key!,
      createdAt: now,
      status: 'draft' as const,
      transcriptionStatus: 'pending' as const
    };

    await set(newEpisodeRef, episode);
    return episode;
  }

  async updateEpisode(id: string, data: Partial<Episode>): Promise<Episode | undefined> {
    const episodeRef = child(this.episodesRef, id);
    const snapshot = await get(episodeRef);
    if (!snapshot.exists()) return undefined;

    const updatedEpisode = {
      ...snapshot.val(),
      ...data,
      id
    };

    await update(episodeRef, data);
    return updatedEpisode;
  }

  async publishEpisode(id: string): Promise<Episode | undefined> {
    return this.updateEpisode(id, { 
      status: 'published' as const,
      publishDate: new Date().toISOString()
    });
  }

  async deleteEpisode(id: string): Promise<void> {
    await remove(child(this.episodesRef, id));
  }
}

export const storage = new FirebaseStorage();