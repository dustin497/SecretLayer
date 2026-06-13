# Netlify deploy — mirrorpathai.com (5 minutes)

`mirrorpathai.com` is still showing Mirror Path AI because that Netlify site is **not connected to this repo yet**. Do **one** of the options below.

---

## Option A — Link repo in Netlify (easiest)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Open the site that uses **mirrorpathai.com**
3. **Site configuration** → **Build & deploy** → **Continuous deployment** → **Link repository**
4. Choose **GitHub** → repo **`dustin497/SecretLayer`** → branch **`main`**
5. Build settings:
   - **Base directory:** *(leave empty)*
   - **Publish directory:** `family-testing-services`
   - *(Or leave blank — root `netlify.toml` already sets this.)*
6. **Deploy site** → wait ~1 minute
7. Open **https://mirrorpathai.com**

---

## Option B — GitHub Actions (auto-deploy on every push)

1. Netlify → **User settings** → **Applications** → **Personal access tokens** → create token
2. Netlify → your **mirrorpathai.com** site → **Site configuration** → **General** → copy **Site ID** (API ID)
3. GitHub → `dustin497/SecretLayer` → **Settings** → **Secrets and variables** → **Actions** → add:
   - `NETLIFY_AUTH_TOKEN` = your token
   - `NETLIFY_SITE_ID` = your site ID
4. **Actions** → **Deploy** → **Run workflow**

---

## After deploy

| Page | URL |
|------|-----|
| Public site | https://mirrorpathai.com |
| Staff admin | https://mirrorpathai.com/admin/ |
| Admin password | `fts2026` |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still shows Mirror Path AI | Wrong site linked, or deploy still running — check Netlify **Deploys** tab |
| 404 on `/admin/` | Publish directory must be `family-testing-services`, not `apps/web/dist` |
| Build failed | Use publish dir `family-testing-services` — no build step required |
