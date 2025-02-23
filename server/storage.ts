import { episodes, type Episode, type InsertEpisode } from "@shared/schema";

export interface IStorage {
  getEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  deleteEpisode(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private episodes: Map<number, Episode>;
  private currentId: number;

  constructor() {
    this.episodes = new Map();
    this.currentId = 1;
  }

  async getEpisodes(): Promise<Episode[]> {
    return Array.from(this.episodes.values());
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    return this.episodes.get(id);
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const id = this.currentId++;
    const episode: Episode = {
      ...insertEpisode,
      id,
      createdAt: new Date()
    };
    this.episodes.set(id, episode);
    return episode;
  }

  async deleteEpisode(id: number): Promise<void> {
    this.episodes.delete(id);
  }
}

export const storage = new MemStorage();
