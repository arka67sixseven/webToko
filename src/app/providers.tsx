"use client";

import { createContext, useContext, type ReactNode } from "react";
import { TRPCProvider } from "@/trpc/provider";
import { api } from "@/trpc/react";
import type { SessionUser } from "@/server/auth";

const SessionContext = createContext<{
  session: SessionUser | null;
  pending: boolean;
}>({ session: null, pending: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isFetching } = api.auth.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  return (
    <SessionContext.Provider value={{ session: session ?? null, pending: isFetching }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>{children}</AuthProvider>
    </TRPCProvider>
  );
}