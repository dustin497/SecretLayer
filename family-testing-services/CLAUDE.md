# Family Testing Services — GoDaddy Node.js Hosting

Upload **this entire `family-testing-services` folder** to GoDaddy Node.js Hosting.

## Run locally before upload

```bash
npm install
npm start
```

Open http://localhost:3000

## After deploy

- Public site: https://family-testing.com
- Staff admin: https://family-testing.com/admin/
- Admin password: `fts2026`

## Structure

```
family-testing-services/
├── package.json      # start script
├── server.js         # Express static file server
├── public/           # Website files
│   ├── index.html
│   ├── about.html
│   ├── admin/        # Password-protected printable documents
│   ├── css/
│   ├── js/
│   └── images/
└── CLAUDE.md
```

## Custom domain

In GoDaddy Node.js Hosting UI → connect **family-testing.com** after publish.
