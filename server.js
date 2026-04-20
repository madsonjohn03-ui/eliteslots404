const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new sqlite3.Database("./database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS casinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    bonus TEXT,
    link TEXT,
    rating INTEGER
  )
`);

app.get("/api/casinos", (req, res) => {
  db.all("SELECT * FROM casinos ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post("/api/casinos", (req, res) => {
  const { name, bonus, link, rating } = req.body;

  db.run(
    "INSERT INTO casinos (name, bonus, link, rating) VALUES (?, ?, ?, ?)",
    [name, bonus, link, rating],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete("/api/casinos/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM casinos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log("RUNNING ON PORT " + PORT);
});
