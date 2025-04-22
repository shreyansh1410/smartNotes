"use client";
import { useAuth } from "../lib/authProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Types for notes
type Note = { id: string; title: string; content: string; summary: string | null; created_at: string; };

export default function NotesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: notes = [], isLoading } = useQuery<Note[], Error>({
    queryKey: ["notes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("id, title, content, summary, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Supabase query error:", error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const addNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      setErrorMessage(null);
      
      if (!user?.id) {
        const authError = new Error("User not authenticated");
        console.error(authError);
        setErrorMessage("You must be logged in to add notes.");
        throw authError;
      }
      
      try {        
        const { data, error } = await supabase
          .from("notes")
          .insert([{
            user_id: user.id,
            title,
            content,
          }])
          .select();
        
        if (error) {
          console.error("Supabase error adding note:", error);
          
          if (error.code === "23505") {
            setErrorMessage("This note title already exists. Please use a different title.");
          } else if (error.code === "42501" || error.message.includes("permission denied")) {
            setErrorMessage("Permission denied. Check your database policies.");
          } else {
            setErrorMessage(`Error adding note: ${error.message}`);
          }
          
          throw error;
        }
        
        return data;
      } catch (error: unknown) {
        console.error("Error details:", error);
        
        const message = error instanceof Error ? error.message : String(error);
        if (!errorMessage) {
          setErrorMessage(message || "Failed to add note. Please try again.");
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      setNoteTitle("");
      setNoteContent("");
      setErrorMessage(null);
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id);
        
      if (error) {
        console.error("Error deleting note:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from("notes")
        .update({ title, content })
        .eq("id", id);
        
      if (error) {
        console.error("Error updating note:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
      setEditingId(null);
      setEditTitle("");
      setEditContent("");
    },
  });

 const summarizeNote = useMutation({
  mutationFn: async ({ id, content }: { id: string; content: string }) => {
    try {
      setSummarizingId(id);
    
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize note');
      }
      
      const data = await response.json();
      const summary = data.summary;
      const { error } = await supabase
        .from("notes")
        .update({ summary })
        .eq("id", id);
        
      if (error) {
        console.error("Error updating note with summary:", error);
        throw error;
      }
      
      return summary;
    } catch (err) {
      console.error("Error summarizing note:", err);
      throw err;
    } finally {
      setSummarizingId(null);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["notes", user?.id] });
  },
});

  return (
    <div className="max-w-6xl mx-auto py-10">
      {!user && (
        <div className="text-amber-600 p-4 bg-amber-50 border border-amber-200 rounded mb-4">
          Please log in to manage your notes.
        </div>
      )}
      {notes.length > 0 && (
        <>
          {user && (
            <h2 className="text-center text-xl mb-4">
              Hello, {user.user_metadata?.firstName ?? user.email}
            </h2>
          )}
          <h1 className="text-2xl font-bold mb-6 ml-10">Your Notes</h1>
        </>
      )}
      
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <form
              onSubmit={e => {
                e.preventDefault();
                addNote.mutate({ title: noteTitle, content: noteContent });
                setShowForm(false);
              }}
              className="flex flex-col gap-4"
            >
              <Input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Title"
                required
                className="mb-2"
              />
              <Textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Write a new note..."
                required
                className="mb-2 min-h-32"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={addNote.isPending || !user}
                >
                  {addNote.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
              {errorMessage && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  {errorMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div>Loading notes...</div>
      ) : notes.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mx-10 min-w-32">
          {notes.map((note: Note) => (
            <li key={note.id} className="border p-4 rounded-lg bg-background">
              {editingId === note.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    updateNote.mutate({ id: note.id, title: editTitle, content: editContent });
                  }}
                >
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Title"
                    required
                  />
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="min-h-24"
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
                  <h3 className="text-lg font-bold mb-2">{note.title}</h3>
                  {note.summary && (
                    <>
                      <h4 className="font-semibold mb-1">Summary</h4>
                      <div className="mb-4 whitespace-pre-wrap bg-gray-50 p-2 rounded">{note.summary}</div>
                    </>
                  )}
                  <h4 className="font-semibold mb-1">Content</h4>
                  <div className={`mb-4 whitespace-pre-wrap ${expandedId === note.id ? '' : 'max-h-40 overflow-hidden'}`}>{note.content}</div>
                  {expandedId !== note.id ? (
                    <button onClick={() => setExpandedId(note.id)} className="text-blue-500 text-sm mb-2">
                      Read More
                    </button>
                  ) : (
                    <button onClick={() => setExpandedId(null)} className="text-blue-500 text-sm mb-2">
                      Show Less
                    </button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditTitle(note.title);
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
      ) : null}
      <button onClick={() => setShowForm(true)} className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}