import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readLegalDocuments } from "./legal-pages.mjs";

const source = process.argv[2];
if (!source || process.argv.length !== 3)
  throw new Error(
    "Usage: node scripts/sync-legal.mjs /path/to/plemu-web/lib/legal-documents.json",
  );
const path = resolve(source);
const { data, sha256 } = await readLegalDocuments(path);
const cwd = dirname(path);
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd,
  encoding: "utf8",
}).trim();
const committed = execFileSync(
  "git",
  ["show", `${commit}:lib/legal-documents.json`],
  { cwd },
);
const bytes = await readFile(path);
if (!committed.equals(bytes))
  throw new Error(
    "Commit the reviewed canonical web policy before exporting it",
  );
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await writeFile(resolve(root, "legal/legal-documents.json"), bytes);
await writeFile(
  resolve(root, "legal/source.json"),
  JSON.stringify(
    {
      canonicalRepository: "https://github.com/plemulabs/plemu-web",
      canonicalPath: "lib/legal-documents.json",
      canonicalCommit: commit,
      sha256,
      version: data.version,
      status: data.status,
      effectiveDate: data.effectiveDate ?? null,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Exported reviewed legal version ${data.version}, SHA-256 ${sha256}`,
);
