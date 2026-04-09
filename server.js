const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 ADMIN PASSWORD
const ADMIN_PASSWORD = "gallkrist";

// 🔧 MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 STATIC FILES (EZ A KULCS!)
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// 📦 DATABASE
const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS casinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    bonus TEXT,
    link TEXT,
    rating INTEGER,
    image TEXT
  )
`);

// 📤 FILE UPLOAD
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// 🔐 LOGIN
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

// 📥 GET CASINOS
app.get("/api/casinos", (req, res) => {
  db.all("SELECT * FROM casinos", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ➕ ADD CASINO
app.post("/api/casinos", upload.single("image"), (req, res) => {
  const { name, bonus, link, rating } = req.body;
  const image = req.file ? req.file.filename : null;

  db.run(
    "INSERT INTO casinos (name, bonus, link, rating, image) VALUES (?, ?, ?, ?, ?)",
    [name, bonus, link, rating, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("🔥 Server fut: " + PORT);
});
