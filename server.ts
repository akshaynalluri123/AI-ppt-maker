import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("--- Server Initializing ---");
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.GEMINI_API_KEY 
    });
  });

  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    console.log("Mode: DEVELOPMENT (Vite Middleware)");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    // Serve index.html for all non-API routes in dev
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      
      try {
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        console.error("Vite transformation error:", e);
        next(e);
      }
    });
  } else {
    console.log("Mode: PRODUCTION (Static Assets)");
    const distPath = path.resolve(__dirname, "dist");
    const rootPath = path.resolve(__dirname);
    
    console.log(`Dist Path: ${distPath}`);
    console.log(`Root Path: ${rootPath}`);

    // Serve static files from dist if it exists, otherwise from root (for dev-like prod)
    if (fs.existsSync(distPath)) {
      console.log("Serving from /dist");
      app.use(express.static(distPath));
    } else {
      console.warn("WARNING: /dist not found, serving from root");
      app.use(express.static(rootPath));
    }
    
    // SPA fallback
    app.get("*", (req, res) => {
      console.log(`GET ${req.url} - SPA Fallback`);
      const distIndex = path.resolve(distPath, "index.html");
      const rootIndex = path.resolve(rootPath, "index.html");
      
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
      } else {
        res.status(404).send("Application files not found. Please contact support.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`--- Server Ready at http://0.0.0.0:${PORT} ---`);
  });
}

startServer().catch((err) => {
  console.error("CRITICAL: Failed to start server:", err);
});
