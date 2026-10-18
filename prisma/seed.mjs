import { PrismaClient, Role, Origin } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const PUB = path.join(process.cwd(), "public", "products");

const PALETTE = [
  ["#6366f1", "#4338ca"],
  ["#0ea5e9", "#0369a1"],
  ["#10b981", "#047857"],
  ["#f59e0b", "#b45309"],
  ["#ef4444", "#b91c1c"],
  ["#8b5cf6", "#6d28d9"],
  ["#14b8a6", "#0f766e"],
  ["#f97316", "#c2410c"],
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pick(name, index) {
  const palette = PALETTE[index % PALETTE.length];
  const glyph = name.slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette[0]}"/>
      <stop offset="1" stop-color="${palette[1]}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="640" cy="140" r="220" fill="#ffffff" opacity="0.08"/>
  <circle cx="120" cy="680" r="260" fill="#ffffff" opacity="0.06"/>
  <text x="400" y="380" font-family="Inter,Arial,sans-serif" font-size="200" font-weight="800" fill="#ffffff" opacity="0.94" text-anchor="middle">${glyph}</text>
  <text x="400" y="560" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="600" fill="#ffffff" opacity="0.92" text-anchor="middle">${name.length > 34 ? name.slice(0, 34) + "…" : name}</text>
</svg>`;
}

async function upsertCategory(name, parentId = null) {
  const slug = slugify(name);
  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug, parentId },
  });
}

async function upsertProduct(p, index) {
  const images = [];
  for (let i = 0; i < 3; i += 1) {
    const file = `${p.slug}-${i + 1}.svg`;
    await writeFile(path.join(PUB, file), pick(p.name, index + i));
    images.push(`/products/${file}`);
  }
  return prisma.product.upsert({
    where: { slug: p.slug },
    update: {},
    create: { ...p, images },
  });
}

async function main() {
  await mkdir(PUB, { recursive: true });

  const laptop = await upsertCategory("Laptop");
  const pcJadi = await upsertCategory("PC Jadi");
  const komponenDb = await upsertCategory("Komponen");

  const subCPU = await upsertCategory("Processor", komponenDb.id);
  const subGPU = await upsertCategory("Kartu Grafis", komponenDb.id);
  const subRAM = await upsertCategory("Memori RAM", komponenDb.id);
  const subSSD = await upsertCategory("Storage SSD", komponenDb.id);
  const subMobo = await upsertCategory("Motherboard", komponenDb.id);
  const subPSU = await upsertCategory("Power Supply", komponenDb.id);
  const subCase = await upsertCategory("Casing", komponenDb.id);
  const subCooling = await upsertCategory("Cooling", komponenDb.id);
  const subMonitor = await upsertCategory("Monitor", komponenDb.id);

  const products = [
    // Laptops
    {
      slug: "legion-pro-16irx9",
      name: "Lenovo Legion Pro 16 IRX9",
      brand: "Lenovo",
      price: 32999000,
      stock: 12,
      origin: Origin.IMPORTED,
      featured: true,
      isNew: true,
      discountPercent: 8,
      categoryId: laptop.id,
      description:
        "Laptop gaming performa tinggi dengan layar 2.5K 240Hz, CPU generasi terbaru, dan dukungan GPU RTX kelas menengah ke atas. Cocok untuk gaming berat, editing video, dan produktivitas profesional.",
      specs: {
        CPU: "Intel Core i9-14900HX",
        GPU: "NVIDIA GeForce RTX 4070 8GB GDDR6",
        RAM: "32GB DDR5 5600MHz",
        Storage: "1TB NVMe PCIe Gen4 SSD",
        Display: "16\" 2560x1600 IPS 240Hz 500 nits",
        Baterai: "99.99Wh",
        Berat: "2.6 kg",
      },
    },
    {
      slug: "thinkpad-x1-carbon-gen-12",
      name: "Lenovo ThinkPad X1 Carbon Gen 12",
      brand: "Lenovo",
      price: 28999000,
      stock: 8,
      origin: Origin.IMPORTED,
      featured: true,
      isNew: true,
      discountPercent: 5,
      categoryId: laptop.id,
      description:
        "Ultrabook kelas bisnis premium dengan bodi karbon ringan, layar OLED 2.8K, dan keyboard legendaris ThinkPad. Ideal untuk profesional yang mobilitas tinggi.",
      specs: {
        CPU: "Intel Core Ultra 7 155U",
        GPU: "Intel Arc Graphics",
        RAM: "32GB LPDDR5x 7467MHz",
        Storage: "1TB NVMe Gen4 SSD",
        Display: "14\" OLED 2880x1800 120Hz",
        Baterai: "57Wh",
        Berat: "1.09 kg",
      },
    },
    {
      slug: "macbook-air-m3-13",
      name: "Apple MacBook Air M3 13\"",
      brand: "Apple",
      price: 21999000,
      stock: 15,
      origin: Origin.IMPORTED,
      featured: true,
      discountPercent: 0,
      categoryId: laptop.id,
      description:
        "Laptop tipis dan senyap dengan chip Apple M3, efisien untuk kerja sehari-hari, editing ringan, dan baterai super awet. Tersedia warna Midnight & Starlight.",
      specs: {
        CPU: "Apple M3 (8-core CPU)",
        GPU: "Apple M3 (10-core GPU)",
        RAM: "16GB Unified Memory",
        Storage: "512GB SSD",
        Display: "13.6\" Liquid Retina 2560x1664",
        Baterai: "18 jam (video playback)",
        Berat: "1.24 kg",
      },
    },
    {
      slug: "asus-vivobook-go-15",
      name: "ASUS Vivobook Go 15 OLED",
      brand: "ASUS",
      price: 8999000,
      stock: 24,
      origin: Origin.LOCAL,
      isNew: true,
      discountPercent: 10,
      categoryId: laptop.id,
      description:
        "Laptop sehari-hari dengan layar OLED 15.6\" FHD dan bobot ringan. Ideal untuk mahasiswa, pekerja kantoran, dan hiburan. Harga bersahabat dengan performa cukup.",
      specs: {
        CPU: "AMD Ryzen 5 7520U",
        GPU: "AMD Radeon 610M",
        RAM: "16GB LPDDR5",
        Storage: "512GB NVMe SSD",
        Display: "15.6\" OLED FHD 1920x1080",
        Baterai: "42Wh",
        Berat: "1.4 kg",
      },
    },
    // PC Jadi
    {
      slug: "creator-pc-rtx-4060",
      name: "PC Creator Radeon RTX 4060",
      brand: "TokoKomputer",
      price: 17999000,
      stock: 6,
      origin: Origin.LOCAL,
      featured: true,
      discountPercent: 0,
      categoryId: pcJadi.id,
      description:
        "PC rakitan siap pakai untuk kreator konten dan multitasking berat. Dilengkapi prosesor 8-core, kartu grafis RTX 4060, dan storage NVMe super cepat. Garansi toko 3 tahun.",
      specs: {
        CPU: "AMD Ryzen 7 7700",
        GPU: "NVIDIA RTX 4060 8GB",
        RAM: "32GB DDR5 6000MHz",
        Storage: "1TB NVMe Gen4 SSD",
        PSU: "650W 80+ Bronze",
        OS: "Windows 11 Home 64-bit",
      },
    },
    {
      slug: "esports-pc-r5-7500f",
      name: "PC Esports Ryzen 5 7500F",
      brand: "TokoKomputer",
      price: 10999000,
      stock: 9,
      origin: Origin.LOCAL,
      isNew: true,
      discountPercent: 7,
      categoryId: pcJadi.id,
      description:
        "PC giáming esports dengan frame rate tinggi untuk game populer. Kompak, efisien, dan mudah diupgrade. Cocok untuk kompetisi dan streaming pemula.",
      specs: {
        CPU: "AMD Ryzen 5 7500F",
        GPU: "NVIDIA RTX 4060 8GB",
        RAM: "16GB DDR5 5200MHz",
        Storage: "500GB NVMe Gen4 SSD",
        PSU: "550W 80+ Bronze",
        OS: "Windows 11 Home 64-bit",
      },
    },
    // Components
    {
      slug: "core-i7-14700k",
      name: "Intel Core i7-14700K",
      brand: "Intel",
      price: 7355000,
      stock: 20,
      origin: Origin.IMPORTED,
      featured: true,
      discountPercent: 5,
      categoryId: subCPU.id,
      description:
        "Prosesor flagship kelas mainstream dengan 20 core (8P+12E). Performa single-thread terbaik untuk gaming dan daya multi-core bertenaga untuk produksi.",
      specs: {
        Core: "8 P-core + 12 E-core (20 core / 28 threads)",
        Clock: "3.4 GHz base / 5.6 GHz turbo",
        TDP: "125W (253W MTP)",
        Socket: "LGA 1700",
        Cache: "33MB Intel Smart Cache",
        Memori: "DDR4/DDR5 up to 5600MT/s",
      },
    },
    {
      slug: "ryzen-7-7800x3d",
      name: "AMD Ryzen 7 7800X3D",
      brand: "AMD",
      price: 7350000,
      stock: 18,
      origin: Origin.IMPORTED,
      featured: false,
      discountPercent: 0,
      categoryId: subCPU.id,
      description:
        "Prosesor gaming terbaik di kelasnya berkat teknologi 3D V-Cache. Efisien dan cepat, menjadi pilihan utama perakit PC gaming premium.",
      specs: {
        Core: "8 core / 16 threads Zen 4",
        Clock: "4.2 GHz base / 5.0 GHz boost",
        TDP: "120W",
        Socket: "AM5",
        Cache: "96MB L3 (3D V-Cache)",
        Memori: "DDR5 up to 5200MT/s",
      },
    },
    {
      slug: "rtx-4070-super-12gb",
      name: "NVIDIA GeForce RTX 4070 SUPER 12GB",
      brand: "NVIDIA",
      price: 12490000,
      stock: 14,
      origin: Origin.IMPORTED,
      featured: true,
      isNew: true,
      discountPercent: 0,
      categoryId: subGPU.id,
      description:
        "Kartu grafis 1440p ideal dengan ray tracing penuh dan DLSS 3.5. Performa kelas atas dengan konsumsi daya efisien untuk gaming dan rendering.",
      specs: {
        GPU: "AD104-350",
        VRAM: "12GB GDDR6X 192-bit",
        Boost: "2475 MHz",
        TDP: "220W",
        Bus: "PCIe 4.0 x16",
        Output: "3x DisplayPort 1.4a, 1x HDMI 2.1",
      },
    },
    {
      slug: "ryzen-5-7500f-barebone",
      name: "AMD Ryzen 5 7500F 6-Core",
      brand: "AMD",
      price: 2599000,
      stock: 30,
      origin: Origin.IMPORTED,
      isNew: true,
      discountPercent: 0,
      categoryId: subCPU.id,
      description:
        "Prosesor value terbaik platform AM5 tanpa iGPU. Hemat kekuatan sinyal, ideal dipasangkan dengan kartu grafis dedicated untuk PC gaming.",
      specs: {
        Core: "6 core / 12 threads Zen 4",
        Clock: "3.7 GHz base / 5.0 GHz boost",
        TDP: "65W",
        Socket: "AM5",
        Cache: "32MB L3",
        Memori: "DDR5 up to 5200MT/s",
      },
    },
    {
      slug: "trident-z5-rgb-32gb",
      name: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000",
      brand: "G.Skill",
      price: 2750000,
      stock: 40,
      origin: Origin.IMPORTED,
      featured: false,
      discountPercent: 10,
      categoryId: subRAM.id,
      description:
        "Kit RAM DDR5 dengan timing ketat dan heatsink RGB premium. Dioptimalkan untuk platform Intel & AMD modern, cocok untuk gaming dan OC.",
      specs: {
        Kapasitas: "32GB (2x16GB)",
        Tipe: "DDR5-6000 (PC5-48000)",
        Timing: "C36-36-36-96",
        Voltage: "1.35V",
        RGB: "Ya, controllable",
        Kompatibilitas: "Intel XMP 3.0 / AMD EXPO",
      },
    },
    {
      slug: "980-pro-1tb",
      name: "Samsung 980 PRO 1TB NVMe Gen4",
      brand: "Samsung",
      price: 1899000,
      stock: 60,
      origin: Origin.IMPORTED,
      featured: true,
      discountPercent: 12,
      categoryId: subSSD.id,
      description:
        "SSD NVMe Gen4 flagship dengan kecepatan baca hingga 7.000MB/s. Percepat boot, loading game, dan transfer file besar dalam sekejap.",
      specs: {
        Kapasitas: "1TB",
        Interface: "PCIe 4.0 NVMe M.2",
        Read: "7,000 MB/s",
        Write: "5,000 MB/s",
        TBW: "600TB",
        Garansi: "5 tahun",
      },
    },
    {
      slug: "rog-strix-b760-f",
      name: "ASUS ROG Strix B760-F Gaming WiFi",
      brand: "ASUS",
      price: 3899000,
      stock: 16,
      origin: Origin.IMPORTED,
      isNew: true,
      discountPercent: 0,
      categoryId: subMobo.id,
      description:
        "Motherboard ATX LGA1700 dengan VRM kelas ROG, WiFi 6E, dan port I/O lengkap. Basis solid untuk PC gaming dan creator berbasis CPU generasi 12/13/14.",
      specs: {
        Socket: "LGA 1700",
        Chipset: "Intel B760",
        Memori: "4x DDR5 up to 7200+ (OC)",
        "M.2": "3x PCIe 4.0",
        LAN: "2.5GbE Realtek",
        WiFi: "WiFi 6E + Bluetooth 5.3",
      },
    },
    {
      slug: "pure-power-12m-750w",
      name: "be quiet! Pure Power 12 M 750W",
      brand: "be quiet!",
      price: 2099000,
      stock: 22,
      origin: Origin.IMPORTED,
      discountPercent: 0,
      categoryId: subPSU.id,
      description:
        "Power supply ATX 3.0 modular 80+ Gold dengan kabel native 12VHPWR. Senyap, stabil, dan siap mendukung kartu grafis generasi terbaru.",
      specs: {
        Wattage: "750W",
        Sertifikasi: "80+ Gold",
        Konektor: "ATX 3.0 / PCIe 5.0 12VHPWR",
        Modulasi: "Fully modular",
        Fan: "120mm be quiet!",
        Garansi: "10 tahun",
      },
    },
    {
      slug: "nzxt-h5-flow-rgb",
      name: "NZXT H5 Flow RGB (Black)",
      brand: "NZXT",
      price: 1599000,
      stock: 19,
      origin: Origin.IMPORTED,
      isNew: true,
      discountPercent: 10,
      categoryId: subCase.id,
      description:
        "Casing mid-tower airflow tinggi dengan 2 fan RGB 140mm bawaan dan panel kaca tempered. Total airflow untuk menjaga komponen tetap adem.",
      specs: {
        Tipe: "Mid Tower ATX",
        "Fan Bawaan": "2x 140mm RGB",
        Radiator: "Up to 280mm (front)",
        "Clearance GPU": "365mm",
        "Clearance CPU Cooler": "165mm",
        Kaca: "Tempered glass side panel",
      },
    },
    {
      slug: "kraken-elite-240",
      name: "NZXT Kraken Elite 240 RGB",
      brand: "NZXT",
      price: 3899000,
      stock: 10,
      origin: Origin.IMPORTED,
      featured: false,
      discountPercent: 0,
      categoryId: subCooling.id,
      description:
        "Liquid cooler AIO 240mm dengan LCD 2.36\" yang bisa menampilkan statistik, gambar, atau animasi. Solusi pendinginan premium dengan derau minimal.",
      specs: {
        Ukuran: "240mm radiator",
        LCD: "2.36\" 320x320",
        Fan: "2x F120 RGB 120mm",
        Pump: "Asetek 7th gen",
        Socket: "Intel & AMD 5",
        Derau: "21.9 dB(A) max",
      },
    },
    {
      slug: "proart-pa279cv",
      name: "ASUS ProArt PA279CV 27\" 4K",
      brand: "ASUS",
      price: 7999000,
      stock: 7,
      origin: Origin.IMPORTED,
      featured: true,
      discountPercent: 8,
      categoryId: subMonitor.id,
      description:
        "Monitor 4K UHD 27\" dengan warna akurat (100% sRGB / Rec.709) untuk editing foto dan video. Port USB-C PD 65W untuk satu kabel bersih.",
      specs: {
        Panel: "27\" IPS 4K 3840x2160",
        Refresh: "60Hz",
        Color: "100% sRGB, 100% Rec.709",
        "USB-C": "PD 65W",
        Ergonomis: "Rotate, pivot, height adjust",
        Garansi: "3 tahun (1 tahun zero dead pixel)",
      },
    },
  ];

  for (const [i, p] of products.entries()) {
    await upsertProduct(p, i);
  }

  const adminEmail = "admin@tokokomputer.id";
  const passwordHash = await bcrypt.hash("Admin#1234", 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin TokoKomputer",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const demoEmail = "demo@tokokomputer.id";
  await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo User",
      role: Role.USER,
      passwordHash: await bcrypt.hash("Demo#1234", 12),
    },
  });

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    users: await prisma.user.count(),
  };
  console.log("Seed berhasil:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());