# AppHub

A clean, production-ready app catalog for a class: students create an account, verify their email, publish a mobile app, and share it so classmates can find and install it.

**Developed by @kmabro.**

---

## Features

### For students
- Register with **email verification** (Resend) and sign in securely
- **Forgot password** flow with a one-hour reset link
- Resend a verification email if it never arrives
- Publish an app instantly — name, category, platform, description
- Upload an **APK/IPA** or provide an install link (Google Drive, TestFlight, App Store…)
- Add an **app icon** and **screenshots**, with a built-in **crop tool** to choose the visible area
- See a live **circular upload-progress indicator** with a percentage
- Edit your apps, replace files, bump the version, remove/replace images, and delete apps
- Browse the catalog with search, category/platform filters, and sorting
- Install via a button or a **scannable QR code**, with a real filename like `SkillSwap.apk`

### Built in
- Secure httpOnly JWT sessions, bcrypt password hashing, server-side ownership checks
- Neon Postgres for metadata and Neon Object Storage (S3-compatible) for files
- Files upload directly from the browser via presigned URLs — large APKs never hit the server
- Old files are removed from storage when replaced or when an app is deleted
- Staggered animations, smooth transitions, responsive layouts, reduced-motion support
- Loading and error boundaries, security headers, SEO robots/sitemap, production metadata

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, custom design tokens and motion utilities |
| Database | Neon Postgres (`pg`) |
| Files | Neon Object Storage via AWS SDK + presigned URLs |
| Auth | Custom sessions with `jose` + `bcryptjs`; `react-easy-crop` for image cropping |
| Email | Resend REST API |
| Hosting | Vercel (recommended) |

---

## Project structure

```
public/
  apphub-icon.png          site favicon and brand mark
scripts/
  e2e-test.mjs             smoke test for a running local server
  setup-storage.mjs        one-time CORS setup for the storage bucket
src/app/
  api/auth/                register, login, logout, verify, forgot/reset password, resend verification
  api/apps/                create, edit, delete apps
  api/download/[id]/       download counter + presigned file URL with real filename
  api/upload-url/          presigned upload URLs
  apps/[id]/               app detail and edit pages
  apps/new/                publish form
  dashboard/               user's own apps
  login, register, forgot-password, reset-password, resend-verification
  globals.css              design system, animations, utilities
  layout.tsx / template.tsx / loading.tsx / error.tsx
  robots.ts / sitemap.ts
src/components/            header, footer, cards, forms, cropper, QR, progress, filters
src/lib/                   db, auth, auth-tokens, email, storage, crop, validation, formatting, types
```

---

## Run locally

```bash
npm install
cp .env.example .env.local    # fill in the values
npm run dev
```

Open http://localhost:3000.

Useful commands:

```bash
npm run lint      # ESLint
npm run build     # production build
npm run start     # serve the production build
node scripts/e2e-test.mjs   # smoke test against a running server
```

---

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres pooled connection string |
| `SESSION_SECRET` | Long random string used to sign session cookies |
| `AWS_REGION` | Storage region (`us-east-2`) |
| `AWS_ENDPOINT_URL_S3` | Branch storage endpoint |
| `AWS_ACCESS_KEY_ID` | Scoped credential token ID |
| `AWS_SECRET_ACCESS_KEY` | Scoped credential S3 secret |
| `S3_BUCKET` | Bucket name (`apphub`) |
| `RESEND_API_KEY` | Resend API key for verification/reset emails |
| `EMAIL_FROM` | Verified sender, e.g. `AppHub <no-reply@yourdomain.com>` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used in QR codes, emails, robots, and sitemap |

The bucket must be `public_read` and allow `GET`, `HEAD`, `PUT` with any headers. Configure it once with:

```bash
node --env-file=.env.local scripts/setup-storage.mjs
```

### Resend notes
- On the free tier, `onboarding@resend.dev` can only send to the email address that owns the Resend account. Verify your own domain in Resend and set `EMAIL_FROM` to a sender on that domain before inviting classmates.
- If `RESEND_API_KEY` is missing, links are printed to the server console instead of emailed — useful for local testing.

---

## Auth flows

1. **Register** → account is created unverified → verification email sent → user clicks the link → `email_verified` is set → user signs in.
2. **Forgot password** → email → one-hour reset link → choose a new password → all reset tokens are invalidated.
3. **Resend verification** → available from the sign-in page if the first email is lost.

Verification and reset tokens are random 32-byte values stored only as SHA-256 hashes, expire after 24 hours and 1 hour respectively, and are single-use.

---

## Storage and limits

| Item | Current limit |
| --- | --- |
| Postgres branch | 1 GB logical size (free plan) |
| Object storage | 5 GB per project (free plan) |
| Single upload in this app | 200 MB |
| Object size in Neon | up to 5 GiB (10 GiB with multipart) |

APKs and images live in object storage, never in Postgres. The database only stores metadata and URLs. Deleting or replacing an app removes its old files from storage.

---

## Deploy to Vercel

1. Push this folder to GitHub:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin master
   ```
2. In Vercel, **Add New → Project** and import the repo.
3. Add every environment variable from `.env.local` under **Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (or custom domain).
4. Deploy. Vercel runs `npm run build` automatically; every push to `master` redeploys.
5. Optional: add a custom domain under **Settings → Domains** and update `NEXT_PUBLIC_SITE_URL` to match.

QR codes and email links use `NEXT_PUBLIC_SITE_URL`, so they work from any device. On `localhost` a phone cannot scan the QR code — deploy first for real testing.

---

## Install notes

- **Android:** downloads an `.apk` with the app's real name. Android asks once to allow installs from unknown sources.
- **iOS:** Apple does not allow normal sideloading. Use a TestFlight or App Store link. An uploaded `.ipa` is stored but still needs Apple signing.

---

## Credits

UI and development by **@kmabro**, built for our class.
