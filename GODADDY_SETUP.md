# Host Family Testing Services on GoDaddy

**Your domain:** `family-testing.com`

See **`GODADDY_DNS.md`** for DNS records to connect the domain to the live site.

## Step 1 — Domain (done)

You purchased `family-testing.com` at GoDaddy.

## Step 2 — Get hosting

In GoDaddy, add **Web Hosting** (Economy plan is fine) or use **GoDaddy Websites + Marketing** → upload custom site.

## Step 3 — Upload the site files

1. GoDaddy → **My Products** → your hosting → **Manage** → **cPanel** (or **File Manager**)
2. Open the `public_html` folder (this is your website root)
3. Delete any default files (e.g. `index.html` placeholder)
4. Upload **everything inside** the `family-testing-services` folder:
   - `index.html`, `about.html`
   - `admin/` folder (staff documents)
   - `css/`, `js/`, `images/` folders

**Do not** upload the folder itself — upload the *contents* so `index.html` sits directly in `public_html`.

## Step 4 — Point domain to hosting

GoDaddy usually does this automatically when domain + hosting are on the same account.

## Staff admin after GoDaddy deploy

| | |
|---|---|
| **Admin URL** | `https://yourdomain.com/admin/` |
| **Password** | `fts2026` |

## Free alternative (no GoDaddy needed)

After GitHub Actions runs, the site is also at:

**https://dustin497.github.io/SecretLayer/**

(Replace with your GitHub username/repo if different.)
