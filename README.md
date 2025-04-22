# SmartNotes

SmartNotes is a personal note-taking and AI-powered summarization app built with Next.js 15, Supabase, and Google Gemini AI. It lets authenticated users create, edit, delete, and summarize notes with a title and body.

## Features

- Email/password and Google OAuth authentication via Supabase
- Create, edit, and delete notes (title + content)
- AI-powered summarization using Google Gemini Generative AI
- Client and Server Components separation (Next.js App Router)
- Optimistic updates and caching with TanStack React Query
- Responsive UI with Tailwind CSS and shadcn/ui components

## Tech Stack

- Next.js 15 (App Router)
- React 19 & TypeScript
- Supabase (Auth & Postgres)
- Google Generative AI (Gemini 2.0 Flash)
- TanStack React Query
- Tailwind CSS, clsx, tailwind-merge

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project with Auth enabled and a `notes` table
- Google Cloud OAuth credentials (for Google sign-in)
- Google Generative AI API key (Gemini)

### Installation

```bash
git clone <repo-url>
cd smartnotes
npm install
```

### Environment Variables

Create a `.env.local` in the project root with:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
GEMINI_API_KEY=<your-google-gemini-api-key>
```

### Database Schema

Ensure your Supabase `notes` table has columns:

- `id`: uuid, primary key, default `uuid_generate_v4()`
- `user_id`: uuid, foreign key to `auth.users`
- `title`: text
- `content`: text
- `summary`: text (nullable)
- `created_at`: timestamp, default `now()`

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Route

- `POST /api/summarize` — Summarizes note content via Google Generative AI.

## Project Structure

```text
smartnotes/
├─ app/
│  ├─ api/summarize/route.ts   # AI summarization endpoint
│  ├─ layout.tsx               # Root layout (wraps client providers)
│  ├─ page.tsx                 # Home (protected NotesPage)
│  └─ globals.css
├─ components/
│  ├─ ClientProviders.tsx      # Client Component wrapper for QueryClient & Auth
│  ├─ AuthForm.tsx             # Login/signup form
│  ├─ RequireAuth.tsx          # Route protection
│  └─ NotesPage.tsx            # Main notes UI
├─ lib/
│  ├─ supabaseClient.ts        # Supabase client
│  ├─ reactQueryClient.ts      # React Query client config
│  └─ authProvider.tsx         # Auth context/provider
├─ .env.local                  # Environment variables
├─ package.json
├─ tsconfig.json
└─ tailwind.config.js
```

## Scripts

- `npm run dev` — Runs dev server
- `npm run build` — Builds for production
- `npm run start` — Starts production server
- `npm run lint` — Runs ESLint
