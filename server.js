// server.js
// Minimal Express server — renders EJS views only.
// No database, no Prisma logic here. That comes later.

require("dotenv").config();
const express = require("express");
const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));

const blogPosts = {
  "mid-year-reset": {
    title: "Mid-Year Reset: 7 Simple Self-Care Tips to Recharge",
    body: `Halfway through the year, small habits can make a big difference to how you feel. Whether it's rethinking your sleep schedule, revisiting your hydration habits, or simply carving out ten quiet minutes a day, small resets compound over time.

Start by auditing your current routine honestly. What's serving you, and what's just habit? From there, pick one or two changes to focus on rather than overhauling everything at once — sustainable change beats a dramatic short-lived burst every time.`,
  },
  "dry-vs-dehydrated-skin": {
    title: "Dry Skin vs. Dehydrated Skin — Why People Confuse Them",
    body: `Dry skin lacks oil, while dehydrated skin lacks water — and treating one like the other often makes things worse. Dry skin is a skin type, usually genetic and long-term, while dehydration is a temporary condition that can affect any skin type, including oily skin.

If your skin feels tight and flaky, you likely need richer, oil-based moisturizers. If it feels tight but still looks shiny or breaks out easily, hydration (think hyaluronic acid, water-based serums) is what's missing.`,
  },
  "being-there-through-every-moment": {
    title: "Why Being There Through Every Moment Matters",
    body: `From routine check-ups to life's bigger decisions, consistent care changes outcomes. Healthcare isn't just about the moments of crisis — it's the quiet, ongoing relationship between you and a pharmacy or provider who knows your history.

That consistency is why we built Samers Pharmacy the way we did: not just a place to fill a prescription once, but a partner across every stage of your health journey.`,
  },
  "managing-chronic-conditions": {
    title: "Managing Chronic Conditions Without Losing Yourself",
    body: `Practical, sustainable habits for living well alongside a long-term diagnosis. A chronic condition doesn't have to define your identity — but it does require systems: medication routines, regular monitoring, and a support network you can rely on.

Talk to your pharmacist about tools like pill organizers, refill reminders, or combination dosing that simplifies your day-to-day management.`,
  },
};

// --- ROUTES ---
// (routes will go here as we build real pages, e.g. app.get('/', ...) for shop.ejs)
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/products", (req, res) => {
  res.render("products");
});

app.get("/product", (req, res) => {
  res.render("product");
});

app.get("/cart", (req, res) => {
  res.render("cart");
});

app.get("/prescription", (req, res) => {
  res.render("prescription");
});

app.get("/category/:slug", (req, res) => {
  res.render("category");
});

app.get("/categories", (req, res) => {
  res.render("categories");
});

app.get("/categories", (req, res) => {
  res.render("categories");
});

app.get("/conditions", (req, res) => {
  res.render("conditions");
});

app.get("/brands", (req, res) => {
  res.render("brands");
});

app.get("/deals", (req, res) => {
  res.render("deals");
});

app.get("/health-services", (req, res) => {
  res.render("health-services");
});

app.get("/consultation", (req, res) => {
  res.render("consultation");
});

app.get("/blog", (req, res) => {
  res.render("blog");
});

app.get("/blog/:slug", (req, res) => {
  const post = blogPosts[req.params.slug];
  if (!post) return res.status(404).send("Post not found");
  res.render("blog-post", { post });
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/store-locator", (req, res) => {
  res.render("store-locator");
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
