#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputPath = path.join(repoRoot, "AO-Knowledge-Base", "AI_OPERATOR_STARTUP_BUNDLE.md");
const projectIndexPath = "AO-Knowledge-Base/99 - PROJECT_INDEX.md";
const activeProjectStatePath = "AO-Knowledge-Base/98 - ACTIVE_PROJECT_STATE.md";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function toAbsolutePath(relativePath) {
  return path.join(repoRoot, ...relativePath.split("/"));
}

function displayPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll(path.sep, "/");
}

function requireFile(relativePath) {
  const absolutePath = toAbsolutePath(relativePath);
  if (!existsSync(absolutePath)) {
    fail(`Required source document missing: ${relativePath}`);
  }
  return absolutePath;
}

function readRequired(relativePath) {
  const absolutePath = requireFile(relativePath);
  return {
    title: path.basename(relativePath, ".md"),
    sourcePath: displayPath(absolutePath),
    content: readFileSync(absolutePath, "utf8").trimEnd(),
  };
}

function extractSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^## ${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?=^## |^# |$(?![\\s\\S]))`, "m");
  const match = content.match(pattern);
  if (!match) {
    fail(`Required section missing: ## ${heading}`);
  }
  return match[1].trim();
}

function extractSingleLineField(content, heading) {
  const section = extractSection(content, heading);
  const value = section.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  if (!value) {
    fail(`Required field is blank: ## ${heading}`);
  }
  return value.replace(/\.$/, "");
}

function extractRequiredReadingPaths(projectIndexContent) {
  const section = extractSection(projectIndexContent, "Required Reading Order");
  const matches = [...section.matchAll(/^\d+\.\s+`([^`]+\.md)`\s*$/gm)];

  if (matches.length === 0) {
    fail("No exact markdown paths found in Project Index Required Reading Order.");
  }

  const paths = matches.map((match) => match[1]);
  const uniquePaths = new Set(paths);
  if (uniquePaths.size !== paths.length) {
    fail("Duplicate paths found in Project Index Required Reading Order.");
  }

  return paths;
}

function extractPointer(activeProjectStateContent, label) {
  const section = extractSection(activeProjectStateContent, "Continuity Document Pointers");
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp("^- " + escapedLabel + ": `([^`]+\\.md)`\\s*$", "m");
  const match = section.match(pattern);

  if (!match) {
    fail(`Required continuity pointer missing or malformed: ${label}`);
  }

  const relativePath = match[1];
  requireFile(relativePath);
  return relativePath;
}

function findGitExecutable() {
  const directCandidates = [
    "git",
    process.env.GIT_EXECUTABLE,
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Git", "cmd", "git.exe") : undefined,
    process.env["ProgramFiles(x86)"] ? path.join(process.env["ProgramFiles(x86)"], "Git", "cmd", "git.exe") : undefined,
  ].filter(Boolean);

  for (const candidate of directCandidates) {
    try {
      execFileSync(candidate, ["--version"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  const githubDesktopDir = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "GitHubDesktop")
    : undefined;

  if (!githubDesktopDir || !existsSync(githubDesktopDir)) {
    return undefined;
  }

  const stack = [githubDesktopDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    let entries = [];

    try {
      entries = readdirSync(currentDir);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry);
      let stats;

      try {
        stats = statSync(entryPath);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.toLowerCase() !== "git.exe") {
        continue;
      }

      const normalized = entryPath.replaceAll("\\", "/").toLowerCase();
      if (!normalized.includes("/resources/app/git/cmd/git.exe")) {
        continue;
      }

      try {
        execFileSync(entryPath, ["--version"], {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
        return entryPath;
      } catch {
        // Keep searching.
      }
    }
  }

  return undefined;
}

function getGitCommit() {
  const gitExecutable = findGitExecutable();
  if (!gitExecutable) {
    return "REQUIRES VERIFICATION - git executable could not be found";
  }

  try {
    return execFileSync(gitExecutable, ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "REQUIRES VERIFICATION - git commit could not be retrieved";
  }
}

function renderDocument(document) {
  return [
    "---",
    "",
    `## Source: ${document.sourcePath}`,
    "",
    document.content,
    "",
  ].join("\n");
}

const projectIndex = readRequired(projectIndexPath);
const activeProjectState = readRequired(activeProjectStatePath);

const continuityVersion = extractSingleLineField(projectIndex.content, "Continuity System Version");
const projectVersion = extractSingleLineField(activeProjectState.content, "Current Version");
const currentSprint = extractSingleLineField(activeProjectState.content, "Current Sprint");
const lastCompletedSprint = extractSingleLineField(activeProjectState.content, "Last Completed Sprint");
const currentSprintSummaryPath = extractPointer(activeProjectState.content, "Current Sprint Summary");

const requiredReadingPaths = extractRequiredReadingPaths(projectIndex.content);
if (!requiredReadingPaths.includes(currentSprintSummaryPath)) {
  fail("Project Index Required Reading Order does not include the Current Sprint Summary pointer from Active Project State.");
}

for (const requiredPath of requiredReadingPaths) {
  requireFile(requiredPath);
}

const sourceDocuments = requiredReadingPaths.map((requiredPath) => readRequired(requiredPath));
const generationDate = new Date().toISOString().slice(0, 10);
const currentGitCommit = getGitCommit();
const validationStatus = "VALID";

const bundle = [
  "# AI Operator Startup Bundle",
  "",
  "> This file is generated from the authoritative AO Knowledge Base. Do not edit it directly. Update the source documents and regenerate the bundle.",
  "",
  "## Bundle Metadata",
  "",
  `- Bundle generation date: ${generationDate}`,
  `- Continuity System Version: ${continuityVersion}`,
  `- Project Version: ${projectVersion}`,
  `- Current Sprint: ${currentSprint}`,
  `- Last Completed Sprint: ${lastCompletedSprint}`,
  `- Current Sprint Summary path: ${currentSprintSummaryPath}`,
  `- Git commit: ${currentGitCommit}`,
  `- Number of included documents: ${sourceDocuments.length}`,
  `- Bundle Validation Status: ${validationStatus}`,
  "",
  "## Included Documents",
  "",
  ...sourceDocuments.map((document, index) => `${index + 1}. ${document.title} - \`${document.sourcePath}\``),
  "",
  ...sourceDocuments.map(renderDocument),
].join("\n");

writeFileSync(outputPath, `${bundle.trimEnd()}\n`, "utf8");

console.log(`Generated ${displayPath(outputPath)}`);
console.log(`Included ${sourceDocuments.length} documents.`);
console.log(`Current Sprint Summary: ${currentSprintSummaryPath}`);
console.log(`Bundle Validation Status: ${validationStatus}`);
