import {
  copyFile,
  cp,
  mkdir,
  rm,
} from "node:fs/promises";
import {
  basename,
  dirname,
  resolve,
} from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist");
if (dirname(output) !== root || basename(output) !== "dist") {
  throw new Error("Diretorio de saida invalido.");
}

const publicFiles = [
  "_headers",
  "app.js",
  "cloudflare-sync.js",
  "goals-patch.css",
  "goals-patch.js",
  "index.html",
  "legacy-redirect.js",
  "login.html",
  "login.js",
  "styles.css",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(
  publicFiles.map((file) => copyFile(resolve(root, file), resolve(output, file))),
);
await cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });

console.log(`Build preparado em ${output}`);
