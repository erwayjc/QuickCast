import { episodes, type Episode, type InsertEpisode } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getEpisodes(): Promise<Episode[]>;
  getEpisode(id: number): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: number, data: Partial<Episode>): Promise<Episode | undefined>;
  publishEpisode(id: number): Promise<Episode | undefined>;
  deleteEpisode(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getEpisodes(): Promise<Episode[]> {
    return await db.select().from(episodes).orderBy(episodes.createdAt);
  }

  async getEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db.select().from(episodes).where(eq(episodes.id, id));
    return episode;
  }

  async createEpisode(insertEpisode: InsertEpisode): Promise<Episode> {
    const [episode] = await db
      .insert(episodes)
      .values(insertEpisode)
      .returning();
    return episode;
  }

  async updateEpisode(id: number, data: Partial<Episode>): Promise<Episode | undefined> {
    const [episode] = await db
      .update(episodes)
      .set(data)
      .where(eq(episodes.id, id))
      .returning();
    return episode;
  }

  async publishEpisode(id: number): Promise<Episode | undefined> {
    const [episode] = await db
      .update(episodes)
      .set({ status: 'published' })
      .where(eq(episodes.id, id))
      .returning();
    return episode;
  }

  async deleteEpisode(id: number): Promise<void> {
    await db.delete(episodes).where(eq(episodes.id, id));
  }
}

export const storage = new DatabaseStorage();