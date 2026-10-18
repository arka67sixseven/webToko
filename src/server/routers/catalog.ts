import { Prisma, Origin } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/server/prisma";
import { publicProcedure, router } from "@/server/trpc/trpc";
import { productListSchema, reviewSchema, slugSchema } from "@/server/validators";
import { discountPrice } from "@/lib/utils";

const productSummary = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  price: true,
  discountPercent: true,
  currency: true,
  stock: true,
  origin: true,
  featured: true,
  isNew: true,
  images: true,
  categoryId: true,
};

const catalogRouter = router({
  categories: publicProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        children: { orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } },
        _count: { select: { products: true } },
      },
    });
    return categories
      .filter((c) => !c.parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
        children: c.children.map((ch) => ({
          id: ch.id,
          name: ch.name,
          slug: ch.slug,
          productCount: ch._count.products,
        })),
      }));
  }),

  brands: publicProcedure.query(async () => {
    return prisma.product.findMany({
      where: { brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    });
  }),

  list: publicProcedure.input(productListSchema).query(async ({ input }) => {
    const where: Prisma.ProductWhereInput = {};
    if (input.q) {
      where.OR = [
        { name: { contains: input.q, mode: "insensitive" } },
        { brand: { contains: input.q, mode: "insensitive" } },
        { description: { contains: input.q, mode: "insensitive" } },
      ];
    }
    if (input.category) {
      const category = await prisma.category.findUnique({ where: { slug: input.category } });
      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategori tidak ditemukan" });
      }
      const childSlugs = await prisma.category.findMany({
        where: { parentId: category.id },
        select: { id: true },
      });
      where.categoryId = {
        in: [category.id, ...childSlugs.map((c) => c.id)],
      };
    }
    if (input.brand) where.brand = input.brand;
    if (input.origin) where.origin = input.origin as Origin;
    if (input.minPrice !== undefined || input.maxPrice !== undefined) {
      where.price = {};
      if (input.minPrice !== undefined) where.price.gte = input.minPrice;
      if (input.maxPrice !== undefined) where.price.lte = input.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      input.sort === "termurah"
        ? [{ price: "asc" }]
        : input.sort === "termahal"
          ? [{ price: "desc" }]
          : input.sort === "populer"
            ? [{ views: "desc" }, { createdAt: "desc" }]
            : [{ createdAt: "desc" }];

    const [items, total, soldMap] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productSummary,
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.product.count({ where }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
      }),
    ]);

    const sold = new Map(soldMap.map((s) => [s.productId, s._sum.quantity ?? 0]));
    const averageRatings = await prisma.review.groupBy({
      by: ["productId"],
      _avg: { rating: true },
      where: { productId: { in: items.map((i) => i.id) }, approved: true },
    });
    const ratingMap = new Map(averageRatings.map((r) => [r.productId, Math.round((r._avg.rating ?? 0) * 10) / 10]));

    return {
      items: items.map((p) => ({
        ...p,
        priceAfterDiscount: discountPrice(p.price, p.discountPercent),
        sold: sold.get(p.id) ?? 0,
        rating: ratingMap.get(p.id) ?? null,
      })),
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }),

  bySlug: publicProcedure.input(slugSchema).query(async ({ input }) => {
    const product = await prisma.product.findUnique({
      where: { slug: input },
      include: {
        category: { include: { parent: true } },
        reviews: {
          where: { approved: true },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
    }

    const [avgAgg, related] = await Promise.all([
      prisma.review.aggregate({
        where: { productId: product.id, approved: true },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.product.findMany({
        where: { categoryId: product.categoryId, slug: { not: product.slug } },
        select: productSummary,
        take: 4,
        orderBy: { views: "desc" },
      }),
    ]);

    return {
      ...product,
      priceAfterDiscount: discountPrice(product.price, product.discountPercent),
      rating: avgAgg._count ? Math.round((avgAgg._avg.rating ?? 0) * 10) / 10 : null,
      reviewCount: avgAgg._count,
      related,
    };
  }),

  addReview: publicProcedure.input(reviewSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Login untuk mengulas produk" });
    }
    const product = await prisma.product.findUnique({
      where: { slug: input.productSlug },
      select: { id: true },
    });
    if (!product) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Produk tidak ditemukan" });
    }
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: ctx.session.id, productId: product.id } },
    });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "Kamu sudah mengulas produk ini" });
    }
    return prisma.review.create({
      data: {
        userId: ctx.session.id,
        productId: product.id,
        rating: input.rating,
        title: input.title,
        body: input.body,
        approved: true,
      },
    });
  }),
});

export default catalogRouter;