#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
process.chdir(root);

const generatedFiles = new Set(["package.json", "package-lock.json", "lib/changelog.json"]);
const changedFiles = execFileSync("git", ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "HEAD"], { encoding: "utf8" })
  .split(/\r?\n/)
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !generatedFiles.has(file));
const commitMessage = execFileSync("git", ["log", "-1", "--format=%s"], { encoding: "utf8" }).trim();

if (!commitMessage) process.exit(0);

const committedDiff = changedFiles.length > 0
  ? execFileSync("git", ["show", "--format=", "--binary", "HEAD", "--", ...changedFiles], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 })
  : "";
const fingerprint = createHash("sha256")
  .update(`${commitMessage}\0${changedFiles.join("\0")}\0${committedDiff}`)
  .digest("hex")
  .slice(0, 16);

const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const changelogPath = path.join(root, "lib", "changelog.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const packageLock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));

if (changelog[0]?.fingerprint === fingerprint) {
  console.log(`Version ${packageJson.version} wurde für diesen Commit bereits vorbereitet.`);
  process.exit(0);
}

const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(packageJson.version);
if (!match) throw new Error(`Ungültige Versionsnummer: ${packageJson.version}`);
const bump = process.env.VERSION_BUMP?.trim() || "patch";
const nextVersion = /^\d+\.\d+\.\d+$/.test(bump)
  ? bump
  : bump === "major"
    ? `${Number(match[1]) + 1}.0.0`
    : bump === "minor"
      ? `${match[1]}.${Number(match[2]) + 1}.0`
      : bump === "patch"
        ? `${match[1]}.${match[2]}.${Number(match[3]) + 1}`
        : "";
if (!nextVersion) throw new Error(`Unbekannter Versionssprung: ${bump}`);
if (nextVersion === packageJson.version) throw new Error("Die neue Version muss sich von der aktuellen Version unterscheiden.");

packageJson.version = nextVersion;
packageLock.version = nextVersion;
if (packageLock.packages?.[""]) packageLock.packages[""].version = nextVersion;
changelog.unshift({
  version: nextVersion,
  date: new Date().toISOString().slice(0, 10),
  title: commitMessage,
  fileCount: changedFiles.length,
  files: changedFiles,
  fingerprint,
});

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
fs.writeFileSync(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
fs.writeFileSync(changelogPath, `${JSON.stringify(changelog, null, 2)}\n`);
execFileSync("git", ["add", "--", "package.json", "package-lock.json", "lib/changelog.json"], { stdio: "inherit" });
execFileSync("git", ["commit", "--amend", "--no-edit", "--no-verify"], {
  stdio: "inherit",
  env: { ...process.env, VERSION_HOOK_RUNNING: "1" },
});
console.log(`Version automatisch auf ${nextVersion} erhöht und in den Commit aufgenommen.`);
