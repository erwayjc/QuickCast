import { z } from "zod";

export const episodeStatus = ['draft', 'published'] as const;
export const episodeType = ['full', 'trailer', 'bonus'] as const;
export const templateType = ['intro', 'outro'] as const;
export const transcriptionStatus = ['pending', 'processing', 'completed', 'failed'] as const;

export const episodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default('Episode description not provided'),
  audioUrl: z.string(),
  duration: z.number(),
  episodeNumber: z.number().optional(),
  seasonNumber: z.number().optional(),
  episodeType: z.enum(episodeType).default('full'),
  artworkUrl: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  hasIntro: z.boolean().default(false),
  hasOutro: z.boolean().default(false),
  status: z.enum(episodeStatus).default('draft'),
  publishDate: z.string().optional(),
  createdAt: z.string(),
  transcript: z.string().optional(),
  transcriptionStatus: z.enum(transcriptionStatus).default('pending'),
  showNotes: z.string().optional(),
  aiGeneratedTags: z.array(z.string()).optional(),
  aiGeneratedSummary: z.string().optional(),
  introMusicUrl: z.string().optional(),
  outroMusicUrl: z.string().optional()
});

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(templateType),
  script: z.string(),
  backgroundMusic: z.string(),
  musicVolume: z.number().default(50),
  duration: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const insertEpisodeSchema = episodeSchema.omit({ 
  id: true,
  createdAt: true,
  status: true,
  transcriptionStatus: true
});

export const insertTemplateSchema = templateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type Episode = z.infer<typeof episodeSchema>;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Template = z.infer<typeof templateSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;