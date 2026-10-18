"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      toastOptions={{
        classNames: {
          toast: "!bg-surface !border !border-line !text-zinc-100 !rounded-xl",
        },
      }}
      position="top-center"
      richColors
    />
  );
}