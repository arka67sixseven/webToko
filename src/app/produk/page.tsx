import type { Metadata } from "next";
import { serverCaller } from "@/server/trpc/caller";
import { CatalogClient } from "@/components/catalog-client";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return {
    title: q ? `Cari "${q}"` : "Semua Produk",
    description: "Jelajahi katalog laptop, PC rakitan, dan komponen komputer TokoKomputer.",
  };
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const get = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const caller = await serverCaller();
  const [categories, brands] = await Promise.all([
    caller.catalog.categories(),
    caller.catalog.brands(),
  ]);

  return (
    <CatalogClient
      categories={categories}
      brands={brands}
      initial={{
        q: get("q"),
        category: get("category"),
        brand: get("brand"),
        origin: get("origin"),
        sort: get("sort"),
        minPrice: get("minPrice"),
        maxPrice: get("maxPrice"),
        page: get("page"),
      }}
    />
  );
}