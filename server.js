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

app.get("/api/casinos", async (req, res) => {
  const { data, error } = await supabase
    .from("casinos")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("top_pick", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.post("/api/casinos", async (req, res) => {
  const {
    name,
    bonus,
    link,
    rating,
    logo,
    badge,
    feature_1,
    feature_2,
    feature_3,
    feature_4,
    sort_order
  } = req.body;

  const top_pick = req.body.top_pick === "on";

  const payload = {
    name,
    bonus,
    link,
    rating: Number(rating),
    logo: logo || null,
    badge: badge || null,
    top_pick,
    feature_1: feature_1 || null,
    feature_2: feature_2 || null,
    feature_3: feature_3 || null,
    feature_4: feature_4 || null,
    sort_order: sort_order ? Number(sort_order) : null
  };

  const { data, error } = await supabase
    .from("casinos")
    .insert([payload])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
});

app.put("/api/casinos/:id", async (req, res) => {
  const id = req.params.id;

  const {
    name,
    bonus,
    link,
    rating,
    logo,
    badge,
    feature_1,
    feature_2,
    feature_3,
    feature_4,
    sort_order
  } = req.body;

  const top_pick = req.body.top_pick === "on";

  const payload = {
    name,
    bonus,
    link,
    rating: Number(rating),
    logo: logo || null,
    badge: badge || null,
    top_pick,
    feature_1: feature_1 || null,
    feature_2: feature_2 || null,
    feature_3: feature_3 || null,
    feature_4: feature_4 || null,
    sort_order: sort_order ? Number(sort_order) : null
  };

  const { data, error } = await supabase
    .from("casinos")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, data });
});

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
