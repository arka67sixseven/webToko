"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useSession } from "@/app/providers";
import { Button, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ReviewForm({ productSlug }: { productSlug: string }) {
  const { session } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const utils = api.useUtils();

  const submit = api.catalog.addReview.useMutation({
    onSuccess: () => {
      toast.success("Ulasan terkirim. Terima kasih!");
      setRating(0);
      setTitle("");
      setBody("");
      utils.catalog.bySlug.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!session) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating < 1) {
          toast.error("Pilih rating bintang dulu");
          return;
        }
        submit.mutate({ productSlug, rating, title, body });
      }}
      className="space-y-4 rounded-xl border border-line bg-surface p-5"
    >
      <h3 className="text-sm font-semibold text-zinc-100">Tulis Ulasan</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} bintang`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                (hover || rating) >= i ? "fill-amber-400 text-amber-400" : "text-zinc-600",
              )}
            />
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-zinc-400">{rating}/5</span>}
      </div>
      <Field label="Judul (opsional)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bagus banget!"
          maxLength={100}
          className={inputClass}
        />
      </Field>
      <Field label="Ulasan">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ceritakan pengalaman menggunakan produk ini..."
          rows={4}
          maxLength={2000}
          required
          className={cn(inputClass, "resize-none")}
        />
      </Field>
      <Button type="submit" loading={submit.isPending} disabled={body.trim().length < 10}>
        Kirim Ulasan
      </Button>
    </form>
  );
}