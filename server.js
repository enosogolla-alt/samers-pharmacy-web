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
const productUploadDir = path.join(__dirname, "public", "uploads", "products");
if (!fs.existsSync(productUploadDir)) fs.mkdirSync(productUploadDir, { recursive: true });

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, productUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadProductImage = multer({ storage: productStorage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

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

function requireAdmin(req, res, next) {
  const user = req.session.user;
  if (!user || (user.role !== "admin" && user.role !== "pharmacist")) {
    return res.redirect("/signin");
  }
  next();
}

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

app.get("/admin/consultations/:id", requireAdmin, async (req, res) => {
  const consultation = await prisma.consultationBooking.findUnique({ where: { id: req.params.id } });
  if (!consultation) return res.status(404).send("Consultation not found");
  res.render("admin/consultation-detail", { consultation });
});

app.post("/admin/consultations/:id/status", requireAdmin, async (req, res) => {
  await prisma.consultationBooking.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.redirect("/admin/consultations/" + req.params.id);
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

app.get("/admin/blog/new", requireAdmin, async (req, res) => {
  res.render("admin/blog-form", { post: null });
});

app.post("/admin/blog", requireAdmin, uploadProductImage.single("image"), async (req, res) => {
  const { title, excerpt, body } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

  await prisma.blogPost.create({
    data: { title, slug, excerpt: excerpt || null, body, imageUrl },
  });

  res.redirect("/admin/blog");
});

app.get("/admin/blog/:id/edit", requireAdmin, async (req, res) => {
  const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).send("Post not found");
  res.render("admin/blog-form", { post });
});

app.post("/admin/blog/:id/edit", requireAdmin, uploadProductImage.single("image"), async (req, res) => {
  const { title, excerpt, body } = req.body;
  const updateData = { title, excerpt: excerpt || null, body };
  if (req.file) {
    updateData.imageUrl = `/uploads/products/${req.file.filename}`;
  }

  await prisma.blogPost.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.redirect("/admin/blog");
});

app.get("/signin", (req, res) => {
  res.render("signin", { error: req.query.error || null });
});

app.get("/admin/products", requireAdmin, async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.render("admin/products", { products });
});

app.get("/admin/products/new", requireAdmin, async (req, res) => {
  const categories = await prisma.category.findMany();
  const brands = await prisma.brand.findMany();
  res.render("admin/product-form", { product: null, categories, brands });
});

app.post("/admin/products", requireAdmin, uploadProductImage.single("image"), async (req, res) => {
  const data = req.body;
  const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      price: parseInt(data.price),
      oldPrice: data.oldPrice ? parseInt(data.oldPrice) : null,
      discountLabel: data.discountLabel || null,
      stock: parseInt(data.stock) || 0,
      reorderLevel: parseInt(data.reorderLevel) || 10,
      featured: data.featured === "on",
      dosageForm: data.dosageForm || null,
      strength: data.strength || null,
      packSize: data.packSize || null,
      activeIngredient: data.activeIngredient || null,
      manufacturer: data.manufacturer || null,
      batchNumber: data.batchNumber || null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      storageConditions: data.storageConditions || null,
requiresPrescription: data.requiresPrescription === "on",
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      imageUrl,
    },
  });

  res.redirect("/admin/products");
});

app.get("/admin/products/:id/edit", requireAdmin, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).send("Product not found");
  const categories = await prisma.category.findMany();
  const brands = await prisma.brand.findMany();
  res.render("admin/product-form", { product, categories, brands });
});

app.post("/admin/products/:id/edit", requireAdmin, uploadProductImage.single("image"), async (req, res) => {
  const data = req.body;
  const updateData = {
      name: data.name,
      description: data.description || null,
      price: parseInt(data.price),
      oldPrice: data.oldPrice ? parseInt(data.oldPrice) : null,
      discountLabel: data.discountLabel || null,
      reorderLevel: parseInt(data.reorderLevel) || 10,
      featured: data.featured === "on",
      dosageForm: data.dosageForm || null,
      strength: data.strength || null,
      packSize: data.packSize || null,
      activeIngredient: data.activeIngredient || null,
      manufacturer: data.manufacturer || null,
      batchNumber: data.batchNumber || null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      storageConditions: data.storageConditions || null,
     requiresPrescription: data.requiresPrescription === "on",
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
  };
  if (req.file) {
    updateData.imageUrl = `/uploads/products/${req.file.filename}`;
  }

  await prisma.product.update({
    where: { id: req.params.id },
    data: updateData,
  });

 res.redirect("/admin/products");
});

app.post("/admin/products/:id/adjust-stock", requireAdmin, async (req, res) => {
  const { reason, newQty, note } = req.body;
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).send("Product not found");

  const previousQty = product.stock;
  const updatedQty = parseInt(newQty);

  await prisma.product.update({
    where: { id: req.params.id },
    data: { stock: updatedQty },
  });

  await prisma.stockLog.create({
    data: {
      productId: product.id,
      changedBy: req.session.user.name,
      previousQty,
      newQty: updatedQty,
      reason,
      note: note || null,
    },
  });

  res.redirect("/admin/products");
});

app.get("/admin/categories", requireAdmin, async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
  });
  res.render("admin/categories", { categories, brands });
});

app.get("/admin/orders", requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.render("admin/orders", { orders });
});

app.get("/admin/orders/new-sale", requireAdmin, async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  res.render("admin/new-sale", { products });
});

app.post("/admin/orders/new-sale", requireAdmin, async (req, res) => {
  const lineCount = parseInt(req.body.lineCount);
  const products = await prisma.product.findMany();

  let total = 0;
  const orderItemsData = [];
  const stockUpdates = [];

  for (let i = 0; i < lineCount; i++) {
    const productId = req.body[`productId_${i}`];
    const qty = parseInt(req.body[`qty_${i}`]);
    if (!productId || !qty) continue;

    const product = products.find((p) => p.id === productId);
    if (!product) continue;

    total += product.price * qty;
    orderItemsData.push({ productId: product.id, qty, price: product.price });
    stockUpdates.push({ id: product.id, newStock: product.stock - qty });
  }

  const order = await prisma.order.create({
    data: {
      total,
      status: "delivered",
      channel: "in_store",
      paymentMethod: req.body.paymentMethod,
      servedBy: req.body.servedBy,
      items: { create: orderItemsData },
    },
  });

  for (const update of stockUpdates) {
    const product = products.find((p) => p.id === update.id);
    await prisma.product.update({ where: { id: update.id }, data: { stock: update.newStock } });
    await prisma.stockLog.create({
      data: {
        productId: update.id,
        changedBy: req.body.servedBy,
        previousQty: product.stock,
        newQty: update.newStock,
        reason: "sale",
        note: `In-store sale, Order #${order.id.slice(0, 8)}`,
      },
    });
  }

  res.redirect(`/admin/orders/${order.id}`);
});

app.get("/admin/orders/:id", requireAdmin, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return res.status(404).send("Order not found");
  res.render("admin/order-detail", { order });
});

app.post("/admin/orders/:id/status", requireAdmin, async (req, res) => {
  await prisma.order.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.redirect("/admin/orders");
});

app.post("/admin/orders/:id/delete", requireAdmin, async (req, res) => {
  await prisma.orderItem.deleteMany({ where: { orderId: req.params.id } });
  await prisma.order.delete({ where: { id: req.params.id } });
  res.redirect("/admin/orders");
});

app.get("/admin/prescriptions", requireAdmin, async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.render("admin/prescriptions", { prescriptions });
});

app.get("/admin/prescriptions/:id", requireAdmin, async (req, res) => {
  const prescription = await prisma.prescription.findUnique({ where: { id: req.params.id } });
  if (!prescription) return res.status(404).send("Prescription not found");
  res.render("admin/prescription-detail", { prescription });
});

app.post("/admin/prescriptions/:id/status", requireAdmin, async (req, res) => {
  await prisma.prescription.update({
    where: { id: req.params.id },
    data: { status: req.body.status },
  });
  res.redirect("/admin/prescriptions/" + req.params.id);
});

app.get("/admin/consultations", requireAdmin, async (req, res) => {
  const consultations = await prisma.consultationBooking.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.render("admin/consultations", { consultations });
});

app.get("/admin/blog", requireAdmin, async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.render("admin/blog", { posts });
});

app.get("/admin/stores", requireAdmin, async (req, res) => {
  const stores = await prisma.store.findMany();
  res.render("admin/stores", { stores });
});

app.get("/admin", requireAdmin, async (req, res) => {
  const [productCount, orderCount, pendingPrescriptions, pendingConsultations] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.prescription.count({ where: { status: "submitted" } }),
      prisma.consultationBooking.count(),
    ]);
  res.render("admin/overview", {
    productCount,
    orderCount,
    pendingPrescriptions,
    pendingConsultations,
  });
});

app.post("/signup", async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return res.redirect("/signin?error=Email already registered");
  }
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return res.redirect("/signin?error=Phone number already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name: fullName, email, phone, password: hashedPassword },
  });

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  res.redirect("/");
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.redirect("/signin?error=Invalid email or password");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.redirect("/signin?error=Invalid email or password");
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  if (user.role === "admin" || user.role === "pharmacist") {
    return res.redirect("/admin");
  }
  res.redirect("/");
});

app.post("/signout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
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

