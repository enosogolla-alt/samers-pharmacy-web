require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Medicines & Prescriptions", slug: "medicines" },
    }),
    prisma.category.create({
      data: { name: "Vitamins & Supplements", slug: "vitamins-supplements" },
    }),
    prisma.category.create({
      data: { name: "Skincare & Beauty", slug: "skincare-beauty" },
    }),
    prisma.category.create({
      data: { name: "Mother & Baby", slug: "mother-baby" },
    }),
    prisma.category.create({
      data: { name: "Medical Devices", slug: "medical-devices" },
    }),
    prisma.category.create({
      data: { name: "Personal Care", slug: "personal-care" },
    }),
  ]);

  // Brands
  const brands = await Promise.all([
    prisma.brand.create({ data: { name: "CeraVe", slug: "cerave" } }),
    prisma.brand.create({
      data: { name: "La Roche-Posay", slug: "la-roche-posay" },
    }),
    prisma.brand.create({ data: { name: "Centrum", slug: "centrum" } }),
    prisma.brand.create({ data: { name: "Panadol", slug: "panadol" } }),
  ]);

  // Products
  await prisma.product.create({
    data: {
      name: "Duromine 15mg Capsules 30's",
      slug: "duromine-15mg",
      description:
        "Prescribed for short-term management of obesity, alongside exercise and lifestyle changes.",
      price: 5700,
      oldPrice: 6437,
      discountLabel: "-11%",
      stock: 94,
      dosageForm: "Tablet",
      strength: "15mg",
      packSize: "Pack of 30",
      activeIngredient: "Phentermine",
      rating: 4.2,
      featured: true,
      categoryId: categories[0].id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Vitamin C 1000mg Tablets",
      slug: "vitamin-c-1000mg",
      description:
        "Supports immune health with a high-strength daily dose of Vitamin C.",
      price: 850,
      oldPrice: 1000,
      discountLabel: "15% OFF",
      stock: 120,
      dosageForm: "Tablet",
      strength: "1000mg",
      rating: 4.5,
      featured: true,
      categoryId: categories[1].id,
      brandId: brands[2].id,
    },
  });

  await prisma.product.create({
    data: {
      name: "CeraVe Hydrating Cleanser 236ml",
      slug: "cerave-hydrating-cleanser",
      description:
        "Gentle, non-foaming cleanser formulated with ceramides and hyaluronic acid.",
      price: 2360,
      stock: 60,
      packSize: "236ml",
      rating: 4.8,
      featured: true,
      categoryId: categories[2].id,
      brandId: brands[0].id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Digital Thermometer",
      slug: "digital-thermometer",
      description:
        "Fast, accurate digital temperature readings for the whole family.",
      price: 950,
      oldPrice: 1200,
      discountLabel: "-21%",
      stock: 40,
      rating: 4.3,
      categoryId: categories[4].id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Blood Pressure Monitor",
      slug: "blood-pressure-monitor",
      description:
        "Automatic upper-arm monitor with large, easy-to-read display.",
      price: 3200,
      stock: 25,
      rating: 4.6,
      featured: true,
      categoryId: categories[4].id,
    },
  });

  // Conditions
  await prisma.condition.createMany({
    data: [
      { name: "Aches & Pains", slug: "aches-pains" },
      { name: "Acne", slug: "acne" },
      { name: "Allergy & Hayfever", slug: "allergy-hayfever" },
      { name: "Cough, Cold & Flu", slug: "cough-cold-flu" },
      { name: "Dry Skin", slug: "dry-skin" },
      { name: "Eczema", slug: "eczema" },
    ],
  });

  // Stores
  await prisma.store.createMany({
    data: [
      {
        name: "Eldoret Branch",
        address: "P.O. Box 30128-30100, Eldoret",
        phone: "+254 753 392 372",
        hours: "Mon – Sat: 8:00 AM – 8:00 PM",
        isMain: true,
      },
      {
        name: "Khayega Branch",
        address: "Khayega, Kakamega County",
        phone: "+254 724 777 198",
        hours: "Mon – Sat: 8:00 AM – 7:00 PM",
        isMain: false,
      },
    ],
  });

  // Blog posts
  await prisma.blogPost.createMany({
    data: [
      {
        title: "Mid-Year Reset: 7 Simple Self-Care Tips to Recharge",
        slug: "mid-year-reset",
        excerpt:
          "Halfway through the year, small habits can make a big difference to how you feel.",
        body: `Halfway through the year, small habits can make a big difference to how you feel. Whether it's rethinking your sleep schedule, revisiting your hydration habits, or simply carving out ten quiet minutes a day, small resets compound over time.\n\nStart by auditing your current routine honestly. What's serving you, and what's just habit? From there, pick one or two changes to focus on rather than overhauling everything at once — sustainable change beats a dramatic short-lived burst every time.`,
      },
      {
        title: "Dry Skin vs. Dehydrated Skin — Why People Confuse Them",
        slug: "dry-vs-dehydrated-skin",
        excerpt:
          "Understanding the difference is the first step to treating either one correctly.",
        body: `Dry skin lacks oil, while dehydrated skin lacks water — and treating one like the other often makes things worse.\n\nIf your skin feels tight and flaky, you likely need richer, oil-based moisturizers. If it feels tight but still looks shiny or breaks out easily, hydration is what's missing.`,
      },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
