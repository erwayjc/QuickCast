import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const episodeStatus = pgEnum('episode_status', ['draft', 'published']);
export const episodeType = pgEnum('episode_type', ['full', 'trailer', 'bonus']);
export const templateType = pgEnum('template_type', ['intro', 'outro']);

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default('Episode description not provided').notNull(),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration").notNull(),
  episodeNumber: integer("episode_number"),
  seasonNumber: integer("season_number"),
  episodeType: episodeType("episode_type").default('full').notNull(),
  artworkUrl: text("artwork_url"),
  keywords: text("keywords").array(),
  hasIntro: boolean("has_intro").default(false).notNull(),
  hasOutro: boolean("has_outro").default(false).notNull(),
  status: episodeStatus("status").default('draft').notNull(),
  publishDate: timestamp("publish_date"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: templateType("type").notNull(),
  script: text("script").notNull(),
  backgroundMusic: text("background_music").notNull(),
  musicVolume: integer("music_volume").default(50).notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertEpisodeSchema = createInsertSchema(episodes)
  .pick({
    title: true,
    description: true,
    audioUrl: true,
    duration: true,
    episodeNumber: true,
    seasonNumber: true,
    episodeType: true,
    artworkUrl: true,
    keywords: true,
    hasIntro: true,
    hasOutro: true,
    status: true,
    publishDate: true
  });

export const insertTemplateSchema = createInsertSchema(templates)
  .pick({
    name: true,
    type: true,
    script: true,
    backgroundMusic: true,
    musicVolume: true,
    duration: true
  });

export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;