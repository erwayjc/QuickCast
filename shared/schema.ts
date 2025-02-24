import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const episodeStatus = pgEnum('episode_status', ['draft', 'published']);
export const episodeType = pgEnum('episode_type', ['full', 'trailer', 'bonus']);
export const templateType = pgEnum('template_type', ['intro', 'outro']);
export const transcriptionStatus = pgEnum('transcription_status', ['pending', 'processing', 'completed', 'failed']);

// Episode table
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
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // Music-related fields (keeping these)
  introMusicUrl: text("intro_music_url"),
  outroMusicUrl: text("outro_music_url"),

  // AI-related fields
  transcript: text("transcript"),
  transcriptionStatus: transcriptionStatus("transcription_status").default('pending'),
  showNotes: text("show_notes"),
  aiGeneratedTags: text("ai_generated_tags").array().default(Array()),
  aiGeneratedSummary: text("ai_generated_summary"),
  titleSuggestions: text("title_suggestions").array().default(Array())
});

// Templates table (keeping this)
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

// Enhanced Zod schema for episode insertion with better validation
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
    publishDate: true,
    introMusicUrl: true,
    outroMusicUrl: true,
    transcript: true,
    transcriptionStatus: true,
    showNotes: true,
    aiGeneratedTags: true,
    aiGeneratedSummary: true,
    titleSuggestions: true
  })
  .extend({
    // Add additional validation for AI-related fields
    transcript: z.string().nullable().optional(),
    transcriptionStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
    showNotes: z.string().nullable().optional(),
    aiGeneratedTags: z.array(z.string()).default([]),
    aiGeneratedSummary: z.string().nullable().optional(),
    titleSuggestions: z.array(z.string()).default([])
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

// Type exports
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;