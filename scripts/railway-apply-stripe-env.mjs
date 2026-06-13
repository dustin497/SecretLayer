#!/usr/bin/env node
/**
 * Push .env.stripe.generated vars to Railway and trigger a redeploy.
 *
 * Requires one of: RAILWAY_API_TOKEN, RAILWAY_TOKEN, Railway (Cursor secret)
 * Optional: RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID, RAILWAY_SERVICE_ID
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const ENV_FILE = resolve(process.cwd(), ".env.stripe.generated");

function resolveRailwayToken() {
  const apiToken =
    process.env.RAILWAY_API_TOKEN ||
    process.env.Railway_API_Token ||
    process.env.Railway;
  const projectToken = process.env.RAILWAY_TOKEN || process.env.railway;
  if (apiToken) return { kind: "account", token: apiToken };
  if (projectToken) return { kind: "project", token: projectToken };
  return null;
}

function parseEnvFile(path) {
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    vars[trimmed.slice(0, i)] = trimmed.slice(i + 1);
  }
  return vars;
}

function expandStripeAliases(vars) {
  const out = { ...vars };
  out.API_ORIGIN ??= process.env.API_ORIGIN ?? "https://api.secretlayer.net";
  out.NODE_ENV ??= "production";
  if (out.STRIPE_PRICE_PERSONAL) out.STRIPE_PRICE_ID_PERSONAL = out.STRIPE_PRICE_PERSONAL;
  if (out.STRIPE_PRICE_PRO) out.STRIPE_PRICE_ID_PRO = out.STRIPE_PRICE_PRO;
  return out;
}

async function gql(auth, query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth.kind === "project") {
    headers["Project-Access-Token"] = auth.token;
  } else {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function discoverTargets(auth) {
  const projectId = process.env.RAILWAY_PROJECT_ID;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
  const serviceId = process.env.RAILWAY_SERVICE_ID;

  if (projectId && environmentId && serviceId) {
    return { projectId, environmentId, serviceId };
  }

  const data = await gql(
    auth,
    `query {
      projects {
        edges {
          node {
            id
            name
            environments { edges { node { id name } } }
            services { edges { node { id name } } }
          }
        }
      }
    }`,
  );

  const projects = data.projects.edges.map((e) => e.node);
  const match =
    projects.find((p) => /secretlayer/i.test(p.name)) ??
    projects.find((p) =>
      p.services.edges.some((s) => /secretlayer|api|backend/i.test(s.node.name)),
    ) ??
    projects[0];

  if (!match) throw new Error("No Railway projects found for this token.");

  const env =
    match.environments.edges.find((e) => e.node.name === "production")?.node ??
    match.environments.edges[0]?.node;
  const service =
    match.services.edges.find((s) => /api|backend|secretlayer/i.test(s.node.name))?.node ??
    match.services.edges[0]?.node;

  if (!env || !service) {
    throw new Error(`Could not resolve environment/service for project "${match.name}".`);
  }

  return {
    projectId: projectId ?? match.id,
    environmentId: environmentId ?? env.id,
    serviceId: serviceId ?? service.id,
    projectName: match.name,
    environmentName: env.name,
    serviceName: service.name,
  };
}

async function upsertVariables(auth, target, variables) {
  await gql(
    auth,
    `mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId: target.projectId,
        environmentId: target.environmentId,
        serviceId: target.serviceId,
        variables,
        replace: false,
      },
    },
  );
}

async function triggerDeploy(auth, target) {
  await gql(
    auth,
    `mutation deploymentTrigger($input: DeploymentTriggerInput!) {
      deploymentTrigger(input: $input)
    }`,
    {
      input: {
        projectId: target.projectId,
        environmentId: target.environmentId,
        serviceId: target.serviceId,
      },
    },
  );
}

function runStripeSetup() {
  execFileSync("pnpm", ["stripe:setup"], {
    stdio: "inherit",
    env: process.env,
  });
}

async function main() {
  const auth = resolveRailwayToken();
  if (!auth) {
    console.error(`
SecretLayer Railway apply — missing Railway token

Add ONE of these to Cursor → Settings → Cloud Agents → Secrets, then start a new agent:

  Name: RAILWAY_API_TOKEN
  Value: account token from https://railway.com/account/tokens

Or a project token:

  Name: RAILWAY_TOKEN
  Value: project token from Railway project → Settings → Tokens

Then run:
  WEB_ORIGIN=https://secretlayer.net API_ORIGIN=https://api.secretlayer.net pnpm stripe:railway
`);
    process.exit(1);
  }

  if (!existsSync(ENV_FILE)) {
    console.log("No .env.stripe.generated — running pnpm stripe:setup first...\n");
    runStripeSetup();
  }

  const vars = expandStripeAliases(parseEnvFile(ENV_FILE));
  const keys = Object.keys(vars).sort();
  console.log("SecretLayer Railway apply\n");
  console.log(`Variables (${keys.length}): ${keys.join(", ")}\n`);

  const target = await discoverTargets(auth);
  console.log(
    `Target: project=${target.projectName ?? target.projectId} env=${target.environmentName ?? target.environmentId} service=${target.serviceName ?? target.serviceId}\n`,
  );

  await upsertVariables(auth, target, vars);
  console.log("✓ Railway variables updated");

  await triggerDeploy(auth, target);
  console.log("✓ Redeploy triggered");

  console.log("\nVerify:");
  console.log("  curl https://api.secretlayer.net/health");
  console.log("  https://secretlayer.net → Upgrade → Stripe Checkout");
}

main().catch((err) => {
  console.error(`\nRailway apply failed: ${err.message}`);
  process.exit(1);
});
