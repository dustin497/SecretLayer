# Render.com — Exact Settings (copy each field)

## Most common failure
**Root Directory was left blank** — Render tried to build the whole monorepo with pnpm and failed.

---

## Create Web Service — fill in EXACTLY:

| Field | Value |
|-------|--------|
| **Name** | `family-testing-services` |
| **Region** | pick closest to you |
| **Branch** | `main` |
| **Root Directory** | `family-testing-deploy` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | Free (or paid) |

Leave **Docker** OFF. Do not use pnpm.

---

## Environment variables (optional)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD` | `fts2026` (or your own) |

---

## After deploy

- Test: `https://YOUR-SERVICE.onrender.com/health` → should say `ok`
- Site: `https://YOUR-SERVICE.onrender.com`
- Admin: `https://YOUR-SERVICE.onrender.com/admin/`

---

## Still failing?

1. Open Render → your service → **Logs**
2. Copy the **last 20 lines** of the error (no passwords)
3. Send that text — common errors:

| Log says | Fix |
|----------|-----|
| `pnpm: command not found` or workspace errors | Set **Root Directory** to `family-testing-deploy` |
| `Missing script: start` | Root Directory is wrong — must be `family-testing-deploy` |
| `Cannot find module express` | Build Command must be `npm install && npm run build` |
| `Port scan timeout` | Start Command must be `npm start` |

---

## Connect family-testing.com

Render → **Settings** → **Custom Domains** → add `family-testing.com`  
Follow Render's DNS instructions in GoDaddy DNS tab.
