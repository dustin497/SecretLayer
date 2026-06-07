# AGENTS.md

Guidance for Cursor Cloud agents working on **SecretLayer** ([secretlayer.net](https://secretlayer.net)).

**Repo:** [github.com/dustin497/SecretLayer](https://github.com/dustin497/SecretLayer)

## Cursor Cloud specific instructions

### Services

| Service | Port | Command | Required |
|---------|------|---------|----------|
| API | 8787 | `pnpm dev:api` | Yes (for full stack) |
| Web | 5173 | `pnpm dev:web` | Yes (for UI) |

Run both: `pnpm dev` (parallel).

### Dependencies

VM update script: `pnpm install`

### Lint / test / build

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

### Safety & promotion

```bash
pnpm safety:run https://secretlayer.net .
pnpm promote:check https://secretlayer.net 0.2.0
```

Promotion is blocked unless safety score ≥ 80 with zero critical findings. When approved, channel-specific promotion leads are generated (changelog, site, social, email, deploy).

### API integration endpoints

- `GET /safety/report?target=https://secretlayer.net`
- `POST /promotion/check` — body: `{ target, version, highlights? }`
- `POST /leads/waitlist` — body: `{ email, source? }`

### Non-obvious notes

- Web proxies `/api/*` → `localhost:8787` via Vite config.
- API uses in-memory stores in dev; production uses Railway + persistent DB (not yet in repo).
- Live production frontend bundle is separate from this repo until migrated.
- Canonical GitHub repo is **SecretLayer** (formerly misspelled `SecretLair-`).
