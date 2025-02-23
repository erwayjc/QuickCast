import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEpisodeSchema } from "@shared/schema";
import { generatePodcastFeed } from "./utils/feed";
import { processEpisode, transcribeAudio } from "./utils/ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from 'express';

const FEED_CONFIG = {
  title: process.env.PODCAST_TITLE || "My Podcast",
  description: process.env.PODCAST_DESCRIPTION || "A podcast created with QuickCast",
  id: process.env.PODCAST_FEED_ID || "https://quickcast.example.com/feed",
  link: process.env.PODCAST_FEED_LINK || "https://quickcast.example.com",
  language: process.env.PODCAST_LANGUAGE || "en",
  image: process.env.PODCAST_IMAGE,
  author: {
    name: process.env.PODCAST_AUTHOR_NAME || "Podcast Author",
    email: process.env.PODCAST_AUTHOR_EMAIL,
    link: process.env.PODCAST_AUTHOR_LINK
  }
};

// Configure multer for audio file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: multerStorage });

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // File upload endpoint
  app.post('/api/upload', upload.single('audio'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the URL to access the file
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
      // Create the episode first
      const episode = await storage.createEpisode(result.data);

      // Start AI processing in the background
      processEpisode(episode)
        .then(async (aiData) => {
          // Update the episode with AI-generated content
          const updatedEpisode = await storage.updateEpisode(episode.id, aiData);
          console.log('AI processing completed for episode:', episode.id);
        })
        .catch((error) => {
          console.error('AI processing failed for episode:', episode.id, error);
          storage.updateEpisode(episode.id, { transcriptionStatus: 'failed' });
        });

      res.json(episode);
    } catch (error) {
      console.error('Failed to create episode:', error);
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
    res.type('application/xml');
    res.send(feed);
  });

  // Add new transcription endpoint
  app.post("/api/episodes/:id/transcribe", async (req, res) => {
    try {
      const episode = await storage.getEpisode(Number(req.params.id));
      if (!episode) {
        res.status(404).json({ message: "Episode not found" });
        return;
      }

      // Update episode status to show processing
      await storage.updateEpisode(episode.id, { transcriptionStatus: 'processing' });

      // Start processing in the background
      processEpisode(episode)
        .then(async (aiData) => {
          await storage.updateEpisode(episode.id, aiData);
          console.log('AI processing completed for episode:', episode.id);
        })
        .catch((error) => {
          console.error('AI processing failed for episode:', episode.id, error);
          storage.updateEpisode(episode.id, { transcriptionStatus: 'failed' });
        });

      res.json({ message: "Transcription started" });
    } catch (error) {
      console.error('Failed to start transcription:', error);
      res.status(500).json({ message: "Failed to start transcription" });
    }
  });

  // Add transcript update endpoint
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
      console.error('Failed to update transcript:', error);
      res.status(500).json({ message: "Failed to update transcript" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}