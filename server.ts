import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("studio.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    topic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    results TEXT -- JSON string of GeneratedContent[]
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/campaigns", (req, res) => {
    const { id, topic, results } = req.body;
    const stmt = db.prepare("INSERT INTO campaigns (id, topic, results) VALUES (?, ?, ?)");
    stmt.run(id, topic, JSON.stringify(results));
    res.json({ success: true });
  });

  app.get("/api/campaigns", (req, res) => {
    const campaigns = db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC").all();
    res.json(campaigns.map((c: any) => ({
      ...c,
      results: JSON.parse(c.results)
    })));
  });

  app.get("/api/campaigns/:id", (req, res) => {
    const campaign = db.prepare("SELECT * FROM campaigns WHERE id = ?").get(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Not found" });
    res.json({
      ...campaign,
      results: JSON.parse((campaign as any).results)
    });
  });

  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    // In a real app, we'd call Gemini here. For now, we'll return a placeholder
    // but the frontend is set up to call this.
    const seed = Math.floor(Math.random() * 1000);
    res.json({ imageUrl: `https://picsum.photos/seed/${seed}/800/600` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
