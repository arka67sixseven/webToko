import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="bg-gradient-to-r from-brand to-cyan-300 bg-clip-text text-7xl font-black text-transparent">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Halaman yang kamu cari sudah dipindah atau tidak ada lagi.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-brand px-6 font-semibold text-zinc-950 hover:bg-lime-300"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}