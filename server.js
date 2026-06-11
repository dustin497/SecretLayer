const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const logPath = path.join(dataDir, "verification-log.json");

app.use(express.json({ limit: "32kb" }));

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "fts2026";
}

function requireAdmin(req, res, next) {
  const header = req.get("X-Admin-Password") || "";
  const bearer = (req.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const provided = header || bearer;
  if (provided !== adminPassword()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readLog() {
  ensureDataDir();
  if (!fs.existsSync(logPath)) {
    const empty = { nextSeq: 1, records: [] };
    fs.writeFileSync(logPath, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(logPath, "utf8"));
}

function writeLog(data) {
  ensureDataDir();
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeDob(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const mm = us[1].padStart(2, "0");
    const dd = us[2].padStart(2, "0");
    return `${us[3]}-${mm}-${dd}`;
  }
  return normalizeText(raw);
}

function prefixForTestType(testType) {
  if (testType === "urine-12") return "UR";
  if (testType === "custody-only") return "NK";
  return "NK";
}

function makeIds(seq, testType) {
  const year = new Date().getFullYear();
  const padded = String(seq).padStart(5, "0");
  const prefix = prefixForTestType(testType);
  return {
    reportId: `FTS-RPT-${year}-${padded}`,
    specimenId: `FTS-${prefix}-${year}-${padded}`,
  };
}

// Admin password config for browser auth
app.get("/admin/js/auth-config.js", (_req, res) => {
  res.type("application/javascript");
  res.send(`window.__FTS_ADMIN_PASSWORD__=${JSON.stringify(adminPassword())};`);
});

// Public verification lookup (no PHI beyond match confirmation)
app.post("/api/verify", (req, res) => {
  const reportId = normalizeText(req.body.reportId).toUpperCase().replace(/\s+/g, "");
  const lastName = normalizeText(req.body.lastName);
  const dob = normalizeDob(req.body.dob);

  if (!reportId || !lastName || !dob) {
    return res.status(400).json({
      verified: false,
      message: "Report ID, last name, and date of birth are required.",
    });
  }

  const log = readLog();
  const record = log.records.find((r) => {
    const idMatch = normalizeText(r.reportId).toUpperCase().replace(/\s+/g, "") === reportId;
    const nameMatch = normalizeText(r.lastName) === lastName;
    const dobMatch = normalizeDob(r.dob) === dob;
    return idMatch && nameMatch && dobMatch;
  });

  if (!record) {
    return res.json({
      verified: false,
      message:
        "We could not verify this information. If you are an authorized party, call (205) 579-0707 with written authorization from the donor.",
    });
  }

  return res.json({
    verified: true,
    reportId: record.reportId,
    specimenId: record.specimenId,
    collectionDate: record.collectionDate,
    testType: record.testTypeLabel || record.testType,
    message:
      "A collection record matching this information is on file at Family Testing Services. Detailed results require written authorization per HIPAA. Call (205) 579-0707 to request verification by phone.",
  });
});

// Admin: list records (newest first)
app.get("/api/admin/verify-records", requireAdmin, (_req, res) => {
  const log = readLog();
  res.json({
    nextSeq: log.nextSeq,
    records: [...log.records].reverse(),
  });
});

// Admin: create record
app.post("/api/admin/verify-records", requireAdmin, (req, res) => {
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const dob = String(req.body.dob || "").trim();
  const collectionDate = String(req.body.collectionDate || "").trim();
  const testType = String(req.body.testType || "nail-14").trim();
  const result = String(req.body.result || "pending").trim();
  const authorizedParty = String(req.body.authorizedParty || "").trim();
  const notes = String(req.body.notes || "").trim();

  if (!firstName || !lastName || !dob || !collectionDate) {
    return res.status(400).json({ error: "First name, last name, DOB, and collection date are required." });
  }

  const labels = {
    "nail-14": "14-Panel Nail Keratin",
    "urine-12": "12-Panel Urine (Non-DOT)",
    "custody-only": "Nail Collection / Chain of Custody",
  };

  const log = readLog();
  const seq = log.nextSeq;
  const ids = makeIds(seq, testType);
  const record = {
    id: `rec-${seq}`,
    ...ids,
    firstName,
    lastName,
    dob: normalizeDob(dob),
    collectionDate,
    testType,
    testTypeLabel: labels[testType] || testType,
    result,
    authorizedParty,
    notes,
    createdAt: new Date().toISOString(),
  };

  log.records.push(record);
  log.nextSeq = seq + 1;
  writeLog(log);

  res.status(201).json({ record });
});

app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/verify", (_req, res) => {
  res.sendFile(path.join(publicDir, "verify.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Family Testing Services running on port ${port}`);
});
