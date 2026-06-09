# Connect family-testing.com to Render

Your site is live at **https://family-testing-services.onrender.com**.  
`family-testing.com` still points to GoDaddy — update DNS to use Render.

## Step 1 — Add domain in Render

1. Open [Render Dashboard](https://dashboard.render.com) → **family-testing-services**
2. **Settings** → **Custom Domains** → **+ Add Custom Domain**
3. Enter: `family-testing.com`
4. Click **Save** (Render also adds `www.family-testing.com`)

Or sync the blueprint — `render.yaml` already includes `family-testing.com`.

## Step 2 — Update GoDaddy DNS

### Option A — Import zone file (recommended)

1. **Delete conflicts first** (GoDaddy → DNS):
   - All **A** records for `@`
   - All **CNAME** records for `www`
   - **Forwarding** rules (Domain → Forwarding → delete)
   - Any **AAAA** records

2. **Import zone file:**
   - GoDaddy → **family-testing.com** → **DNS** → **Actions** → **Import Zone File**
   - Upload: `dns/family-testing.com.zone` from this repo
   - Click **Apply Zone File**

3. If import fails, delete the conflicting records GoDaddy lists and try again.

### Option B — Manual records

Go to **GoDaddy** → **family-testing.com** → **DNS** → **Manage DNS**

**Remove** (if present):

- Old **A** records pointing to GoDaddy parking (`76.223.*`, `13.248.*`)
- Any **AAAA** records
- Website Builder / forwarding records for `@` and `www`

**Add / update:**

| Type  | Name | Value                           | TTL  |
|-------|------|---------------------------------|------|
| **A** | `@`  | `216.24.57.1`                   | 600  |
| **CNAME** | `www` | `family-testing-services.onrender.com` | 1 Hour |

> GoDaddy does not support ANAME/ALIAS on root domains, so use Render's **A record** (`216.24.57.1`) for `@`.

## Step 3 — Verify in Render

1. Wait 5–30 minutes for DNS to propagate
2. Render → **Custom Domains** → click **Verify** next to `family-testing.com`
3. When verified, Render issues your free SSL certificate

## Step 4 — Test

- https://family-testing.com
- https://www.family-testing.com (redirects to root)
- https://family-testing.com/admin/

## API / agent script

```bash
export RENDER_API_KEY=rnd_...
node scripts/add-custom-domain.mjs
```
