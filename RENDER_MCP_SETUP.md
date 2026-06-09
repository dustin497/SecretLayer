# Connect Render MCP in Cursor

## Step 1 — Get API key (do NOT paste in chat)

1. Open **https://dashboard.render.com/u/settings#api-keys**
2. **Create API Key** → copy it

## Step 2 — Add to Cursor

Open **Cursor Settings** → **MCP** → **Add server** (or edit `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Replace `YOUR_API_KEY_HERE` with your real key.

## Step 3 — Restart Cursor

Fully quit and reopen Cursor.

## Step 4 — Tell the agent

Say: **"Deploy family-testing-services on Render from branch render-deploy"**

The agent should:

1. `list_workspaces` → pick your workspace
2. `list_services` → check if `family-testing-services` already exists
3. If missing, `create_web_service` with:
   - **repo:** `https://github.com/dustin497/SecretLayer`
   - **branch:** `render-deploy`
   - **rootDir:** *(blank — app is at repo root on this branch)*
   - **buildCommand:** `npm install && npm run build`
   - **startCommand:** `npm start`
   - **runtime:** `node`
   - **healthCheckPath:** `/health`
4. `list_logs` if deploy fails

Or use **Blueprint sync** (repo now has `render.yaml` on `render-deploy`):

1. Render Dashboard → **Blueprints** → **New Blueprint Instance**
2. Connect `dustin497/SecretLayer`, branch **`render-deploy`**
3. Sync → creates `family-testing-services` automatically

---

## Deploy WITHOUT MCP (works now)

Use branch **`render-deploy`** on Render:

| Field | Value |
|-------|--------|
| Repo | `dustin497/SecretLayer` |
| Branch | **`render-deploy`** |
| Root Directory | *(leave blank)* |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
