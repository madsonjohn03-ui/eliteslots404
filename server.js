const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch }
});

// GET casinos
app.get("/api/casinos", async (req, res) => {
  const { data, error } = await supabase
    .from("casinos")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// ADD casino
app.post("/api/casinos", async (req, res) => {
  const { name, bonus, link, rating } = req.body;

  const { data, error } = await supabase
    .from("casinos")
    .insert([
      {
        name,
        bonus,
        link,
        rating: Number(rating)
      }
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
});

// UPDATE casino
app.put("/api/casinos/:id", async (req, res) => {
  const id = req.params.id;
  const { name, bonus, link, rating } = req.body;

  const { data, error } = await supabase
    .from("casinos")
    .update({
      name,
      bonus,
      link,
      rating: Number(rating)
    })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
});

// DELETE casino
app.delete("/api/casinos/:id", async (req, res) => {
  const id = req.params.id;

  const { error } = await supabase
    .from("casinos")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("RUNNING ON PORT " + PORT);
});
