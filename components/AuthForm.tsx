"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid email address.");
      return;
    }
    if (mode === "signup" && !firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { firstName } }
        });
        if (signupError) {
          const msg = signupError.message.toLowerCase();
          if (msg.includes("already registered") || msg.includes("already exists")) {
            setError("You already have an account. Please sign in.");
            return;
          }
          throw signupError;
        }
        setSuccessMessage("Signup successful! Please check your email to confirm your account.");
        return;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: "google",
      options: {
        redirectTo: redirectTo
      }
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="max-w-sm w-full mx-auto p-6 rounded-lg border bg-background">
      <h1 className="text-3xl font-bold text-center mb-4">SmartNotes</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <Input
            placeholder="First Name"
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
        )}
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {successMessage && <div className="text-green-600 text-sm mt-2">{successMessage}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
        </Button>
        <Button type="button" className="w-full" variant="outline" onClick={handleGoogle}>
          Continue with Google
        </Button>
      </form>
      <div className="text-center mt-4">
        <button
          className="text-blue-600 hover:underline text-sm"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
