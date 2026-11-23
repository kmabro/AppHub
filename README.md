# AppHub

A clean, production-ready app marketplace for a class. Students verify their email, publish apps, manage releases, rate and review each other's work, and build public developer profiles. An administrator keeps control of the marketplace.

**Developed by @kmabro.**

---

## Features

### Students
- Register with **email verification** (Resend) and sign in securely
- **Forgot password** with a one-hour reset link; resend verification if needed
- Publish apps instantly — name, category, platform, description, version, release notes
- Upload an **APK/IPA** or an install link (Google Drive, TestFlight, App Store…)
- Add an **icon** and **screenshots** with a built-in **crop tool** for choosing the visible area
- Live **circular upload progress** with a percentage
- Edit apps, replace files, remove images, and delete apps
- **Version management**: a new upload creates a **pending release**; the published version stays live until an admin approves it
- **Version history** with release notes, latest-version marker, and downloads of previous versions
- **Public developer profiles** at `/developers/<username>` with picture, bio, app count, and downloads
- **Rate and review** apps (1–5 stars), edit/delete your own review, report inappropriate reviews
- Browse with search, filters, sorting, featured apps, and average ratings
- Install with a button or a **scannable QR code**; downloads keep real names like `SkillSwap.apk`

### Administrator
- Admin dashboard at `/admin`
- View all registered students and all published applications
- **Suspend/restore** applications and **feature/unfeature** them on the homepage
- **Approve or reject pending releases** — new uploads never auto-replace the published version
- **Delete** apps and all their stored files
- View totals for users, apps, reviews, and open reports
- **Resolve or dismiss reports** for apps and reviews

### Administrator access
A separate admin account is pre-created:

- Sign-in: **`/admin/login`**
- Username: **`adminapphub`**
- Password: **`aaaaaaaa`**

The admin panel is completely separate from student accounts. Admins can view all registered students and published apps, block/unblock or delete user accounts, verify accounts, approve/reject releases, feature/suspend/delete apps, and resolve reports. To give someone else admin rights: `UPDATE users SET is_admin = true WHERE email = 'their@email.com';`

### Built in
- Secure httpOnly JWT sessions, bcrypt hashing, hashed single-use tokens, server-side ownership/admin checks
- Neon Postgres for metadata; Neon Object Storage for files via presigned direct uploads
- Old files removed when replaced or deleted; previous release files kept for history
- Staggered animations, smooth transitions, responsive layouts, reduced-motion support
- Loading/error boundaries, security headers, robots, sitemap, production metadata

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, custom design tokens and motion utilities |
| Database | Neon Postgres (`pg`) |
| Files | Neon Object Storage (S3-compatible) with AWS SDK presigned URLs |
| Auth | **Neon Auth (Managed Better Auth)** for students; separate admin session (`jose`, `bcryptjs`); `react-easy-crop` for cropping |
| Email | Resend REST API |
| Hosting | Vercel (recommended) |

---

## Project structure

```
public/apphub-icon.png           favicon and brand mark
scripts/
  e2e-test.mjs                  smoke test for a running server
  setup-storage.mjs             one-time CORS setup
src/app/
  admin/                        administrator dashboard
  api/admin/                    app, version, and report moderation
  api/apps/[id]/reviews/        reviews CRUD
  api/reviews/[id]/report/      report a review
  api/auth/                     register, login, logout, verify, password reset, resend verification
  api/apps/                     create, edit, delete apps
  api/download/[id]/            download counter + presigned URL (supports ?version=)
  api/upload-url/               presigned upload URLs
  api/profile/                  developer profile updates
  apps/[id]/                    detail with version history and reviews
  apps/new/                     publish form
  dashboard/                    your apps
  developers/[username]/        public developer profile
  settings/profile/             profile editor
  login, register, forgot-password, reset-password, resend-verification
  globals.css                   design system, animations, utilities
  layout.tsx / template.tsx / loading.tsx / error.tsx
  robots.ts / sitemap.ts
src/components/                 header, footer, cards, forms, cropper, QR, progress, reviews, admin actions
src/lib/                        db, auth, auth-tokens, email, storage, crop, validation, formatting, types
```

---

## Run locally

```bash
npm install
cp .env.example .env.local    # fill in the values
npm run dev
```

Open http://localhost:3000.

```bash
npm run lint
npm run build
npm run start
node scripts/e2e-test.mjs     # smoke test against the running server
```

---

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres pooled connection string |
| `SESSION_SECRET` | Long random string for signing session cookies |
| `AWS_REGION`, `AWS_ENDPOINT_URL_S3` | Neon Object Storage endpoint settings |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` | Storage credentials and bucket |
| `NEON_AUTH_BASE_URL` | Neon Auth base URL from Console → Better Auth |
| `NEON_AUTH_COOKIE_SECRET` | Random secret (base64, 32+ bytes) for auth session cookies |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional legacy email settings (Neon Auth now handles student email) |
| `NEXT_PUBLIC_SITE_URL` | Public URL used in QR codes, emails, robots, and sitemap |

Set the bucket to `public_read` and allow `GET`, `HEAD`, `PUT` with any headers:

```bash
node --env-file=.env.local scripts/setup-storage.mjs
```

Student sign-up, sign-in, **6-digit email verification codes**, and password-reset emails are handled by **Neon Auth (Managed Better Auth)**. Its shared email provider (`auth@mail.myneon.app`) delivers to any address, so **no domain purchase is needed** for classmates to receive codes and reset links. Verification codes expire after 15 minutes. The admin account uses a completely separate login at `/admin/login`, so admin approval is never needed for students to register or publish.

---

## Auth flows

1. Student registers → Neon Auth emails a **6-digit code** → student enters it on `/verify-email` → account verified → sign in.
2. Forgot password → Neon Auth emails a one-hour reset link → new password.
3. A new code can be requested from sign-in. Admin login is separate and unaffected.

Tokens are random 32-byte values stored only as SHA-256 hashes, expire after 24 hours (verify) / 1 hour (reset), and are single-use.

---

## Release workflow

1. First publish creates `v1.0.0` as **published/current** immediately.
2. Editing with a new file/link/version creates a **pending** version; the live version is unchanged.
3. Admin opens `/admin`, reviews release notes, and approves or rejects.
4. On approval the new version becomes current; earlier versions stay available in **Version history**.

---

## Storage and limits

| Item | Limit |
| --- | --- |
| Postgres branch | 1 GB logical size (free plan) |
| Object storage | 5 GB per project (free plan) |
| Per upload in this app | 200 MB |
| Single object in Neon | up to 5 GiB |

APKs and images live in object storage, never in Postgres. The database stores metadata and URLs only.

---

## Deploy to Vercel

1. Push to GitHub:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin master
   ```
2. Vercel → **Add New → Project** → import the repository.
3. Add all environment variables from `.env.local`; set `NEXT_PUBLIC_SITE_URL` to your Vercel URL or custom domain.
4. Deploy; every push to `master` redeploys.
5. Add a custom domain under **Settings → Domains** and update `NEXT_PUBLIC_SITE_URL`.

QR codes and email links use `NEXT_PUBLIC_SITE_URL`, so they work from phones. On localhost a phone cannot scan the QR code — deploy first for real testing.

---

## Install notes

- **Android:** downloads an `.apk` named after the app. Android may ask to allow unknown sources once.
- **iOS:** Apple does not allow normal sideloading — use a TestFlight/App Store link. An uploaded `.ipa` is stored but still needs signing.

---

**UI and development by @kmabro — built for our class.**
