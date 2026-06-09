# Upload to GoDaddy — Do This Now (5 minutes)

Your domain **family-testing.com** is live but shows GoDaddy's "Launching Soon" placeholder.
You need to upload our site to **Node.js Hosting** and connect the domain.

## Step 1 — Download this folder

From GitHub: https://github.com/dustin497/SecretLayer/tree/main/family-testing-services

Click **Code** → **Download ZIP** → unzip → open **family-testing-services** folder.

(Your `C:\Users\dusti\Downloads\family drug test` folder should have the same files:
`package.json`, `server.js`, `public` folder.)

## Step 2 — GoDaddy Node.js Hosting

1. Go to **https://www.godaddy.com** → sign in
2. **My Products**
3. Find **Node.js Hosting** (if you don't have it, add it to your account)
4. Click **Create Application** or **Upload**
5. Upload the **family-testing-services** folder (zip it first if needed)
6. Wait for build to finish (npm install + npm start)

## Step 3 — Replace the "Launching Soon" site

Your domain is currently on **GoDaddy Website Builder**. You must connect it to Node.js Hosting instead:

1. In Node.js Hosting → your new app → **Settings** or **Domains**
2. Click **Add domain** → type **family-testing.com**
3. GoDaddy will switch the domain from Website Builder to your Node.js app
4. Click **Publish** if there is a publish button

## Step 4 — Test

- https://family-testing.com
- https://family-testing.com/admin/ (password: **fts2026**)

## If you only see Website Builder (no Node.js Hosting)

1. **My Products** → **Add product** → search **Node.js Hosting**
2. Purchase/add it (may be included with your plan)
3. Then follow Step 2 above

## Files that MUST be in the upload

```
family-testing-services/
├── package.json
├── server.js
└── public/
    ├── index.html
    ├── about.html
    ├── admin/
    ├── css/
    ├── js/
    └── images/
```

Do NOT upload only the `public` folder — Node.js Hosting needs `package.json` and `server.js` at the root.
