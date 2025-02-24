import { processEpisode } from "./utils/ai";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEpisodeSchema } from "@shared/schema";
import { generatePodcastFeed } from "./utils/feed";
import OpenAI from "openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FEED_CONFIG = {
  title: process.env.PODCAST_TITLE || "My Podcast",
  description:
    process.env.PODCAST_DESCRIPTION || "A podcast created with QuickCast",
  id: process.env.PODCAST_FEED_ID || "https://quickcast.example.com/feed",
  link: process.env.PODCAST_FEED_LINK || "https://quickcast.example.com",
  language: process.env.PODCAST_LANGUAGE || "en",
  image: process.env.PODCAST_IMAGE,
  author: {
    name: process.env.PODCAST_AUTHOR_NAME || "Podcast Author",
    email: process.env.PODCAST_AUTHOR_EMAIL,
    link: process.env.PODCAST_AUTHOR_LINK,
  },
};

// Configure multer for audio file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: multerStorage });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadDir));

  // File upload endpoint
  app.post("/api/upload", upload.single("audio"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const audioUrl = `/uploads/${req.file.filename}`;
    res.json({ audioUrl });
  });

  app.get("/api/episodes", async (_req, res) => {
    const episodes = await storage.getEpisodes();
    res.json(episodes);
  });

  app.get("/api/episodes/:id", async (req, res) => {
    const episode = await storage.getEpisode(Number(req.params.id));
    if (!episode) {
      res.status(404).json({ message: "Episode not found" });
      return;
    }
    res.json(episode);
  });

  app.post("/api/episodes", async (req, res) => {
    const result = insertEpisodeSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid episode data" });
      return;
    }

    try {
      const episode = await storage.createEpisode(result.data);
      res.json(episode);
    } catch (error) {
      console.error("Failed to create episode:", error);
      res.status(500).json({ message: "Failed to create episode" });
    }
  });

  app.patch("/api/episodes/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ message: "Title is required" });
      return;
    }

    const episode = await storage.updateEpisode(id, { title });
    if (!episode) {
      res.status(404).json({ message: "Episode not found" });
      return;
    }
    res.json(episode);
  });

  app.patch("/api/episodes/:id/publish", async (req, res) => {
    const episode = await storage.publishEpisode(Number(req.params.id));
    if (!episode) {
      res.status(404).json({ message: "Episode not found" });
      return;
    }
    res.json(episode);
  });

  app.delete("/api/episodes/:id", async (req, res) => {
    await storage.deleteEpisode(Number(req.params.id));
    res.status(204).send();
  });

  // RSS Feed endpoint
  app.get("/feed.xml", async (_req, res) => {
    const episodes = await storage.getEpisodes();
    const feed = generatePodcastFeed(episodes, FEED_CONFIG);
    res.type("application/xml");
    res.send(feed);
  });

  // Enhanced transcription endpoint
  app.post("/api/episodes/:id/transcribe", async (req, res) => {
    try {
      const episode = await storage.getEpisode(Number(req.params.id));
      if (!episode) {
        console.log('[Route] Episode not found:', req.params.id);
        return res.status(404).json({ message: "Episode not found" });
      }

      if (!episode.audioUrl) {
        console.log('[Route] No audio URL found for episode:', episode.id);
        return res.status(400).json({ message: "No audio file found for episode" });
      }

      console.log('[Route] Starting AI processing for episode:', {
        id: episode.id,
        audioUrl: episode.audioUrl,
        currentStatus: episode.transcriptionStatus
      });

      // Update episode status to show processing
      await storage.updateEpisode(episode.id, {
        transcriptionStatus: "processing",
        transcript: null,
        showNotes: null,
        aiGeneratedTags: null,
        aiGeneratedSummary: null,
        titleSuggestions: null
      });

      try {
        // Process the episode and get all AI-generated content
        const aiContent = await processEpisode(episode);

        // Update with all AI-generated content
        const updatedEpisode = await storage.updateEpisode(episode.id, {
          transcript: aiContent.transcript,
          showNotes: aiContent.showNotes,
          aiGeneratedTags: aiContent.aiGeneratedTags,
          aiGeneratedSummary: aiContent.aiGeneratedSummary,
          titleSuggestions: aiContent.titleSuggestions,
          transcriptionStatus: "completed"
        });

        console.log('[Route] AI processing completed for episode:', {
          id: episode.id,
          hasTranscript: !!updatedEpisode?.transcript,
          hasShowNotes: !!updatedEpisode?.showNotes,
          hasTags: !!updatedEpisode?.aiGeneratedTags?.length,
          hasSummary: !!updatedEpisode?.aiGeneratedSummary,
          hasTitleSuggestions: !!updatedEpisode?.titleSuggestions?.length
        });

        return res.json(updatedEpisode);
      } catch (error) {
        console.error('[Route] AI processing failed:', {
          episodeId: episode.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Update status to failed
        await storage.updateEpisode(episode.id, {
          transcriptionStatus: "failed",
          transcript: null,
          showNotes: null,
          aiGeneratedTags: null,
          aiGeneratedSummary: null,
          titleSuggestions: null
        });

        return res.status(500).json({
          message: "AI processing failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("[Route] Error in transcription endpoint:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transcript update endpoint
  app.patch("/api/episodes/:id/transcript", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { transcript } = req.body;

      if (!transcript) {
        res.status(400).json({ message: "Transcript is required" });
        return;
      }

      const episode = await storage.updateEpisode(id, { transcript });
      if (!episode) {
        res.status(404).json({ message: "Episode not found" });
        return;
      }

      res.json(episode);
    } catch (error) {
      console.error("Failed to update transcript:", error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  // Apply suggested title endpoint
  app.patch("/api/episodes/:id/apply-title", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { titleIndex } = req.body;

      const episode = await storage.getEpisode(id);
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }

      if (!episode.titleSuggestions || !episode.titleSuggestions[titleIndex]) {
        return res.status(400).json({ message: "Invalid title suggestion index" });
      }

      const updatedEpisode = await storage.updateEpisode(id, {
        title: episode.titleSuggestions[titleIndex]
      });

      res.json(updatedEpisode);
    } catch (error) {
      console.error("Failed to apply suggested title:", error);
      res.status(500).json({ message: "Failed to apply suggested title" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}