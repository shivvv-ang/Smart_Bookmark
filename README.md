
# 📎 BookMark

A minimal, real-time bookmark manager built with Next.js and Supabase.

## Features

- 🔐 Google OAuth login
- 📌 Add and delete bookmarks
- ⚡ Real-time sync across tabs
- 🔄 Auth state sync — login/logout reflects instantly on all open tabs

## Tech Stack

- **Next.js** (App Router)
- **Supabase** (Auth + Database + Realtime)
- **Tailwind CSS**

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/bookmark.git
cd markdrop
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Supabase

Create a `bookmarks` table with the following columns:

| Column | Type |
|--------|------|
| id | uuid (primary key) |
| user_id | uuid |
| title | text |
| url | text |
| created_at | timestamp |

Enable **Realtime** on the `bookmarks` table.

Add the following **RLS policies**:

```sql
-- Allow users to read their own bookmarks
CREATE POLICY "Users can read their own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Run locally

```bash
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel → Settings → Environment Variables
4. Deploy

After deploying, update in **Supabase → Authentication → Settings**:
- **Site URL** → `https://yourapp.vercel.app`
- **Redirect URLs** → `https://yourapp.vercel.app/auth/callback`

