# AppHub

A simple, clean app catalog where students create an account, publish a mobile app, and share it so classmates can install it.

## Features

- Email/password registration and login with secure, httpOnly session cookies
- Publish apps instantly — no approval queue — with Android APK upload, iOS IPA upload, or an install link (TestFlight / App Store / Play Store)
- App icon, screenshots, description, category, version, and package name
- Public catalog with search, category/platform filters, and sorting
- App detail pages with install button, QR code, and download counter
- Personal dashboard to edit or remove your own apps
- Files stored in S3-compatible object storage; metadata stored in Postgres

## Tech stack

| Layer | Technology |
| --- | --- |
| UI + API | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Neon Postgres (`pg`) |
| Auth | Custom sessions with `jose` + `bcryptjs` |
| File storage | Neon Object Storage (S3-compatible) |
| Icons / QR | `lucide-react`, `qrcode` |
| Hosting | Vercel (recommended) |

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.example`. You need:

- `DATABASE_URL` — pooled Neon Postgres connection string
- `SESSION_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `AWS_REGION`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` — Neon Object Storage credentials

The bucket must allow public reads (`public_read`) so downloads work without credentials, and must allow CORS `PUT`/`GET`/`HEAD` so the browser can upload directly to it. Run:

```bash
node --env-file=.env.local scripts/setup-storage.mjs
```

Direct-to-storage uploads keep large APKs out of your serverless function; Vercel's request body limit would otherwise reject big files.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Add the environment variables above under **Settings → Environment Variables**.
4. Deploy. Vercel builds with `npm run build` automatically.
5. Optional: add a custom domain under **Settings → Domains** so students can find it easily.

Every push to `main` redeploys. Neon and Vercel both have free tiers that easily cover a class-sized catalog.

## A note on installs

- **Android:** the app downloads an `.apk`. Android asks the user once to allow installs from unknown sources — this is normal and unavoidable outside the Play Store.
- **iOS:** Apple does not allow sideloading in the normal case. Use a TestFlight or App Store link (the "Use a link" option). An uploaded `.ipa` is stored and downloadable, but installing it still requires Apple signing or a distribution profile.

## Project structure

```
src/app/            pages and API route handlers
src/components/     UI components
src/lib/            database, auth, storage, types, formatting
scripts/            one-time storage CORS setup
```
