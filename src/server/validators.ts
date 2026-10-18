import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Email tidak valid")
  .max(254)
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password terlalu panjang")
  .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter")
  .max(80);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi").max(72),
});

export const slugSchema = z.string().min(1).max(140);

export const productListSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(120).optional().default(""),
  brand: z.string().trim().max(80).optional().default(""),
  origin: z.enum(["LOCAL", "IMPORTED"]).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["terbaru", "populer", "termurah", "termahal"]).optional().default("terbaru"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(24),
});

export const cartSetSchema = z.object({
  productSlug: z.string().min(1).max(140),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  recipient: nameSchema,
  phone: z.string().trim().min(7).max(20).default("081234567890"),
  addressLine1: z.string().trim().min(5, "Alamat wajib diisi").max(200),
  addressLine2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos 5 digit"),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const reviewSchema = z.object({
  productSlug: z.string().min(1).max(140),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional().default(""),
  body: z.string().trim().min(10, "Ulasan minimal 10 karakter").max(2000),
});

export const adminProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  brand: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(4000).optional().default(""),
  price: z.coerce.number().int().min(1),
  currency: z.string().trim().max(8).default("IDR"),
  stock: z.coerce.number().int().min(0).max(99999).default(0),
  origin: z.enum(["LOCAL", "IMPORTED"]).default("LOCAL"),
  categorySlug: z.string().min(1),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  discountPercent: z.coerce.number().int().min(0).max(90).default(0),
  specs: z.record(z.string(), z.string()).optional().default({}),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductListInput = z.infer<typeof productListSchema>;
export type CartSetInput = z.infer<typeof cartSetSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AdminProductInput = z.infer<typeof adminProductSchema>;