const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin access is available behind a password, even when the public site is geo-blocked.
function isAdminAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const authorization = String(req.headers.authorization || "");
  const prefix = "Bearer ";

  if (!expected || !authorization.toLowerCase().startsWith(prefix.toLowerCase())) return false;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(authorization.slice(prefix.length).trim(), "utf8");

  return expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      error: "Admin password is not configured. Add ADMIN_PASSWORD in Render Environment."
    });
  }

  if (!isAdminAuthorized(req)) {
    return res.status(401).json({ error: "Invalid admin password. Please sign in again." });
  }

  next();
}

// Block Hungarian public traffic. Only the admin shell, its logo, public casino
// data, and password-authenticated write operations are exempted.
app.use((req, res, next) => {
  const visitorCountry = String(req.headers["cf-ipcountry"] || "").toUpperCase();
  if (visitorCountry !== "HU") return next();

  const isAdminShell = req.method === "GET" &&
    ["/admin.html", "/brand-logo.webp", "/favicon.svg", "/api/admin/check", "/api/casinos"].includes(req.path);

  const isCasinoCollectionWrite = req.path === "/api/casinos" &&
    ["POST", "PUT", "DELETE"].includes(req.method);

  const isCasinoItemWrite = req.path.startsWith("/api/casinos/") &&
    req.path.split("/").length === 4 &&
    ["PUT", "DELETE"].includes(req.method);

  const isCasinoWrite = (isCasinoCollectionWrite || isCasinoItemWrite) &&
    isAdminAuthorized(req);

  if (isAdminShell || isCasinoWrite) return next();

  return res.status(403).type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Access unavailable</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #08090f; color: #f8fafc; font-family: Arial, sans-serif; text-align: center; }
          main { max-width: 560px; padding: 36px; border: 1px solid #3b3154; border-radius: 18px; background: #171b26; }
          h1 { color: #c4b5fd; font-size: 28px; }
          p { color: #c4bdcf; line-height: 1.7; }
        </style>
      </head>
      <body>
        <main>
          <h1>Access unavailable</h1>
          <p>This website is not available from your current location.</p>
          <p>18+ only. Please follow the laws and regulations that apply where you are.</p>
        </main>
      </body>
    </html>
  `);
});
app.use(express.static("public"));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch }
});

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

app.get("/api/admin/check", requireAdmin, (req, res) => {
  res.json({ success: true });
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

app.get("/api/casinos/:slug", async (req, res) => {
  const slug = req.params.slug;

  const { data, error } = await supabase
    .from("casinos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "Casino not found" });
  }

  res.json(data);
});

app.post("/api/casinos", requireAdmin, async (req, res) => {
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
    sort_order,
    slug,
    review_title,
    meta_description,
    review_text,
    pros,
    cons,
    faq
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
    sort_order: sort_order ? Number(sort_order) : null,
    slug: slug ? slugify(slug) : slugify(name),
    review_title: review_title || null,
    meta_description: meta_description || null,
    review_text: review_text || null,
    pros: pros || null,
    cons: cons || null,
    faq: faq || null
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

app.put("/api/casinos/:id", requireAdmin, async (req, res) => {
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
    sort_order,
    slug,
    review_title,
    meta_description,
    review_text,
    pros,
    cons,
    faq
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
    sort_order: sort_order ? Number(sort_order) : null,
    slug: slug ? slugify(slug) : slugify(name),
    review_title: review_title || null,
    meta_description: meta_description || null,
    review_text: review_text || null,
    pros: pros || null,
    cons: cons || null,
    faq: faq || null
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

app.delete("/api/casinos/:id", requireAdmin, async (req, res) => {
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

app.post("/api/casinos/:id/click", async (req, res) => {
  const id = req.params.id;

  const { data: current, error: fetchError } = await supabase
    .from("casinos")
    .select("clicks")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  if (!current) {
    return res.status(404).json({ error: "Casino not found" });
  }

  const nextClicks = Number(current.clicks || 0) + 1;

  const { error: updateError } = await supabase
    .from("casinos")
    .update({ clicks: nextClicks })
    .eq("id", id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  res.json({ success: true, clicks: nextClicks });
});

app.get("/casino/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "casino.html"));
});

app.listen(PORT, () => {
  console.log("RUNNING ON PORT " + PORT);
});
