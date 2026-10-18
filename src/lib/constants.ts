export const SITE_NAME = "TokoKomputer";
export const SITE_DESCRIPTION =
  "Toko online laptop, PC jadi, dan komponen komputer — produk lokal & impor dengan harga kompetitif, garansi resmi, dan pengiriman cepat.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const FREE_SHIPPING_THRESHOLD = 1_000_000;
export const SHIPPING_FEE = 20_000;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORIGIN_LABEL: Record<string, string> = {
  LOCAL: "Produk Lokal",
  IMPORTED: "Produk Impor",
};

export const CURRENCY_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});