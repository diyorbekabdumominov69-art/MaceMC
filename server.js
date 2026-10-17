
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60
}));

const required = [
  "JWT_SECRET",
  "OPENAI_API_KEY",
  "ADMIN_EMAIL",
  "ADMIN_SETUP_SECRET",
  "FRONTEND_URL"
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Environment variable missing: ${key}`);
    process.exit(1);
  }
}

const db = new Database(
  process.env.DB_PATH || "./macemc.db"
);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rank TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const createUser = db.prepare(`
  INSERT INTO users (email, password_hash, rank, role)
  VALUES (?, ?, 'Free', ?)
`);

const findUser = db.prepare(
  "SELECT * FROM users WHERE email = ?"
);

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  try {
    if (!token) throw new Error("No token");
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Login qayta talab qilinadi." });
  }
}

function currentUser(req) {
  return findUser.get(req.auth.email);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "MaceMC Backend" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const adminSecret = String(req.body.adminSecret || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email noto‘g‘ri." });
    }

    if (password.length < 10) {
      return res.status(400).json({
        error: "Parol kamida 10 ta belgidan iborat bo‘lsin."
      });
    }

    const isAdminEmail =
      email === process.env.ADMIN_EMAIL.trim().toLowerCase();

    if (isAdminEmail && adminSecret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({
        error: "Admin ro‘yxatdan o‘tish kodi noto‘g‘ri."
      });
    }

    const hash = await bcrypt.hash(password, 12);
    createUser.run(email, hash, isAdminEmail ? "admin" : "user");

    res.status(201).json({ message: "Hisob yaratildi." });
  } catch (error) {
    if (String(error.code) === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Bu email band." });
    }
    console.error(error);
    res.status(500).json({ error: "Ro‘yxatdan o‘tishda xato." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = findUser.get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Email yoki parol xato." });
    }

    res.json({
      token: tokenFor(user),
      user: {
        email: user.email,
        rank: user.rank,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login xatosi." });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const user = currentUser(req);
  if (!user) return res.status(404).json({ error: "Hisob topilmadi." });

  res.json({
    email: user.email,
    rank: user.rank,
    role: user.role
  });
});

app.get("/api/admin", authenticate, (req, res) => {
  const user = currentUser(req);

  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin ruxsati kerak." });
  }

  res.json({
    message: "Admin panel API ishlayapti.",
    users: db.prepare(
      "SELECT id, email, rank, role, created_at FROM users ORDER BY id DESC"
    ).all()
  });
});

app.post("/api/ai/montage-plan", authenticate, async (req, res) => {
  try {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: "Hisob topilmadi." });

    const duration = Number(req.body.duration);
    const style = String(req.body.style || "dynamic gaming montage")
      .slice(0, 300);

    if (!Number.isFinite(duration) || duration <= 0 || duration > 3600) {
      return res.status(400).json({
        error: "Video davomiyligi 1–3600 soniya oralig‘ida bo‘lsin."
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6",
      input: [
        {
          role: "system",
          content:
            "You are a video editor assistant. Suggest an editing plan. " +
            "Return concise plain text with suggested cuts, pacing, and transitions. " +
            "Do not claim the video has been rendered."
        },
        {
          role: "user",
          content:
            `Video davomiyligi: ${duration} soniya. ` +
            `Montaj uslubi: ${style}. ` +
            "Create a practical editing plan in Uzbek."
        }
      ]
    });

    res.json({
      plan: response.output_text,
      rendered: false,
      message: "AI montaj rejasi tayyor. Bu hali render qilingan video emas."
    });
  } catch (error) {
    console.error("AI error:", error);
    res.status(502).json({
      error: "AI API so‘rovi bajarilmadi. API kaliti va billingni tekshiring."
    });
  }
});

const port = Number(process.env.PORT || 10000);
app.listen(port, "0.0.0.0", () => {
  console.log(`MaceMC backend port ${port} da ishga tushdi.`);
});
