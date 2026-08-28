import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_PRODUCTS, MOCK_STORES } from "../src/providers/mock-data.provider";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed iniciando...");

  // Stores
  for (const s of MOCK_STORES) {
    await prisma.store.upsert({
      where: { slug: s.slug },
      update: { name: s.name, logoUrl: s.logoUrl, website: s.website },
      create: { id: s.id, name: s.name, slug: s.slug, logoUrl: s.logoUrl, website: s.website },
    });
  }
  console.log("✓ Stores");

  // Categories
  const categories = [
    { id: "cat-smartphones", name: "Smartphones", slug: "smartphones" },
    { id: "cat-notebooks", name: "Notebooks", slug: "notebooks" },
    { id: "cat-audio", name: "Áudio", slug: "audio" },
    { id: "cat-tvs", name: "TVs", slug: "tvs" },
    { id: "cat-cadeiras", name: "Cadeiras", slug: "cadeiras" },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }
  console.log("✓ Categories");

  // User demo
  const hash = await bcrypt.hash("123456", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@precifly.com" },
    update: {},
    create: { email: "demo@precifly.com", name: "Usuário Demo", passwordHash: hash },
  });
  await prisma.wishlist.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: { userId: demoUser.id },
  });
  console.log("✓ Demo user:", demoUser.email, "/ 123456");

  // Products
  for (const p of MOCK_PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) continue;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        brand: p.brand,
        imageUrl: p.imageUrl,
        categoryId: category.id,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageUrl: p.imageUrl,
        categoryId: category.id,
      },
    });

    // Specs
    for (const spec of p.specs) {
      await prisma.productSpec.upsert({
        where: { productId_key: { productId: product.id, key: spec.key } },
        update: { value: spec.value },
        create: { productId: product.id, key: spec.key, value: spec.value },
      });
    }

    // Offers
    for (const o of p.offers) {
      const store = await prisma.store.findUnique({ where: { slug: o.storeSlug } });
      if (!store) continue;
      await prisma.offer.upsert({
        where: { productId_storeId: { productId: product.id, storeId: store.id } },
        update: { price: o.price, url: o.url, availability: o.availability, collectedAt: new Date() },
        create: {
          productId: product.id,
          storeId: store.id,
          price: o.price,
          url: o.url,
          availability: o.availability,
        },
      });
    }

    // Reviews (limpa e reinsere para consistência)
    await prisma.review.deleteMany({ where: { productId: product.id } });
    for (const r of p.reviews) {
      const date = new Date();
      date.setDate(date.getDate() - r.daysAgo);
      await prisma.review.create({
        data: {
          productId: product.id,
          rating: r.rating,
          content: r.content,
          authorName: r.authorName,
          verifiedPurchase: r.verifiedPurchase,
          createdAt: date,
        },
      });
    }

    // Price history (gera série com variação)
    await prisma.priceHistory.deleteMany({ where: { productId: product.id } });
    const basePrice = p.offers[0]?.price ?? 1000;
    const days = p.priceHistoryDays;
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // variação +-15%
      const variation = (Math.sin(i * 0.5) * 0.05 + (Math.random() - 0.5) * 0.08);
      const price = Number((basePrice * (1 + variation)).toFixed(2));
      // store aleatória
      const store = p.offers[Math.floor(Math.random() * p.offers.length)];
      const storeRecord = await prisma.store.findUnique({ where: { slug: store.storeSlug } });
      await prisma.priceHistory.create({
        data: {
          productId: product.id,
          storeId: storeRecord?.id,
          price,
          recordedAt: date,
        },
      });
    }

    // ReviewInsight mock (baseado em agregação)
    const reviews = await prisma.review.findMany({ where: { productId: product.id } });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => distribution[r.rating]++);
    await prisma.reviewInsight.upsert({
      where: { productId: product.id },
      update: {
        positiveThemes: p.slug.includes("sony") ? ["Cancelamento excelente", "Conforto", "Bateria"] : ["Qualidade", "Custo-benefício"],
        negativeThemes: p.slug.includes("sony") ? ["Microfone recebe reclamações recorrentes"] : p.slug.includes("cadeira") ? ["Durabilidade questionada", "Montagem difícil"] : [],
        sentimentScore: avgRating > 4.5 ? 0.85 : avgRating > 4 ? 0.6 : 0.2,
        summary: `Produto com ${reviews.length} avaliações e média ${avgRating.toFixed(1)}. ${avgRating >= 4.5 ? "Muito bem avaliado." : avgRating >= 4 ? "Bem avaliado." : "Avaliações mistas."}`,
        reviewCount: reviews.length,
        avgRating,
        distribution,
      },
      create: {
        productId: product.id,
        positiveThemes: p.slug.includes("sony") ? ["Cancelamento excelente", "Conforto", "Bateria"] : ["Qualidade", "Custo-benefício"],
        negativeThemes: p.slug.includes("sony") ? ["Microfone recebe reclamações recorrentes"] : p.slug.includes("cadeira") ? ["Durabilidade questionada"] : [],
        sentimentScore: 0.7,
        summary: `Resumo gerado a partir de ${reviews.length} avaliações.`,
        reviewCount: reviews.length,
        avgRating,
        distribution,
      },
    });
  }
  console.log("✓ Products + Offers + Reviews + History + Insights");

  console.log("🎉 Seed concluído");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
