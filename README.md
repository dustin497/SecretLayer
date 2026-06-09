# Family Testing Services

Drug testing clinic website — Bessemer, AL.

## Deploy to Render (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/dustin497/SecretLayer/tree/render-deploy)

After deploy:

- Site: `https://family-testing-services.onrender.com`
- Health: `/health` → `ok`
- Admin: `/admin/` (password: `fts2026` or set `ADMIN_PASSWORD` in Render)

## API deploy (agent / CI)

```bash
export RENDER_API_KEY=rnd_...
node scripts/deploy-to-render.mjs
```

## GoDaddy Node.js Hosting

Upload this folder, then run: `npm install && npm run build && npm start`
