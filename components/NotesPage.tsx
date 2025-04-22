"use client";
import { useAuth } from "../lib/authProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

  const { data: notes, isLoading } = useQuery({
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
        console.log("Attempting to insert note:", { 
          user_id: user.id, 
          title, 
          content 
        });
        
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
      } catch (err: any) {
        console.error("Error details:", err);
        
        if (!errorMessage) {
          setErrorMessage(err.message || "Failed to add note. Please try again.");
        }
        
        throw err;
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
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Your Notes</h1>
      
      {!user && (
        <div className="text-amber-600 p-4 bg-amber-50 border border-amber-200 rounded mb-4">
          Please log in to manage your notes.
        </div>
      )}
      
      <form
        onSubmit={e => {
          e.preventDefault();
          addNote.mutate({ title: noteTitle, content: noteContent });
        }}
        className="flex flex-col gap-2 mb-8"
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
        <Button 
          type="submit" 
          disabled={addNote.isPending || !user} 
          className="self-start"
        >
          {addNote.isPending ? "Adding..." : "Add Note"}
        </Button>
        {errorMessage && (
          <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
            {errorMessage}
          </div>
        )}
      </form>
      
      {isLoading ? (
        <div>Loading notes...</div>
      ) : notes && notes.length > 0 ? (
        <ul className="space-y-4">
          {notes.map((note: any) => (
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
                  <div className="mb-4 whitespace-pre-wrap">{note.content}</div>
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
      ) : (
        <div className="text-center py-6 text-gray-500">
          No notes yet. Add your first note above!
        </div>
      )}
    </div>
  );
}