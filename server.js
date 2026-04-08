const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");

const app = express();

// middleware
app.use(express.json());
app.use(express.static("public"));

// uploads mappa létrehozása
if (!fs.existsSync("uploads")) {
fs.mkdirSync("uploads");
}

// statikus képek
app.use("/uploads", express.static("uploads"));

// adatbázis
const db = new sqlite3.Database("database.db");

// multer (kép feltöltés)
const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, "uploads/");
},
filename: function (req, file, cb) {
cb(null, Date.now() + "-" + file.originalname);
}
});

const upload = multer({ storage: storage });

// adatbázis létrehozás
db.exec(`CREATE TABLE IF NOT EXISTS casinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    bonus TEXT,
    link TEXT,
    rating INTEGER,
    image TEXT
);`);

// kaszinó hozzáadás
app.post("/api/casinos", upload.single("image"), function (req, res) {

const name = req.body.name || "";
const bonus = req.body.bonus || "";
const link = req.body.link || "";
const rating = req.body.rating || 0;

let image = "";
if (req.file) {
    image = req.file.filename;
}

db.run(
    "INSERT INTO casinos (name, bonus, link, rating, image) VALUES (?, ?, ?, ?, ?)",
    [name, bonus, link, rating, image],
    function (err) {
        if (err) {
            console.error("DB HIBA:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json({ success: true });
    }
);

});

// kaszinók lekérése
app.get("/api/casinos", function (req, res) {
db.all("SELECT * FROM casinos", [], function (err, rows) {
if (err) {
console.error("GET HIBA:", err);
return res.status(500).json({ error: err.message });
}

    res.json(rows);
});

});

// szerver indítás
app.listen(3000, function () {
console.log("🔥 Fut: http://localhost:3000");
});
