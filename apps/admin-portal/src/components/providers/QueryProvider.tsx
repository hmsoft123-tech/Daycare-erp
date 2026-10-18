"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "@/lib/query-client";

/** React Query only — for layouts outside the tenant shell (AppProviders sets up the rest). */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createAppQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
