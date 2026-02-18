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

---

## Problems Faced & How We Solved Them

### 1. Delete button wasn't working visually

The delete API was returning `204 No Content` — meaning the row was being deleted from the database successfully — but the UI wasn't updating. The realtime subscription wasn't firing the DELETE event.

**Root cause:** We had a `filter: user_id=eq.${user.id}` on the realtime subscription. When Supabase sends a DELETE event, the payload only contains the `id` of the deleted row — `user_id` is not included. So the filter couldn't match and the event never reached the component.

**Fix:** Removed the filter from the realtime subscription and moved the `user_id` check into JavaScript for INSERT events. For DELETE, we match by `id` which is always present.

```js
// Before — filter on Supabase side (breaks DELETE events)
const channel = supabase
    .channel(bookmarks-realtime)
    .on(postgres_changes,
        {
            event: *,
            schema: public,
            table: bookmarks,
            filter: `user_id=eq.${user.id}`, // DELETE payload has no user_id, so this never fires
        },
        (payload) => {
            if (eventType === DELETE) {
                // never reaches here
            }
        }
    ).subscribe();

// After — remove filter, check user_id in JS instead
const channel = supabase
    .channel(bookmarks-realtime)
    .on(postgres_changes,
        {
            event: *,
            schema: public,
            table: bookmarks,
            // no filter
        },
        (payload) => {
            const { eventType, new: newRow, old: oldRow } = payload;

            if (eventType === INSERT && newRow.user_id === user.id) {
                setBookmarks((prev) => [newRow, ...prev]);
            }

            if (eventType === DELETE) {
                setBookmarks((prev) => prev.filter((b) => b.id !== oldRow.id));
            }
        }
    ).subscribe();
```

**Does removing the filter cause a security issue?** No. The `user_id` check in JS handles what shows in the UI, but the real security layer is the **RLS policy** on Supabase — even without the filter, a user can never read another user's bookmarks at the database level. The filter was just a performance optimization, not a security measure.

---

### 2. Auth state not syncing across tabs

Logging out in one tab didn't affect other open tabs. Similarly, logging in on one tab left other tabs stuck on the login screen.

**Fix:** Used Supabase's `onAuthStateChange` listener in both Dashboard and Login page to react to auth events across tabs.

```js
supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") router.push("/login");
    if (event === "SIGNED_IN") router.push("/dashboard");
});
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/bookmark.git
cd bookmark
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
CREATE POLICY "Users can read their own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Run locally

```bash
npm run dev
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel → Settings → Environment Variables
4. Deploy

After deploying, update in **Supabase → Authentication → Settings**:
- **Site URL** → `https://yourapp.vercel.app`
- **Redirect URLs** → `https://yourapp.vercel.app/auth/callback`
