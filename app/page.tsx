"use client";
import RequireAuth from "@/components/RequireAuth";
import NotesPage from "@/components/NotesPage";

export default function Home() {
  return (
    <RequireAuth>
      <NotesPage />
    </RequireAuth>
  );
}
