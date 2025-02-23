import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const episodeStatus = pgEnum('episode_status', ['draft', 'published']);

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration").notNull(),
  hasIntro: boolean("has_intro").default(false).notNull(),
  hasOutro: boolean("has_outro").default(false).notNull(),
  status: episodeStatus("status").default('draft').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertEpisodeSchema = createInsertSchema(episodes).pick({
  title: true,
  audioUrl: true,
  duration: true,
  hasIntro: true, 
  hasOutro: true,
  status: true
});

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;