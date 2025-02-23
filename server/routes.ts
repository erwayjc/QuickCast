import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEpisodeSchema } from "@shared/schema";
import { generatePodcastFeed } from "./utils/feed";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
    const episode = await storage.createEpisode(result.data);
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

  const httpServer = createServer(app);
  return httpServer;
}