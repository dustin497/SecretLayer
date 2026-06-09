#!/usr/bin/env node
/**
 * Add and verify custom domain on Render for family-testing-services.
 * Requires: RENDER_API_KEY
 */

const API_KEY = process.env.RENDER_API_KEY;
const API_BASE = "https://api.render.com/v1";
const SERVICE_NAME = "family-testing-services";
const DOMAIN = process.env.CUSTOM_DOMAIN || "family-testing.com";
const RENDER_SUBDOMAIN = `${SERVICE_NAME}.onrender.com`;

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function findService() {
  const owners = await api("/owners?limit=20");
  for (const entry of owners) {
    const owner = entry.owner || entry;
    const data = await api(
      `/services?ownerId=${owner.id}&name=${encodeURIComponent(SERVICE_NAME)}&limit=20`
    );
    const service = (Array.isArray(data) ? data : [])
      .map((item) => item.service || item)
      .find((s) => s.name === SERVICE_NAME);
    if (service) return service;
  }
  return null;
}

async function listDomains(serviceId) {
  const data = await api(`/services/${serviceId}/custom-domains`);
  return (Array.isArray(data) ? data : []).map((item) => item.customDomain || item);
}

async function addDomain(serviceId, name) {
  return api(`/services/${serviceId}/custom-domains`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

async function verifyDomain(serviceId, name) {
  return api(`/services/${serviceId}/custom-domains/${encodeURIComponent(name)}/verify`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

function printGoDaddyDns() {
  console.log("\nGoDaddy DNS (https://dcc.godaddy.com/manage/family-testing.com/dns):");
  console.log("  Remove old A records pointing to GoDaddy parking if present.");
  console.log("  Remove any AAAA records.");
  console.log("");
  console.log("  Add / update:");
  console.log(`    Type: A     | Name: @   | Value: 216.24.57.1`);
  console.log(`    Type: CNAME | Name: www | Value: ${RENDER_SUBDOMAIN}`);
  console.log("");
  console.log("  After DNS propagates (5–30 min), verify in Render Dashboard.");
}

async function main() {
  if (!API_KEY) {
    console.error("Missing RENDER_API_KEY.");
    printGoDaddyDns();
    process.exit(1);
  }

  const service = await findService();
  if (!service) throw new Error(`Service not found: ${SERVICE_NAME}`);

  console.log(`Service: ${service.id}`);

  const existing = await listDomains(service.id);
  const names = existing.map((d) => d.name);
  if (!names.includes(DOMAIN)) {
    console.log(`Adding domain: ${DOMAIN}`);
    await addDomain(service.id, DOMAIN);
  } else {
    console.log(`Domain already added: ${DOMAIN}`);
  }

  const domains = await listDomains(service.id);
  for (const d of domains) {
    console.log(`- ${d.name} (${d.verificationStatus || "pending"})`);
  }

  printGoDaddyDns();

  try {
    console.log(`\nAttempting verification for ${DOMAIN}...`);
    const result = await verifyDomain(service.id, DOMAIN);
    const status = result.customDomain?.verificationStatus || result.verificationStatus || "unknown";
    console.log(`Verification: ${status}`);
  } catch (err) {
    console.log(`Verification not ready yet: ${err.message}`);
    console.log("Update GoDaddy DNS, wait a few minutes, then run this script again.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
