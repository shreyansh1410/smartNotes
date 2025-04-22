"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/reactQueryClient";
import { AuthProvider } from "../lib/authProvider";
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFooter = pathname !== '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        {showFooter && <Footer />}
      </AuthProvider>
    </QueryClientProvider>
  );
}
