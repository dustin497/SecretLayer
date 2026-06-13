# SecretLayer — 1-week growth playbook (small budget)

Goal: be the solution developers **search for** when managing API keys — not a big partnership pitch.

## What shipped in this repo

| Asset | URL | SEO intent |
|-------|-----|------------|
| 10 API landings | `/for/openai`, `/for/supabase`, … | "{provider} api key management" |
| Cost calculator | `/calculator` | "openai api cost calculator", "stripe fees estimate" |
| Referral program | `/referral` | Refer 5 → 1 month Personal free |
| Week 1 guide | `/guides/openai-api-key-vault-week-1` | Long-tail tutorial |
| Sitemap | `/sitemap.xml` | Submit to Google Search Console |

## Your 7-day execution plan

### Day 1–2 — Publish & index
- Deploy `main` to Netlify
- [Google Search Console](https://search.google.com/search-console) → add `secretlayer.net` → submit sitemap
- Post calculator link on X/LinkedIn: *"Free API cost calculator for indie builders"*

### Day 3 — Reddit / communities (no spam)
Post **one** helpful thread per community with calculator + relevant `/for/*` link:
- r/SideProject, r/webdev, r/node, r/nextjs
- Indie Hackers "Share your project"
- Hacker News **Show HN** only when calculator + 3 landings feel polished

Template: problem → calculator result → "I built vaults for this" → link to `/for/openai` etc.

### Day 4 — Referral launch
- Email waitlist: *Refer 5 builders → 1 month Personal free*
- Pin referral link in your bio
- Ask 3 builder friends to sign up with your code (seed the program)

### Day 5 — Guide #1 distribution
- Publish Week 1 OpenAI guide (`/guides/openai-api-key-vault-week-1`)
- Cross-post to dev.to (canonical → secretlayer.net)
- Answer 2–3 Stack Overflow / Reddit questions about OpenAI key leaks (link guide)

### Day 6–7 — Measure & double down
Track in `/analytics/events` + Stripe:
- Signups by `?ref=` and landing page (`utm` optional later)
- Calculator → signup conversion
- Which `/for/*` page gets traffic (Search Console)

Double content on the **top 2** landing pages next week.

## Weekly guide schedule (next 4 weeks)

| Week | Topic | Target search |
|------|-------|----------------|
| 1 | OpenAI keys | openai api key leak |
| 2 | Supabase service_role | supabase service role exposed |
| 3 | Stripe live vs test | stripe test key production |
| 4 | GitHub PAT rotation | github token in repo |

## Other high-ROI recommendations (low budget)

1. **`.env` safety scanner as lead magnet** — already at `/safety`; promote as "free leak scan"
2. **Chrome extension later** — scan GitHub paste before commit (week 2+)
3. **"SecretLayer vs .env file"** comparison page — captures evaluation searches
4. **List on** [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) alternatives thread (secrets section)
5. **Product Hunt** — launch when Stripe live + referral works (end of week 1 or week 2)
6. **YouTube Short** — 60s: "How much do your APIs cost?" using calculator
7. **Email capture on calculator** — optional: "Email my estimate" → waitlist

## What NOT to do (time/money sinks)

- Paid ads before organic proves a landing page converts
- Partnership outreach to OpenAI/Stripe (slow, low ROI for indies)
- Building 10 more features before distribution

## Success metrics (week 1)

| Metric | Target |
|--------|--------|
| Indexed pages | 15+ |
| Calculator uses | 100+ |
| Signups | 25+ |
| Referral shares | 10+ codes copied |
| Paid conversions | 2+ Personal (after Stripe live) |
