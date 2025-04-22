"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/reactQueryClient";
import { AuthProvider } from "../lib/authProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
