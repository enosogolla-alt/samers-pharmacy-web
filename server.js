// server.js
// Minimal Express server — renders EJS views only.
// No database, no Prisma logic here. That comes later.

require("dotenv").config();
const express = require("express");
const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));

// --- ROUTES ---
// (routes will go here as we build real pages, e.g. app.get('/', ...) for shop.ejs)
app.get("/", (req, res) => {
  res.render("home");
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
