# Beyond Hangeul

A complete Korean Language Learning Web App starter built with:

- Next.js App Router
- Tailwind CSS
- Supabase Auth, Database, and Storage-ready architecture

## Features

- Authentication with Supabase (register and login)
- 3-step registration flow with OTP email verification
- Role-based access control (`admin` and `user`)
- Protected routes via middleware
- User dashboard and profile
- Lessons list and lesson detail pages
- Vocabulary management per lesson
- Progress tracking with completion and score
- Admin dashboard for lesson CRUD and user visibility

## Required Pages

Implemented routes:

- `/` (Landing page)
- `/auth/login`
- `/auth/register`
- `/auth/BHadmin24` (hidden admin login)
- `/dashboard`
- `/admin`
- `/lessons`
- `/lessons/[id]`
- `/profile`

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=wsaz bscr ricf vswe
SMTP_FROM=Beyond Hangeul <your-gmail-address@gmail.com>
```

3. In Supabase SQL Editor, run the schema in `supabase/schema.sql`.

4. Start the app:

```bash
npm run dev
```

## Supabase SQL

- Full schema with all required tables is in `supabase/schema.sql`:
	- `profiles`
	- `lessons`
	- `vocabulary`
	- `progress`
- Includes:
	- RLS enabled on all tables
	- Policies for admin full access
	- Policies for users to read lessons and manage only their own progress
	- Auto profile creation trigger after signup

## Supabase Client + Auth Helpers

- Browser client: `lib/supabaseClient.js`
- Server client: `lib/supabaseServer.js`
- Server auth helpers: `lib/auth.js`
- Example query helpers: `lib/queries.js`

## Example Queries

Fetch lessons (server side):

```js
import { fetchLessons } from "@/lib/queries";

const lessons = await fetchLessons();
```

Insert/update progress (server side):

```js
import { insertOrUpdateProgress } from "@/lib/queries";

await insertOrUpdateProgress({
	userId,
	lessonId,
	completed: true,
	score: 92,
});
```

## Notes

- The admin role is enforced by RLS and middleware route checks.
- Hidden admin login URL: `/auth/BHadmin24`
- Fixed admin login credentials on that page:
	- Username: admin01
	- Password: BHadmin@24
- Supabase auth still requires an email for sign-in. This project maps the fixed admin login to:
	- Email: admin01@beyond-hangeul.local
- To promote a user to admin, update their role in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```
