#!/usr/bin/env node
/**
 * Create or update family-testing-services on Render via REST API.
 * Requires: RENDER_API_KEY (from https://dashboard.render.com/u/settings#api-keys)
 */

const API_KEY = process.env.RENDER_API_KEY;
const API_BASE = "https://api.render.com/v1";

const CONFIG = {
  name: "family-testing-services",
  repo: "https://github.com/dustin497/SecretLayer",
  branch: "render-deploy",
  buildCommand: "npm install && npm run build",
  startCommand: "npm start",
  healthCheckPath: "/health",
  region: "ohio",
  plan: "free",
};

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

async function listOwners() {
  const data = await api("/owners?limit=20");
  return data.map((entry) => entry.owner || entry);
}

async function findService(ownerId) {
  const data = await api(
    `/services?ownerId=${ownerId}&name=${encodeURIComponent(CONFIG.name)}&limit=20`
  );
  const items = Array.isArray(data) ? data : [];
  return items.map((entry) => entry.service || entry).find((s) => s.name === CONFIG.name);
}

async function createService(ownerId) {
  return api("/services", {
    method: "POST",
    body: JSON.stringify({
      type: "web_service",
      name: CONFIG.name,
      ownerId,
      repo: CONFIG.repo,
      branch: CONFIG.branch,
      autoDeploy: "yes",
      serviceDetails: {
        runtime: "node",
        plan: CONFIG.plan,
        region: CONFIG.region,
        healthCheckPath: CONFIG.healthCheckPath,
        envSpecificDetails: {
          buildCommand: CONFIG.buildCommand,
          startCommand: CONFIG.startCommand,
        },
      },
      envVars: [
        { key: "NODE_ENV", value: "production" },
        { key: "ADMIN_PASSWORD", value: process.env.ADMIN_PASSWORD || "fts2026" },
      ],
    }),
  });
}

async function triggerDeploy(serviceId) {
  return api(`/services/${serviceId}/deploys`, {
    method: "POST",
    body: JSON.stringify({ clearCache: "do_not_clear" }),
  });
}

async function main() {
  if (!API_KEY) {
    console.error("Missing RENDER_API_KEY.");
    console.error("Get one at https://dashboard.render.com/u/settings#api-keys");
    console.error("Or use one-click deploy:");
    console.error(
      `https://render.com/deploy?repo=${CONFIG.repo}/tree/${CONFIG.branch}`
    );
    process.exit(1);
  }

  const owners = await listOwners();
  if (!owners.length) throw new Error("No Render workspaces found for this API key.");

  const ownerId = process.env.RENDER_OWNER_ID || owners[0].id;
  console.log(`Using workspace: ${owners.find((o) => o.id === ownerId)?.name || ownerId}`);

  let service = await findService(ownerId);
  if (service) {
    console.log(`Service exists: ${service.id} (${service.serviceDetails?.url || "pending URL"})`);
  } else {
    console.log("Creating service...");
    const created = await createService(ownerId);
    service = created.service || created;
    console.log(`Created: ${service.id}`);
  }

  console.log("Triggering deploy...");
  const deploy = await triggerDeploy(service.id);
  const deployId = deploy.id || deploy.deploy?.id;
  console.log(`Deploy started: ${deployId}`);
  console.log(`URL: https://${CONFIG.name}.onrender.com`);
  console.log(`Health: https://${CONFIG.name}.onrender.com/health`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
