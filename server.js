// server.js
// Minimal Express server — renders EJS views only.
// No database, no Prisma logic here. That comes later.

require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = express();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "public", "uploads", "prescriptions");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const session = require("express-session");
const bcrypt = require("bcryptjs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  }),
);

// Makes the logged-in user available in every EJS template automatically
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// --- ROUTES ---
// (routes will go here as we build real pages, e.g. app.get('/', ...) for shop.ejs)
app.get("/", async (req, res) => {
  const categories = await prisma.category.findMany();
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true },
  });
  const offers = await prisma.product.findMany({
    where: { oldPrice: { not: null } },
  });

  res.render("home", { categories, featuredProducts, offers });
});

app.get("/products", async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true },
  });
  const categories = await prisma.category.findMany();
  res.render("products", { products, categories });
});

app.get("/product/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true, brand: true },
  });
  if (!product) return res.status(404).send("Product not found");
  res.render("product", { product });
});

app.get("/cart", (req, res) => {
  res.render("cart");
});

app.get("/prescription", (req, res) => {
  res.render("prescription", { success: req.query.success === "1" });
});

app.post(
  "/prescription",
  upload.single("prescriptionFile"),
  async (req, res) => {
    const { mode, typedContent, fullName, phone, deliveryAddress, notes } =
      req.body;

    const fileUrl = req.file
      ? `/uploads/prescriptions/${req.file.filename}`
      : null;

    await prisma.prescription.create({
      data: {
        fileUrl,
        typedContent: mode === "type" ? typedContent : null,
        fullName,
        phone,
        deliveryAddress,
        notes,
      },
    });

    res.redirect("/prescription?success=1");
  },
);

app.get("/category/:slug", async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
  });
  if (!category) return res.status(404).send("Category not found");
  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
  });
  res.render("category", { category, products });
});

app.get("/categories", (req, res) => {
  res.render("categories");
});

app.get("/categories", (req, res) => {
  res.render("categories");
});

app.get("/conditions", async (req, res) => {
  const conditions = await prisma.condition.findMany();
  res.render("conditions", { conditions });
});

app.get("/brands", async (req, res) => {
  const brands = await prisma.brand.findMany();
  res.render("brands", { brands });
});

app.get("/deals", async (req, res) => {
  const deals = await prisma.product.findMany({
    where: { oldPrice: { not: null } },
  });
  res.render("deals", { deals });
});

app.get("/health-services", (req, res) => {
  res.render("health-services");
});

app.get("/consultation", (req, res) => {
  res.render("consultation", { success: req.query.success === "1" });
});

app.post("/consultation", async (req, res) => {
  const { mode, topic, branch, date, time, fullName, phone, notes } = req.body;
  await prisma.consultationBooking.create({
    data: { mode, topic, branch, date, time, fullName, phone, notes },
  });
  res.redirect("/consultation?success=1");
});

app.get("/blog", async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.render("blog", { posts });
});

app.get("/blog/:slug", async (req, res) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug: req.params.slug },
  });
  if (!post) return res.status(404).send("Post not found");
  res.render("blog-post", { post });
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/store-locator", async (req, res) => {
  const stores = await prisma.store.findMany();
  res.render("store-locator", { stores });
});

app.post("/checkout", async (req, res) => {
  const cartItems = JSON.parse(req.body.cartData);

  if (!cartItems || cartItems.length === 0) {
    return res.redirect("/cart");
  }

  const productIds = cartItems.map((item) => item.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  let total = 0;
  const orderItemsData = cartItems
    .map((cartItem) => {
      const product = products.find((p) => p.id === cartItem.id);
      if (!product) return null;
      total += product.price * cartItem.qty;
      return { productId: product.id, qty: cartItem.qty, price: product.price };
    })
    .filter(Boolean);

  const order = await prisma.order.create({
    data: {
      total,
      status: "pending",
      items: { create: orderItemsData },
    },
  });

  res.redirect(`/order-confirmation/${order.id}`);
});

app.get("/order-confirmation/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).send("Order not found");
  res.render("order-confirmation", { order });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
