import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook, startSmsScheduler } from "../webhookAndScheduler.js";
import {
  helmetMiddleware,
  globalRateLimit,
  sanitizeBodyMiddleware,
  validateOriginMiddleware,
  securityResponseHeaders,
} from "../security";
import { registerEmailOAuthRoutes } from "../emailOAuthRoutes";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the proxy (Manus/Nginx) so rate-limiter reads the real client IP from X-Forwarded-For
  app.set("trust proxy", 1);

  // ⚠️ Stripe webhook MUST be registered BEFORE express.json() middleware
  registerStripeWebhook(app);

  // ─── Security Middleware (applied in order) ───────────────────────────────
  // 1. Helmet: sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmetMiddleware);
  // 2. Global rate limiter: 200 req/min per IP
  app.use(globalRateLimit);
  // 3. Security response headers (no-store cache control)
  app.use("/api", securityResponseHeaders);
  // 4. Origin validation for state-changing requests
  app.use(validateOriginMiddleware);

  // Configure body parser with reasonable size limit (reduced from 50mb to prevent DoS)
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  // 5. Input sanitization: strip XSS payloads from all body fields
  app.use(sanitizeBodyMiddleware);

  // ─── Twilio Inbound Webhooks ─────────────────────────────────────────────
  // Reject all inbound voice calls with a TwiML <Reject> verb (free, no charge)
  app.post("/api/twilio/voice", express.text({ type: "*/*" }), (_req, res) => {
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>`);
    console.log("[Twilio] Inbound call rejected");
  });

  // Auto-reply to any inbound SMS with a support redirect message
  app.post("/api/twilio/sms", express.urlencoded({ extended: false }), (_req, res) => {
    res.set("Content-Type", "text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>This number does not accept replies. For help, email support@inboxbrief.com or visit inboxbrief.org</Message></Response>`);
    console.log("[Twilio] Inbound SMS auto-replied");
  });

  // Health / warm-up endpoint — used by the frontend to wake the server before OAuth redirect
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Email provider OAuth routes (Gmail, Outlook)
  registerEmailOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the SMS cron scheduler
    startSmsScheduler();
  });
}

startServer().catch(console.error);
