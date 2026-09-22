# PokeTierlist

Production-oriented Pokémon Champions competitive intelligence built with Next.js 16, React 19, TypeScript, Tailwind CSS, PostgreSQL, Prisma 7, Auth.js, Zod, Recharts, Framer Motion, and Lucide.

The repository intentionally contains **no seeded Pokémon, mechanics, regulations, or statistics**. An empty database is the correct starting state until an administrator attaches sources and verification records. The public roster only selects records whose Champions availability is `AVAILABLE`.

## Local setup

Requirements: Node.js 24+, npm 11+, and PostgreSQL.

```bash
cp .env.example .env
npm install
npm run db:deploy
npm run dev
```

Open <http://localhost:3000>. Generate `AUTH_SECRET` with `openssl rand -base64 32`. Google and Discord sign-in require their optional Auth.js environment variables; email/password works without those OAuth providers.

The first administrator is promoted through a one-time, database-backed operator workflow. Register the account first, then run:

```bash
ADMIN_EMAIL="operator@example.com" npm run admin:promote-first
```

The command refuses to run after an active administrator exists and writes an audit entry. Do not expose a public role-promotion endpoint.

## Commands

```bash
npm run dev          # development server
npm run typecheck    # TypeScript validation
npm test             # focused domain, auth/API, and optional DB integration tests
npm run lint         # ESLint
npm run build        # production build
npm run env:check    # validate local/runtime environment without printing secrets
npm run env:check:production # require production-safe URLs and secrets
npm run admin:promote-first  # one-time first-admin promotion using ADMIN_EMAIL
npm run db:generate  # generate Prisma Client
npm run db:migrate   # create/apply a development migration
npm run db:deploy    # apply checked-in migrations in production
```

Database integration tests run when `DATABASE_URL` is present and skip otherwise.

## Data integrity model

- `ChampionsAvailability` is independent from all regulation legality tables.
- Only `AVAILABLE` Pokémon are returned by public roster, search, favorites, builder, and community ingestion queries.
- Regulations separately whitelist Pokémon/forms, moves, abilities, and items.
- Team legality is recomputed server-side on every create/duplicate operation.
- Official tier lists are distinct from `CommunityTierList` and cannot be confused in the UI or schema.
- Statistics render only when status is `VERIFIED` or `OFFICIAL`; otherwise the UI says “Statistics unavailable.”
- Admin ingestion requires a source URL and writes both `DataVerification` and `ChangeLog` records in the same transaction.
- The protected admin console provides CRUD for forms, moves, abilities, items, regulations and legality references, official tier ordering with immutable `TierHistory`, sourced usage statistics, users, sources, and verification records.
- Community lists and comments use soft moderation states (`PUBLISHED`, `HIDDEN`, `REMOVED`), while suspended accounts are rejected when Auth.js refreshes the database-backed session.
- Official ranking and statistic mutations require an existing `DataSource`; the application never supplies artificial records or imports another game’s roster.

## Admin data operations

Open `/admin` with an active `ADMIN` account. Create a source first, then select it for each competitive-data mutation. The console shows exact database IDs for relational payloads and submits every payload through server-side Zod validation. Regulation legality and official tier entries are explicit arrays; omitted or empty arrays are never inferred from another Pokémon title.

Destructive operations are dependency-aware. Referenced regulations cannot be deleted, the last active administrator cannot be suspended or demoted, and administrators cannot remove their own access. Moderated community content is retained for audit instead of being physically deleted.

### Verified data onboarding

1. Create a source record using an official Pokémon Champions or Play! Pokémon URL.
2. Create Pokémon with an explicit Champions availability status and record-level verification status. `AVAILABLE` is never inferred from Pokémon HOME or another title.
3. Add forms, moves, abilities, and items only when the chosen source confirms those Champions records.
4. Create Singles and Doubles regulations with explicit legal Pokémon/forms and legal move, ability, and item references.
5. Publish official tiers or statistics only after attaching their own source and verification record.

Official starting points include <https://champions.pokemon.com/en-us/> and the current Play! Pokémon video game handbook. If a complete roster, learnset, regulation list, or statistical dataset is not published, leave that category empty; screenshots, rumors, and other games are not accepted substitutes.

## Deployment

Set `DATABASE_URL`, `AUTH_SECRET`, and `AUTH_URL` in Vercel. Add Google and Discord credentials only when those providers are enabled. Run `npm run env:check:production`, then `npm run db:deploy` as a release step. `postinstall` generates the Prisma client for Vercel builds.

Production rollout order:

```bash
npm ci
npm run env:check:production
npm run db:deploy
npm run build
```

After deployment, register the first account, promote it with the operator command, sign in at `/admin`, create sources, and then enter verified Champions records. The application is intentionally useful in an empty state and reports unavailable datasets honestly until this process is complete.

Never commit `.env` files or production credentials.
