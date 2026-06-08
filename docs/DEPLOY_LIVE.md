# Go live — secretlayer.net + WWH2

Code is on `main`. Finish these two host connections once (about 10 minutes).

## 1. Netlify (web → secretlayer.net)

**Option A — Git integration (recommended)**

1. [Netlify](https://app.netlify.com) → your secretlayer.net site → **Site configuration → Build & deploy**
2. **Link repository** → `dustin497/SecretLayer` → branch **`main`**
3. Build settings are read from `netlify.toml` automatically:
   - Build: `corepack enable && pnpm install && pnpm --filter @secretlayer/web build`
   - Publish: `apps/web/dist`
4. **Deploy site** → confirm https://secretlayer.net shows the WWH2 launcher (bottom-right)

**Option B — GitHub Actions CLI deploy**

Add repository secrets:

| Secret | Where to get it |
|--------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site configuration → General → Site ID |

Push to `main` — the **Deploy** workflow runs `netlify deploy --prod`.

## 2. Railway (API → api.secretlayer.net)

1. [Railway](https://railway.app) → SecretLayer API service → **Settings**
2. Connect GitHub repo `dustin497/SecretLayer`, branch **`main`**, root uses `railway.toml`
3. **Add Postgres** plugin → Railway injects `DATABASE_URL`
4. **Variables** (service):

   ```
   WEB_ORIGIN=https://secretlayer.net
   JWT_SECRET=<strong-random-secret>
   NODE_ENV=production
   ```

5. Redeploy → verify https://api.secretlayer.net/health shows `"wwh2Store":"postgres"`

WWH2 ratings auto-migrate from any legacy JSON file on first Postgres boot.

## 3. Smoke test after deploy

1. Open https://secretlayer.net
2. Click **Open guided help** or footer **Powered by WWH2**
3. Run **Trust & Security tour** → finish → submit 5-star rating
4. Refresh → launcher should show average rating
5. `curl https://api.secretlayer.net/wwh2/stats` → `totalSessions` ≥ 1

## Verify Netlify is building this repo (not an old upload)

Live HTML should include:

- Page title: **SecretLayer — WWH2 Guided Help**
- Footer text: **build 0.2.0-wwh2**
- WWH2 launcher in the bottom-right corner

If you still see **SecretLayer MVP** and no WWH2, the Netlify build is failing or publish directory is wrong:

1. Netlify → **Deploys** → open latest deploy log on `main`
2. Confirm **Published directory** is `apps/web/dist` (from `netlify.toml`)
3. If build failed on `esbuild`, pull latest `main` (includes `pnpm.onlyBuiltDependencies`)
4. **Clear cache and deploy site**

## Troubleshooting

| Issue | Fix |
|-------|-----|
| WWH2 launcher missing | Netlify still on old build — check deploy logs, then **Clear cache and deploy** |
| Ratings don’t persist | Railway missing `DATABASE_URL` — add Postgres plugin |
| API CORS errors | Set `WEB_ORIGIN=https://secretlayer.net` on Railway |
| `/api/*` 404 on web | Confirm `_redirects` in build output or `netlify.toml` redirects |
