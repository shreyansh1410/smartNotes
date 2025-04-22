"use client";
import { useAuth } from "../lib/authProvider";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <header className="px-4 py-2 border-b flex justify-between items-center">
      <h1 className="text-xl font-bold">SmartNotes</h1>
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
