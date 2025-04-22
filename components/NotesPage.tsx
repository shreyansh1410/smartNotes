"use client";
import { useAuth } from "../lib/authProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

export default function NotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, content, summary, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Add note
  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("notes").insert({
        user_id: user?.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      setNoteContent("");
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
    },
  });

  // Edit note
  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { error } = await supabase
        .from("notes")
        .update({ content })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      setEditingId(null);
      setEditContent("");
    },
  });

  // Summarize note
  const summarizeNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      setSummarizingId(id);
      // Replace with your DeepSeek or Groq API call
      const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
      const response = await axios.post(
        "https://api.deepseek.com/summarize", // Replace with actual endpoint
        { text: content },
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );
      const summary = response.data.summary;
      const { error } = await supabase
        .from("notes")
        .update({ summary })
        .eq("id", id);
      if (error) throw error;
      setSummarizingId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Your Notes</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          addNote.mutate(noteContent);
        }}
        className="flex gap-2 mb-8"
      >
        <Input
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Write a new note..."
          required
        />
        <Button type="submit" disabled={addNote.isPending}>
          Add
        </Button>
      </form>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-4">
          {notes?.map((note: any) => (
            <li key={note.id} className="border p-4 rounded-lg bg-background">
              {editingId === note.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    updateNote.mutate({ id: note.id, content: editContent });
                  }}
                >
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updateNote.isPending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-2 whitespace-pre-wrap">{note.content}</div>
                  {note.summary && (
                    <div className="p-2 bg-muted text-muted-foreground rounded mb-2">
                      <strong>Summary:</strong> {note.summary}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteNote.mutate(note.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => summarizeNote.mutate({ id: note.id, content: note.content })}
                      disabled={summarizingId === note.id}
                    >
                      {summarizingId === note.id ? "Summarizing..." : "Summarize"}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
