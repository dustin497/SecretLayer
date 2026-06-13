# Point family-testing.com to your live site

Your site files deploy automatically to GitHub Pages. You only need to connect the domain in GoDaddy.

## Step 1 — Enable GitHub Pages (one time)

1. Open **https://github.com/dustin497/SecretLayer/settings/pages**
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` · folder **`/ (root)`** → **Save**
4. Under **Custom domain**, enter: `family-testing.com` → **Save**
5. Wait for DNS check (can take up to 24–48 hours after buying the domain)

## Step 2 — GoDaddy DNS records

1. Go to [godaddy.com](https://www.godaddy.com) → **My Products** → **family-testing.com** → **DNS**
2. Delete any old A/CNAME records that conflict (parking page, etc.)
3. Add these records:

| Type  | Name | Value                | TTL  |
|-------|------|----------------------|------|
| A     | @    | 185.199.108.153      | 600  |
| A     | @    | 185.199.109.153      | 600  |
| A     | @    | 185.199.110.153      | 600  |
| A     | @    | 185.199.111.153      | 600  |
| CNAME | www  | dustin497.github.io  | 600  |

4. Save and wait 15 minutes to 48 hours for propagation.

## Step 3 — Verify

- **https://family-testing.com**
- **https://www.family-testing.com**
- **Staff admin:** https://family-testing.com/admin/ · password: `fts2026`

## If you bought GoDaddy Web Hosting (not just the domain)

You can skip GitHub Pages and upload files instead:

1. Hosting → **cPanel** → **File Manager** → `public_html`
2. Upload all contents of the `family-testing-services` folder from this repo
3. In GoDaddy DNS, make sure `@` points to your hosting (GoDaddy usually does this automatically)

## Domain not resolving yet?

Right after purchase, `family-testing.com` can show nothing for a few hours. That is normal. DNS must finish registering before any hosting will work.
