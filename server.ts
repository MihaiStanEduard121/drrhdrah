import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from "firebase/firestore";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Read Firebase config from environment variables (like on Vercel) or fallback to local JSON safely
let firebaseConfig: any;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    };
  } else {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } else {
      throw new Error("No Firebase configuration found in environment variables or firebase-applet-config.json");
    }
  }
} catch (err: any) {
  console.error("Firebase config error:", err.message);
  throw err;
}

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

// Error handling based on Firebase SKILL instructions
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function generateUUID() {
  return "ch-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Secret configuration
const JWT_SECRET = process.env.JWT_SECRET || "tv-live-streaming-token-super-secret-key-2026";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tvlive.ro";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPassword123!";

app.use(express.json());

// Helper text-sanitizer to prevent XSS in iframe or other attributes
function sanitizeInput(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=\s*"[^"]*"/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=\s*'[^']*'/gi, "");
  cleaned = cleaned.replace(/javascript:/gi, "disabled-js:");
  return cleaned;
}

// Ensure the embed code is a standard, responsive iframe embedding or wrap it
function formatEmbedCode(embed: string): string {
  const cleaned = sanitizeInput(embed);
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
  const pathForCount = 'channels';
  try {
    let querySnapshot;
    try {
      querySnapshot = await getDocs(query(collection(db, "channels"), limit(1)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, pathForCount);
    }

    if (querySnapshot && querySnapshot.empty) {
      console.log("Firestore collection empty. Seeding Romanian TV channels...");
      
      const seedChannels = [
        {
          name: "PRO TV",
          slug: "pro-tv",
          description: "PRO TV este postul de televiziune comercial de top din România, oferind o grilă bogată de divertisment, știri de încredere, blockbustere și emisiuni de divertisment de mare rating.",
          category: "Divertisment",
          thumbnail: "https://images.unsplash.com/photo-1595603659983-e818cd121021?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/aquz6n8f668",
          isOnline: true,
        },
        {
          name: "Digi 24",
          slug: "digi24",
          description: "Digi 24 este un post de televiziune de știri de 24 de ore, independent și echidistant, axat pe informații de calitate, evenimente naționale, analize politice și economice.",
          category: "Știri",
          thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80",
          embedCode: "https://www.youtube.com/embed/5Peo-ivmupE",
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
        const id = generateUUID();
        const chData = {
          id,
          name: sanitizeInput(ch.name),
          slug: ch.slug,
          description: sanitizeInput(ch.description),
          category: sanitizeInput(ch.category),
          thumbnail: sanitizeInput(ch.thumbnail),
          embedCode: formatEmbedCode(ch.embedCode),
          isOnline: ch.isOnline,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, "channels", id), chData);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `channels/${id}`);
        }
      }
      console.log("Romanian channels seeded successfully in Firestore!");
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
  const pathForStats = 'channels';
  try {
    let allSnapshot;
    try {
      allSnapshot = await getDocs(collection(db, "channels"));
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, pathForStats);
    }

    let total = allSnapshot.size;
    let online = 0;
    let offline = 0;
    const categoriesSet = new Set<string>();

    allSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (data.isOnline) {
        online++;
      } else {
        offline++;
      }
      if (data.category) {
        categoriesSet.add(data.category);
      }
    });

    res.json({
      total,
      online,
      offline,
      categoriesCount: categoriesSet.size
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Eroare la obținerea statisticilor din baza de date." });
  }
});

// 4. Get Channels (Paginated, Filtered, Searched)
app.get("/api/channels", async (req, res) => {
  const pathForList = 'channels';
  try {
    const search = req.query.search ? String(req.query.search).toLowerCase() : "";
    const category = req.query.category ? String(req.query.category) : "";
    const status = req.query.status ? String(req.query.status) : ""; // 'online', 'offline'
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limitVal = Math.max(1, parseInt(req.query.limit as string) || 9);
    const skipVal = (page - 1) * limitVal;

    let allSnapshot;
    try {
      allSnapshot = await getDocs(collection(db, "channels"));
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, pathForList);
    }

    let channelsList: any[] = [];
    allSnapshot.forEach((docSnapshot) => {
      channelsList.push({ id: docSnapshot.id, ...docSnapshot.data() });
    });

    // Support both categories query on all items
    const allUniqueCategories = Array.from(new Set(channelsList.map(c => c.category).filter(Boolean)));

    // Apply in-memory search and filters to guarantee indices safety on Firestore without complex configs
    if (search) {
      channelsList = channelsList.filter(c => 
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.description && c.description.toLowerCase().includes(search)) ||
        (c.category && c.category.toLowerCase().includes(search))
      );
    }

    if (category && category !== "Toate") {
      channelsList = channelsList.filter(c => c.category === category);
    }

    if (status === "online") {
      channelsList = channelsList.filter(c => c.isOnline === true);
    } else if (status === "offline") {
      channelsList = channelsList.filter(c => c.isOnline === false);
    }

    // Sort by name ascending
    channelsList.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const totalCount = channelsList.length;
    const paginated = channelsList.slice(skipVal, skipVal + limitVal);

    res.json({
      channels: paginated,
      categories: ["Toate", ...allUniqueCategories],
      pagination: {
        page,
        limit: limitVal,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limitVal)
      }
    });
  } catch (error) {
    console.error("API error reading channels:", error);
    res.status(500).json({ error: "Eroare la citirea canalelor." });
  }
});

// 5. Get Single Channel (by ID or Slug)
app.get("/api/channels/:slug", async (req, res) => {
  const { slug } = req.params;
  const pathForChannel = `channels/${slug}`;
  try {
    let channel: any = null;

    // First try filtering query by exact slug
    let querySnapshot;
    try {
      querySnapshot = await getDocs(query(collection(db, "channels"), where("slug", "==", slug)));
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, pathForChannel);
    }

    if (!querySnapshot.empty) {
      channel = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    } else {
      // Direct doc ID match fallback
      try {
        const docRef = doc(db, "channels", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          channel = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err) {
        // Suppress ID parsing errors
      }
    }

    if (!channel) {
      return res.status(404).json({ error: "Canalul nu a fost găsit." });
    }

    // Get similar channels in same category (limit 4)
    let similarSnap;
    try {
      similarSnap = await getDocs(query(collection(db, "channels"), where("category", "==", channel.category)));
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, 'channels');
    }

    const similar: any[] = [];
    similarSnap.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if (docSnapshot.id !== channel.id && similar.length < 4) {
        similar.push({ id: docSnapshot.id, ...data });
      }
    });

    res.json({ channel, similar });
  } catch (error) {
    console.error("Error reading single channel:", error);
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

    // Auto generate clean slug
    let cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
    if (!cleanSlug) {
      cleanSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    // Check unique slug in Firestore
    let querySnapshot;
    try {
      querySnapshot = await getDocs(query(collection(db, "channels"), where("slug", "==", cleanSlug)));
    } catch (err) {
      return handleFirestoreError(err, OperationType.LIST, 'channels');
    }

    if (!querySnapshot.empty) {
      cleanSlug = `${cleanSlug}-${Math.floor(Date.now() / 100000) % 1000}`;
    }

    const safeEmbed = formatEmbedCode(embedCode);
    const safeThumbnail = sanitizeInput(thumbnail);
    const id = generateUUID();

    const created = {
      id,
      name: sanitizeInput(name),
      slug: cleanSlug,
      description: sanitizeInput(description),
      category: sanitizeInput(category),
      thumbnail: safeThumbnail,
      embedCode: safeEmbed,
      isOnline: isOnline !== undefined ? Boolean(isOnline) : true,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "channels", id), created);
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `channels/${id}`);
    }

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

    // Verify channel exists in Firestore
    let currentDocRef = doc(db, "channels", id);
    let currentSnap;
    try {
      currentSnap = await getDoc(currentDocRef);
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, `channels/${id}`);
    }

    let current: any = null;

    if (currentSnap.exists()) {
      current = { id: currentSnap.id, ...currentSnap.data() };
    } else {
      // Find by slug
      let qSnap;
      try {
        qSnap = await getDocs(query(collection(db, "channels"), where("slug", "==", id)));
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'channels');
      }

      if (!qSnap.empty) {
        currentDocRef = doc(db, "channels", qSnap.docs[0].id);
        current = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
      }
    }

    if (!current) {
      return res.status(404).json({ error: "Canalul nu a fost găsit în baza de date." });
    }

    let cleanSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : current.slug;
    
    // Check if slug update requires salting
    if (cleanSlug !== current.slug) {
      let qSnap;
      try {
        qSnap = await getDocs(query(collection(db, "channels"), where("slug", "==", cleanSlug)));
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'channels');
      }

      if (!qSnap.empty) {
        cleanSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 5)}`;
      }
    }

    const updatedData = {
      name: name ? sanitizeInput(name) : current.name,
      slug: cleanSlug,
      description: description ? sanitizeInput(description) : current.description,
      category: category ? sanitizeInput(category) : current.category,
      thumbnail: thumbnail ? sanitizeInput(thumbnail) : current.thumbnail,
      embedCode: embedCode ? formatEmbedCode(embedCode) : current.embedCode,
      isOnline: isOnline !== undefined ? Boolean(isOnline) : current.isOnline
    };

    try {
      await updateDoc(currentDocRef, updatedData);
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `channels/${current.id}`);
    }

    res.json({ success: true, channel: { id: current.id, ...updatedData, createdAt: current.createdAt || new Date().toISOString() } });
  } catch (error: any) {
    console.error("Update channel error:", error);
    res.status(500).json({ error: "Eroare la actualizarea canalului: " + error.message });
  }
});

// 8. Delete Channel (Admin protected)
app.delete("/api/channels/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let currentDocRef = doc(db, "channels", id);
    let currentSnap;
    try {
      currentSnap = await getDoc(currentDocRef);
    } catch (err) {
      return handleFirestoreError(err, OperationType.GET, `channels/${id}`);
    }

    let existsValue = currentSnap.exists();
    let currentId = id;

    if (!existsValue) {
      let qSnap;
      try {
        qSnap = await getDocs(query(collection(db, "channels"), where("slug", "==", id)));
      } catch (err) {
        return handleFirestoreError(err, OperationType.LIST, 'channels');
      }

      if (!qSnap.empty) {
        currentDocRef = doc(db, "channels", qSnap.docs[0].id);
        currentId = qSnap.docs[0].id;
        existsValue = true;
      }
    }

    if (!existsValue) {
      return res.status(404).json({ error: "Canalul nu a fost găsit pentru ștergere." });
    }

    try {
      await deleteDoc(currentDocRef);
    } catch (err) {
      return handleFirestoreError(err, OperationType.WRITE, `channels/${currentId}`);
    }

    res.json({ success: true, message: "Canalul a fost șters cu succes!" });
  } catch (error: any) {
    console.error("Delete channel error:", error);
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
