/**
 * scripts/push-to-github.mjs
 *
 * Pushes a list of local files to github.com/eolaniyan/mulah-platform
 * using the Replit GitHub connector (no PAT needed).
 *
 * Usage:
 *   node scripts/push-to-github.mjs                  # push default file set
 *   node scripts/push-to-github.mjs CURSOR.md        # push single file
 *   node scripts/push-to-github.mjs packages/shared-logic/src/api/finance.ts
 *
 * The connector requires the Replit GitHub integration to be wired to this Repl.
 * Run this from the Replit shell or from a code_execution cell.
 */

import fs from "fs";
import { ReplitConnectors } from "@replit/connectors-sdk";

const OWNER = "eolaniyan";
const REPO = "mulah-platform";
const BRANCH = "master";

const DEFAULT_FILES = [
  "CURSOR.md",
  "packages/shared-logic/package.json",
  "packages/shared-logic/tsconfig.json",
  "packages/shared-logic/src/index.ts",
  "packages/shared-logic/src/constants/index.ts",
  "packages/shared-logic/src/api/client.ts",
  "packages/shared-logic/src/api/auth.ts",
  "packages/shared-logic/src/api/subscriptions.ts",
  "packages/shared-logic/src/api/analytics.ts",
  "packages/shared-logic/src/api/iris.ts",
  "packages/shared-logic/src/api/finance.ts",
  "packages/shared-logic/src/hooks/useAuth.ts",
  "packages/shared-logic/src/hooks/useSubscriptions.ts",
  "packages/shared-logic/src/hooks/useCFA.ts",
  "packages/shared-logic/src/hooks/useIRIS.ts",
  "packages/shared-logic/src/hooks/useFinance.ts",
  "packages/shared-logic/src/utils/formatters.ts",
  "packages/shared-logic/src/utils/cfa.ts",
  "packages/shared-logic/src/utils/subscriptions.ts",
];

const connectors = new ReplitConnectors();

async function getSha(repoPath) {
  const res = await connectors.proxy(
    "github",
    `/repos/${OWNER}/${REPO}/contents/${repoPath}?ref=${BRANCH}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  const data = await res.json();
  return data.sha ?? null;
}

async function pushFile(localPath, repoPath = localPath) {
  if (!fs.existsSync(localPath)) {
    console.log(`⚠  skip  ${localPath} (not found locally)`);
    return;
  }
  const content = fs.readFileSync(localPath, "utf8");
  const encoded = Buffer.from(content).toString("base64");
  const sha = await getSha(repoPath);

  const body = {
    message: sha
      ? `chore: sync ${repoPath} from Replit`
      : `chore: add ${repoPath} from Replit`,
    content: encoded,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await connectors.proxy(
    "github",
    `/repos/${OWNER}/${REPO}/contents/${repoPath}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const status = res.status;
  if (status === 200 || status === 201) {
    console.log(`✓ ${repoPath} (${sha ? "updated" : "created"})`);
  } else {
    const data = await res.json();
    console.log(`✗ ${repoPath} — ${status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
}

const targets = process.argv.slice(2);
const files = targets.length > 0 ? targets : DEFAULT_FILES;

console.log(`Pushing ${files.length} file(s) → ${OWNER}/${REPO} [${BRANCH}]\n`);
for (const f of files) {
  await pushFile(f);
}
console.log("\nDone.");
