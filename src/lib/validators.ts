import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  store: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minReviews: z.coerce.number().int().nonnegative().optional(),
  promotion: z.coerce.boolean().optional(),
  sortBy: z.enum(["score", "price_asc", "price_desc", "rating", "reviews"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const wishlistAddSchema = z.object({
  productId: z.string().cuid(),
  targetPrice: z.number().positive().optional(),
});

export const alertCreateSchema = z.object({
  productId: z.string().cuid(),
  type: z.enum(["PRICE_BELOW", "PERCENT_DROP", "SCORE_ABOVE"]),
  threshold: z.number().positive(),
});
