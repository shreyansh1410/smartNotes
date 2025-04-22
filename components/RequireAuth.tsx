"use client";
import { useAuth } from "../lib/authProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);
  if (loading || !user) return <div className="text-center mt-20">Loading...</div>;
  return <>{children}</>;
}
