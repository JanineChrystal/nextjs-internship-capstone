# Takda PH

A team project-management tool built around Kanban boards, with the parts that
usually get skipped actually built: bilingual comment moderation, email
notifications people can switch off per category, and an archive that lets you
undo a delete.

Named for the Filipino *takda* — an assigned task.

**Live:** _add your production URL here_

---

## Table of contents

- [Major features](#major-features)
- [Tech stack](#tech-stack)
- [Security](#security)
- [Testing](#testing)
- [Setup](#setup)
- [Folder structure](#folder-structure)
- [Database schema](#database-schema)

---

## Major features

### Projects and tasks, in five views

A project opens on a **Kanban board** and switches to **Grid**, **Calendar**,
**Charts** or **Settings** without leaving the page. Tasks drag between columns,
and one column per project can be marked the *completion column* — completing a
task moves it there, and un-completing sends it back where it came from rather
than dumping it in the first column.

Every view reads the same store, so a rename in the grid shows on the board
without a refetch. Filters apply to the three views where they mean something
and are absent from the two where they do not.

### Bilingual comment moderation

The innovation the project is built around. Comments are checked against **two
detectors before they are stored**, not after:

| Detector | Runs | Catches |
| :-- | :-- | :-- |
| English | in-process, `bad-words` | English profanity, some symbol substitution |
| Filipino / Visayan | Filipino Profanity API + a local word list | Tagalog and Visayan, plus leetspeak |

Three details worth knowing, because each one was a bug first:

- **Two endpoints, not one.** The API's `/api/check` does *not* apply its 8,000+
  leetspeak variants — `g4g0 ka` returns clean there and flags on
  `/api/variants/lookup`. Both are called in parallel and either firing flags
  the comment.
- **Matches are bounded on the left.** `/variants/lookup` matches substrings, so
  a username came back as profanity via `pest` inside it. A match now has to
  begin a word. The boundary is left-only on purpose: Tagalog takes suffixes, so
  `tanginang` and `gagong` must still match.
- **A local Filipino word list backs up the API.** Measured, not assumed:
  `tangina` is absent from the service's database entirely. The local list fills
  the gaps and keeps Filipino detection alive while the API is cold or rate
  limited.

Detection **fails open** — if a detector throws, the comment posts and is queued
for a recheck. A moderation outage should not stop a team talking to each other.

### Email notifications with real switches

Seven categories on Settings, each governing a real email: project invites,
workspace invites, comment mentions, comment violations, task completions,
project completions, and project overdue. The preference is resolved in one
place in the data layer rather than at each sender, so an email cannot be sent
by a path that forgot to check.

Emails are React Email components rendered server-side and sent through
SendGrid. Delivery runs inside Next's `after()`, so nobody waits on an HTTP call
for a result they do not need.

### Archive and trash

Deleting is reversible. Projects and tasks go to **Archive** (kept indefinitely)
or **Trash** (purged after a retention window), and both can be restored.
Deleting a project asks you to type its name first.

### The rest

Invitations that are an offer rather than a grant · @-mentions with autocomplete
· task checklists, links and comments · per-project and per-workspace member
roles · a global calendar and a per-project one · analytics charts · global
search · twelve colour palettes with a measured contrast floor · light and dark
themes.

---

## Tech stack

**Language** — TypeScript (strict), SQL

**Framework** — Next.js 16 (App Router, Server Actions, React Server
Components), React 19

**Database** — PostgreSQL on Neon · Drizzle ORM · Drizzle Kit for migrations ·
`drizzle-zod` to derive validation from the schema

**Auth** — Clerk (`@clerk/nextjs`), with a Svix-verified webhook syncing users
into the database

**State** — Zustand stores · React Hook Form + Zod for forms

**UI** — Tailwind CSS v4 · shadcn/ui on Radix primitives · Base UI · Lucide
icons · Motion for animation · Sonner for toasts · React Bits Pro components

**Feature libraries** — dnd-kit (drag and drop) · react-big-calendar ·
react-day-picker · Recharts · date-fns

**Storage** — Vercel Blob for task attachments

**Email** — React Email components, rendered server-side

**Tooling** — Biome (lint and format) · pnpm · tsx

### Libraries worth naming

- **bad-words** — the in-process English word list. Checked for the Scunthorpe
  problem before adoption: `assignment`, `classic` and `bass` all come back
  clean, so it matches words rather than substrings.
- **Filipino Profanity API** — Tagalog and Visayan detection, including a
  leetspeak variant database.
  - API: <https://filipino-profanity-api-latest.vercel.app/api>
  - Source: <https://github.com/jobelGolde12/filipino_profanity_api_latest>

### Third-party services

| Service | Used for |
| :-- | :-- |
| Clerk | authentication, sessions, the user webhook |
| Neon | serverless PostgreSQL, one branch per environment |
| Vercel | hosting and preview deployments |
| SendGrid | notification and contact email |
| Telegram Bot API | instant contact-form alerts |
| Upstash Redis | rate limiting |
| Vercel Blob | task file attachments |
| React Email | email templates as components |
| shadcn/ui | component primitives |
| React Bits Pro | animated landing-page components |

> Email originally went through **Resend** and moved to **SendGrid**, because
> Single Sender Verification proves one address rather than requiring a whole
> verified domain — which is what lets a prototype email real people without
> buying one.

---

## Security

### Rate limiting

Upstash Redis, with a window sized to the risk of each surface:

| Limiter | Window | Applies to |
| :-- | :-- | :-- |
| `actionRateLimiter` | 5 per 10s | the public contact form |
| `inviteRateLimiter` | 10 per 60s | invitations, keyed by user id |
| `globalRateLimiter` | 100 per 10s | general action traffic |

It **fails open** and is imported lazily inside a `try`, so a deployment missing
its Upstash variables degrades spam protection instead of taking the whole
landing page down.

### Encryption at rest

Sensitive free text — comments, checklist items, contact messages, activity
details — is encrypted with **AES-256-GCM using a random IV per value**.

Deterministic encryption was rejected deliberately: it produces the same
ciphertext for the same plaintext, so anyone with database access can count
repeats and match values across rows without ever decrypting anything. A random
IV means two identical comments are two different ciphertexts. The cost is that
encrypted columns cannot be searched or indexed by value, which is a trade worth
making for text nobody queries by content.

### IDOR prevention through the data layer

Authorisation is resolved **where the row is read**, not by a route matcher.
Clerk deprecated `createRouteMatcher` because path matching can diverge from how
Next actually routes a request — a URL nobody anticipated walks straight past a
matcher, but it cannot walk past `requireUser`, `getEffectiveProjectRoleDAL` or
`verifyProjectPermissionDAL`.

The backend is six layers, each depending only on the one before:

```
db  →  validations  →  types  →  dtos  →  dal  →  actions
```

- **db** — Drizzle schema and connection
- **validations** — Zod schemas, several derived from the schema itself
- **types** — shared TypeScript contracts
- **dtos** — shapes the UI receives, never raw rows
- **dal** — every query, and every permission check
- **actions** — Server Actions; they orchestrate, they do not query

An action that wanted to skip the permission check would have to write its own
query, and there are none outside `lib/dal`.

### Security headers

Set in `next.config.ts` for every route: `Content-Security-Policy`,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and
`Strict-Transport-Security`.

The CSP is explicit about `frame-src`. Without that entry it falls back to
`default-src 'self'` and silently blocks Cloudflare Turnstile, which Clerk uses
for bot protection — the symptom is "The CAPTCHA failed to load" on sign-up,
which reads like a browser-extension problem and is not.

---

## Testing

### Vitest — unit and integration

**405 tests across 52 files.** Pure logic: validation schemas, DTO mappers,
status derivation, date rules, the profanity response parsers, encryption
round-trips, utility helpers.

```bash
pnpm test          # watch
pnpm test --run    # once
```

### Playwright — end to end

**64 tests across 19 spec files**, against a real browser and a real database.
Coverage by module: Projects (21), Tasks (19), Kanban board (6), Authentication
(9), Contact (4), Team invitations (2), Project calendar (3).

```bash
pnpm test:e2e              # local, against pnpm start
pnpm test:e2e:ui           # the Playwright UI
pnpm test:e2e:deployed     # against E2E_BASE_URL
pnpm test:e2e:report       # last HTML report
```

Notes that matter when running it:

- Sign-in state is captured once and reused for 8 hours. Clerk **development
  instances are rate limited**, and a full run makes hundreds of authenticated
  page loads — set `E2E_FORCE_SIGN_IN=true` to force a fresh sign-in.
- Every run cleans up the projects it created. Set `E2E_SKIP_CLEANUP=true` to
  keep them while debugging a failure.
- `pnpm e2e:cleanup` removes leftovers by hand; it is a dry run unless you pass
  `--yes`.

### All gates

```bash
pnpm check          # Biome lint and format
pnpm typecheck      # tsc --noEmit
pnpm test --run     # Vitest
pnpm build          # production build
pnpm verify         # all of the above
```

---

## Setup

### 1 · Clone and install

```bash
git clone <your-repo-url>
cd nextjs-internship-capstone/project
pnpm install
```

pnpm is required — the lockfile and `node_modules` layout are pnpm's, and npm
will rewrite the tree.

### 2 · Environment

Copy `.env.example` to `.env.local` and fill it in. `.env.example` holds
placeholders only and is the one `.env*` file git tracks.

### 3 · Neon (PostgreSQL)

Create a project at [neon.tech](https://neon.tech). Create a **branch per
environment** — development, preview, integration, production — and take the
pooled connection string of each.

```env
DATABASE_URL=postgresql://...        # development
PREVIEW_DATABASE_URL=postgresql://...
INTEGRATION_DATABASE_URL=postgresql://...
PRODUCTION_DATABASE_URL=postgresql://...
```

Then migrate **each branch on purpose** — deploying code does not migrate a
database:

```bash
pnpm db:migrate                 # development
pnpm db:migrate:preview
pnpm db:migrate:integration
pnpm db:migrate:production
pnpm db:seed                    # optional [Demo] data
```

Each command prints the host it is about to touch. Read that line. The configs
refuse to run if the URL is missing or identical to `DATABASE_URL`.

### 4 · Clerk (authentication)

Create an application at [clerk.com](https://clerk.com) and take the development
instance's keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
CLERK_WEBHOOK_SECRET=whsec_...
```

Add a webhook at Clerk, pointing to
`https://<your-domain>/api/webhooks/clerk`, subscribed to `user.created`,
`user.updated` and `user.deleted`. Put its signing secret in
`CLERK_WEBHOOK_SECRET`.

> Development keys work on any domain including `localhost` and `*.vercel.app`.
> A **production** instance requires a domain you control plus DNS records, and
> its user list starts empty — the two instances do not share accounts.

### 5 · SendGrid (email)

Create an API key with **Mail Send** permission, then verify a sender address
under Single Sender Verification.

```env
SENDGRID_API_KEY=SG....
CONTACT_EMAIL_FROM=Takda PH <your-verified@address>
CONTACT_EMAIL_TO=where-contact-goes@example.com
```

`CONTACT_EMAIL_FROM` must match the verified address exactly — anything else is
a 403 on every send while looking perfectly reasonable in the environment file.

### 6 · Telegram (contact alerts)

Message [@BotFather](https://t.me/botfather), create a bot, take its token, then
get your chat id from `https://api.telegram.org/bot<TOKEN>/getUpdates`.

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Verify both channels without sending anything:

```bash
pnpm check:notifiers --no-send
```

### 7 · Upstash (rate limiting)

Create a Redis database at [upstash.com](https://upstash.com):

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 8 · Vercel Blob (file attachments)

In the Vercel dashboard, open **Storage**, create a Blob store, and connect it
to the project. Vercel injects the token into deployments automatically; for
local development copy it from the store's `.env.local` tab:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Files upload **browser-to-Blob** through a short-lived token issued by
`/api/blob/upload`, so they never pass through a Server Action — whose body is
capped at a megabyte by default. Uploads are limited to 10MB and to document and
image types, and the token is only issued to a signed-in user.

Without the token, links still work and file attachments report a failure rather
than silently doing nothing.

### 9 · Encryption key

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

```env
ENCRYPTION_KEY=<the 64-character hex string>
```

Losing this key makes every encrypted value unreadable. There is no recovery.

### 10 · Profanity API

Works with no configuration — it defaults to the public deployment. Override
only for a self-hosted instance:

```env
FILIPINO_PROFANITY_API_URL=https://your-instance/api
```

Check it responds with `pnpm check:profanity`.

### 11 · Playwright

```bash
pnpm exec playwright install chromium
```

Add three test accounts. On a Clerk development instance with Test mode on, any
`+clerk_test` address is accepted with the fixed code `424242`, so no real inbox
is involved:

```env
E2E_USER_EMAIL=you+clerk_test@gmail.com
E2E_USER_PASSWORD=...
E2E_USER_B_EMAIL=you+clerk_test_b@gmail.com
E2E_USER_B_PASSWORD=...
E2E_USER_C_EMAIL=you+clerk_test_c@gmail.com
E2E_USER_C_PASSWORD=...
```

### 12 · Run it

```bash
pnpm dev        # http://localhost:3000
```

### 13 · Vercel (deployment)

Import the repository at [vercel.com](https://vercel.com), set the root
directory to `project/`, and add every variable above to the **Production**
scope — Preview and Production are separate scopes and do not share values.

`DATABASE_URL` in Vercel must be your **production** Neon branch, which is what
keeps a bad migration off production. The cost is that redeploying does not
migrate anything; each branch is migrated on purpose.

---

## Folder structure

```
project/
├── app/
│   ├── (auth)/              sign-in and sign-up
│   ├── (public)/            landing page, privacy, terms
│   │   ├── _components/     hero, features, pricing, FAQ, contact drawer
│   │   ├── _constants/      landing copy
│   │   └── _hooks/          section spy, contact form
│   ├── (dashboard)/         the authenticated app
│   │   ├── _components/     shared shell, modals, badges, toolbars
│   │   ├── _constants/      shared config
│   │   ├── _hooks/          shared hooks
│   │   ├── analytics/       charts across projects
│   │   ├── archive/         archive and trash
│   │   ├── calendar/        global calendar
│   │   ├── dashboard/       quick actions and summary
│   │   ├── notifications/   inbox and email templates
│   │   ├── profile/         member profiles
│   │   ├── projects/        list, detail, and the five views
│   │   ├── settings/        appearance and notification preferences
│   │   └── team/            directory, invites, pending
│   └── api/                 route handlers (Clerk webhook)
│
├── lib/                     the backend, in six layers
│   ├── db/                  Drizzle schema, connection, seed
│   ├── validations/         Zod schemas
│   ├── types/               shared TypeScript contracts
│   ├── dtos/                shapes the UI receives
│   ├── dal/                 every query and permission check
│   ├── actions/             Server Actions
│   ├── email/               SendGrid transport, notification sender
│   ├── notifiers/           contact-form channels
│   ├── profanity/           English and Filipino detectors
│   ├── clerk/               appearance bridge
│   ├── constants/           tuning values
│   ├── config/              runtime configuration
│   ├── theme/               palette definitions
│   └── utils/               encryption, dates, mentions, toasts
│
├── components/
│   ├── ui/                  shadcn primitives and shared widgets
│   ├── charts/              chart wrappers
│   ├── modals/              base modal shells
│   └── views/               shared table views
│
├── stores/                  Zustand stores
├── hooks/                   app-wide React hooks
├── styles/                  Tailwind v4 theme tokens
├── test/                    Vitest suites
├── e2e/                     Playwright specs, helpers, teardown
├── scripts/                 seed, migrations, notifier and profanity checks,
│                            DBML generator, E2E cleanup
├── drizzle/                 generated migrations
├── docs/                    phase notes, schema.dbml
└── public/                  static assets
```

The `_components` / `_constants` / `_hooks` folders are private by Next's
convention — the underscore keeps them out of routing, so colocating them next
to the route that uses them costs nothing.

---

## Database schema

22 tables, 41 relationships. Regenerate the diagram source at any time:

```bash
pnpm db:dbml
```

That reads the **live** schema — not `schema.ts` — and writes
[`docs/schema.dbml`](docs/schema.dbml). Paste it into
[dbdiagram.io](https://dbdiagram.io/d) to render the ERD.

Reading from the database rather than the source is deliberate: a generator that
parsed `schema.ts` would happily draw a migration nobody applied.

| Group | Tables |
| :-- | :-- |
| Identity | `Users`, `Workspaces`, `WorkspaceMembers` |
| Projects | `Projects`, `ProjectMembers`, `ProjectTeams`, `Boards` |
| Work | `Tasks`, `TaskAssignees`, `Checklists`, `Attachments` |
| Collaboration | `Comments`, `CommentMentions`, `Teams`, `TeamMembers` |
| Invitations | `PendingInvites`, `ProjectInvites` |
| Activity | `ActivityLogs`, `Notifications`, `NotificationSettings` |
| Other | `Categories`, `ContactMessages` |
