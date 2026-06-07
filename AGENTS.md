# AGENTS.md

Guidance for Cursor Cloud agents on **SecretLayer** ([secretlayer.net](https://secretlayer.net)).

## Cursor Cloud specific instructions

### Repository

GitHub: `dustin497/SecretLayer`.

### Services

| Service | Port | Command |
|---------|------|---------|
| API | 8787 | `pnpm dev:api` |
| Web | 5173 | `pnpm dev:web` |

Run both: `pnpm dev`.

### VM update script

```
pnpm install
pnpm --filter @secretlayer/shared build
pnpm --filter @secretlayer/safety-engine build
pnpm --filter @secretlayer/promotion build
pnpm --filter @secretlayer/crypto build
```

### Verify full stack

```bash
pnpm build && pnpm test
pnpm dev:api & sleep 2
curl -s http://localhost:8787/health
```

### Integration

```bash
JWT_SECRET=local-dev-secret pnpm integrate
```

### Promotion

Dry run writes to `promotion-output/`. `--execute` appends CHANGELOG and can POST `NETLIFY_BUILD_HOOK`.

### Notes

- Web proxies `/api/*` → local API in dev; Netlify proxies to `api.secretlayer.net` in production.
- Vault encryption uses `@secretlayer/crypto` (PBKDF2 210k iterations, AES-GCM-256).
- API dev uses in-memory storage.
