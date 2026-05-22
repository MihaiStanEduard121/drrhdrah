import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();

// Secret configuration
const JWT_SECRET = process.env.JWT_SECRET || "tv-live-streaming-token-super-secret-key-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tvlive.ro";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPassword123!";

app.use(express.json());

// Helper text-sanitizer to prevent XSS in iframe or other attributes
function sanitizeInput(text: string): string {
  if (!text) return "";
  // Strip script tags
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Strip onclick / onerror / onload handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=\s*'[^']*'/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "disabled-js:");
  return cleaned;
}

// Ensure the embed code is a standard, responsive iframe embedding or wrap it
function formatEmbedCode(embed: string): string {
  const cleaned = sanitizeInput(embed);
  // If the user inputs a pure URL instead of an iframe, wrap it in a proper responsive iframe
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return `<iframe src="${cleaned}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }
  return cleaned;
}

// Admin Authentication Middleware
function authenticateAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Lipsă token autentificare. Acces interzis." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Sesiune expirată sau token invalid." });
    }
    req.admin = user;
    next();
  });
}

// Seed function to prepopulate Romanian TV stations if DB is empty
async function seedDatabaseIfEmpty() {
  try {
    const count = await prisma.channel.count();
    if (count === 0) {
      console.log("Database empty. Seeding Romanian TV channels...");
      
      const seedChannels = [
        {
          name: "PRO TV",
          slug: "pro-tv",
          description: "PRO TV este postul de televiziune comercial de top din România, oferind o grilă bogată de divertisment, știri de încredere, blockbustere și emisiuni de divertisment de mare rating.",
          category: "Divertisment",
          thumbnail: "https://images.unsplash.com/photo-1595603659983-e818cd121021?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/aquz6n8f668", // Mock Live clip 
          isOnline: true,
        },
        {
          name: "Digi 24",
          slug: "digi24",
          description: "Digi 24 este un post de televiziune de știri de 24 de ore, independent și echidistant, axat pe informații de calitate, evenimente naționale, analize politice și economice.",
          category: "Știri",
          thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/5Peo-ivmupE", // Test video placeholder representing stream
          isOnline: true,
        },
        {
          name: "Digi Sport 1",
          slug: "digi-sport-1",
          description: "Digi Sport oferă transmisiuni live ale celor mai importante competiții sportive, inclusiv Superliga României, UEFA Champions League, tenis de masă de top, Formula 1 și handbal.",
          category: "Sport",
          thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/t8S6Z-QpS14",
          isOnline: true,
        },
        {
          name: "TVR 1",
          slug: "tvr-1",
          description: "Canalul principal al Televiziunii Române publice, TVR 1 transmite informații de interes public, cultură, producții documentare valoroase și evenimente naționale de larg interes.",
          category: "Naționale",
          thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/OidVbXjD23w",
          isOnline: true,
        },
        {
          name: "Kanal D România",
          slug: "kanal-d",
          description: "Kanal D oferă un amestec dinamic de seriale premium, emisiuni interactive de divertisment de zi, reality-show-uri și buletine de știri ancorate în realitatea comunității.",
          category: "Divertisment",
          thumbnail: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/aqz-KE-BPKQ",
          isOnline: true,
        },
        {
          name: "Euronews România",
          slug: "euronews-romania",
          description: "Postul european de știri la nivel global, cu redacție complet locală în România. Oferă perspective obiective internaționale transpuse în limba română pentru un public conectat.",
          category: "Știri",
          thumbnail: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/live_stream?channel=UCunQvVp-yD_8W4_4a0e9bLg",
          isOnline: true,
        }
      ];

      for (const ch of seedChannels) {
        // Enforce safe embed
        ch.embedCode = formatEmbedCode(ch.embedCode);
        await prisma.channel.create({ data: ch });
      }
      console.log("Românian channels seeded successfully!");
    }
  } catch (error) {
    console.error("Failed to seed database: ", error);
  }
}

// Initialize seed
seedDatabaseIfEmpty();


// ================== API ENDPOINTS ==================

// 1. Admin Login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Emailul și parola sunt obligatorii." });
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate JWT token valid for 24h
    const token = jwt.sign({ email: ADMIN_EMAIL, role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({
      success: true,
      token,
      admin: { email: ADMIN_EMAIL }
    });
  }

  return res.status(401).json({ error: "Date de autentificare incorecte." });
});

// 2. Admin Verify Token
app.get("/api/admin/verify", authenticateAdmin, (req: any, res) => {
  res.json({ success: true, user: req.admin });
});

// 3. Admin Dashboard Quick Stats
app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const total = await prisma.channel.count();
    const online = await prisma.channel.count({ where: { isOnline: true } });
    const offline = await prisma.channel.count({ where: { isOnline: false } });
    
    // Categories count
    const channels = await prisma.channel.findMany({ select: { category: true } });
    const uniqueCategories = Array.from(new Set(channels.map(c => c.category)));

    res.json({
      total,
      online,
      offline,
      categoriesCount: uniqueCategories.length
    });
  } catch (error) {
    res.status(500).json({ error: "Eroare la obținerea statisticilor din baza de date." });
  }
});

// 4. Get Channels (Paginated, Filtered, Searched)
app.get("/api/channels", async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search).toLowerCase() : "";
    const category = req.query.category ? String(req.query.category) : "";
    const status = req.query.status ? String(req.query.status) : ""; // 'online', 'offline'
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 9);
    const skip = (page - 1) * limit;

    // Build Prisma query clauses
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } }
      ];
    }

    if (category && category !== "Toate") {
      whereClause.category = category;
    }

    if (status === "online") {
      whereClause.isOnline = true;
    } else if (status === "offline") {
      whereClause.isOnline = false;
    }

    const [channels, totalCount] = await Promise.all([
      prisma.channel.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.channel.count({
        where: whereClause
      })
    ]);

    // Gather unique categories for filter widgets
    const allCategoriesRaw = await prisma.channel.findMany({
      select: { category: true }
    });
    const categories = Array.from(new Set(allCategoriesRaw.map(c => c.category))).filter(Boolean);

    res.json({
      channels,
      categories: ["Toate", ...categories],
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("API error reading channels:", error);
    res.status(500).json({ error: "Eroare la citirea canalelor." });
  }
});

// 5. Get Single Channel (by ID or Slug)
app.get("/api/channels/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Try finding by slug first, otherwise by id representation
    let channel = await prisma.channel.findUnique({
      where: { slug }
    });

    if (!channel) {
      // Fallback check by direct ID
      channel = await prisma.channel.findFirst({
        where: { id: slug }
      });
    }

    if (!channel) {
      return res.status(404).json({ error: "Canalul nu a fost găsit." });
    }

    // Load similar channels in the same category (limit to 4)
    const similar = await prisma.channel.findMany({
      where: {
        category: channel.category,
        id: { not: channel.id }
      },
      take: 4
    });

    res.json({ channel, similar });
  } catch (error) {
    res.status(500).json({ error: "Eroare la citirea canalului." });
  }
});

// 6. Add Channel (Admin protected)
app.post("/api/channels", authenticateAdmin, async (req, res) => {
  try {
    const { name, slug, description, category, thumbnail, embedCode, isOnline } = req.body;

    if (!name || !description || !category || !thumbnail || !embedCode) {
      return res.status(400).json({ error: "Toate câmpurile obligatorii trebuie completate." });
    }

    // Auto generate clean slug if not explicitly passed
    let cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
    if (!cleanSlug) {
      cleanSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    // Verify slug unique
    const existing = await prisma.channel.findUnique({
      where: { slug: cleanSlug }
    });

    if (existing) {
      // append some salt
      cleanSlug = `${cleanSlug}-${Math.floor(Date.now() / 100000) % 1000}`;
    }

    const safeEmbed = formatEmbedCode(embedCode);
    const safeThumbnail = sanitizeInput(thumbnail);

    const created = await prisma.channel.create({
      data: {
        name: sanitizeInput(name),
        slug: cleanSlug,
        description: sanitizeInput(description),
        category: sanitizeInput(category),
        thumbnail: safeThumbnail,
        embedCode: safeEmbed,
        isOnline: isOnline !== undefined ? Boolean(isOnline) : true
      }
    });

    res.status(201).json({ success: true, channel: created });
  } catch (error: any) {
    console.error("Create channel error:", error);
    res.status(500).json({ error: "Eroare la crearea canalului: " + error.message });
  }
});

// 7. Update Channel (Admin protected)
app.put("/api/channels/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, category, thumbnail, embedCode, isOnline } = req.body;

    // Verify channel exists
    const current = await prisma.channel.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });

    if (!current) {
      return res.status(404).json({ error: "Canalul nu a fost găsit în baza de date." });
    }

    let cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : current.slug;
    
    // If slug changed, verify unique
    if (cleanSlug !== current.slug) {
      const existing = await prisma.channel.findUnique({
        where: { slug: cleanSlug }
      });
      if (existing) {
        cleanSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 5)}`;
      }
    }

    const updated = await prisma.channel.update({
      where: { id: current.id },
      data: {
        name: name ? sanitizeInput(name) : current.name,
        slug: cleanSlug,
        description: description ? sanitizeInput(description) : current.description,
        category: category ? sanitizeInput(category) : current.category,
        thumbnail: thumbnail ? sanitizeInput(thumbnail) : current.thumbnail,
        embedCode: embedCode ? formatEmbedCode(embedCode) : current.embedCode,
        isOnline: isOnline !== undefined ? Boolean(isOnline) : current.isOnline
      }
    });

    res.json({ success: true, channel: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Eroare la actualizarea canalului: " + error.message });
  }
});

// 8. Delete Channel (Admin protected)
app.delete("/api/channels/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const current = await prisma.channel.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    });

    if (!current) {
      return res.status(404).json({ error: "Canalul nu a fost găsit pentru ștergere." });
    }

    await prisma.channel.delete({
      where: { id: current.id }
    });

    res.json({ success: true, message: "Canalul a fost șters cu succes!" });
  } catch (error: any) {
    res.status(500).json({ error: "Eroare la ștergerea canalului: " + error.message });
  }
});


// ================== VITE DEV / PRODUCTION FLOW ==================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In development mode, load Vite server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached.");
  } else {
    // In production, serve the compiled build deliverables
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted! Port is exclusively locked on ${PORT}`);
    console.log(`Open: http://localhost:${PORT}`);
  });
}

startServer();
