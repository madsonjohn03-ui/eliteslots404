const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const db = new sqlite3.Database("./database.db");

db.run(`CREATE TABLE IF NOT EXISTS casinos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  bonus TEXT,
  link TEXT,
  rating INTEGER,
  image TEXT
)`);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

app.get("/api/casinos", (req, res) => {
  db.all("SELECT * FROM casinos", [], (err, rows) => {
    if (err) return res.send(err);
    res.json(rows);
  });
});

app.post("/api/casinos", upload.single("image"), (req, res) => {
  const { name, bonus, link, rating } = req.body;
  const image = req.file ? req.file.filename : null;

  db.run(
    "INSERT INTO casinos (name, bonus, link, rating, image) VALUES (?, ?, ?, ?, ?)",
    [name, bonus, link, rating, image],
    function (err) {
      if (err) return res.send(err);
      res.json({ ok: true });
    }
  );
});

app.listen(PORT, () => console.log("RUNNING"));
