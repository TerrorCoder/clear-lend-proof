// Copies the compiled contract's prover keys and ZK IR into public/ so the
// browser's FetchZkConfigProvider can fetch them from this origin at
// /keys/<circuit>.prover and /zkir/<circuit>.bzkir.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const managed = join(root, "contract", "src", "managed", "clearlend");

if (!existsSync(managed)) {
  console.error("No compiled contract found — run `npm run compact` first.");
  process.exit(1);
}

for (const dir of ["keys", "zkir"]) {
  const src = join(managed, dir);
  const dest = join(root, "public", dir);
  if (!existsSync(src)) {
    console.error(`Missing ${src} in compiled output.`);
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${dir} -> public/${dir}`);
}
