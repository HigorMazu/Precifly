import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type SearchParams = {
  q?: string;
  category?: string;
  store?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minReviews?: number;
  promotion?: boolean;
  sortBy?: "score" | "price_asc" | "price_desc" | "rating" | "reviews";
  page: number;
  limit: number;
};

export async function searchProducts(params: SearchParams) {
  const where: Prisma.ProductWhereInput = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { brand: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.store) {
    where.offers = { some: { store: { slug: params.store } } };
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.offers = {
      some: {
        price: {
          gte: params.minPrice,
          lte: params.maxPrice,
        },
      },
    };
  }
  if (params.promotion !== undefined) {
    // promotion = produto com pelo menos uma oferta disponível e preço abaixo da média? Simplificado: availability true
    // Se promotion true, filtra produtos com ofertas disponíveis
    if (params.promotion) where.offers = { some: { availability: true } };
  }

  // rating e minReviews precisam de agregação; filtra depois no JS ou via subquery
  // Prisma não filtra direto por avg rating sem having; faremos pós-filtro se necessário

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (params.sortBy === "price_asc") {
    // ordena pelo menor preço das ofertas — truque: não direto, ordena por nome por enquanto e depois reordena JS
    orderBy = { name: "asc" };
  } else if (params.sortBy === "price_desc") {
    orderBy = { name: "desc" };
  }

  const skip = (params.page - 1) * params.limit;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        offers: { include: { store: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip,
      take: params.limit,
    }),
  ]);

  // Pós-filtros de rating/minReviews
  let filtered = products;
  if (params.minRating !== undefined) {
    filtered = filtered.filter((p) => {
      if (p.reviews.length === 0) return false;
      const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length;
      return avg >= params.minRating!;
    });
  }
  if (params.minReviews !== undefined) {
    filtered = filtered.filter((p) => p._count.reviews >= params.minReviews!);
  }

  // Sort price manual se necessário
  if (params.sortBy === "price_asc" || params.sortBy === "price_desc") {
    filtered.sort((a, b) => {
      const pa = Math.min(...a.offers.map((o) => Number(o.price)), Infinity);
      const pb = Math.min(...b.offers.map((o) => Number(o.price)), Infinity);
      return params.sortBy === "price_asc" ? pa - pb : pb - pa;
    });
  }

  // Enriquecer com preço mínimo
  const enriched = filtered.map((p) => {
    const minPrice = p.offers.length ? Math.min(...p.offers.map((o) => Number(o.price))) : null;
    const avgRating = p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      imageUrl: p.imageUrl,
      category: p.category,
      offers: p.offers,
      minPrice,
      avgRating,
      reviewCount: p._count.reviews,
    };
  });

  // Se sortBy rating/reviews
  if (params.sortBy === "rating") enriched.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  if (params.sortBy === "reviews") enriched.sort((a, b) => b.reviewCount - a.reviewCount);

  return {
    data: enriched,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
