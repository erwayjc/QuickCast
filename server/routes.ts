import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEpisodeSchema } from "@shared/schema";

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

  app.delete("/api/episodes/:id", async (req, res) => {
    await storage.deleteEpisode(Number(req.params.id));
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
