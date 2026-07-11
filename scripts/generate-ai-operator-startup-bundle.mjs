#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const knowledgeBaseDir = path.join(repoRoot, "AO-Knowledge-Base");
const outputPath = path.join(knowledgeBaseDir, "AI_OPERATOR_STARTUP_BUNDLE.md");

function repoPath(...segments) {
  return path.join(repoRoot, ...segments);
}

function displayPath(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll(path.sep, "/");
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function requireFile(relativePath) {
  const absolutePath = repoPath(...relativePath.split("/"));
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

function getContinuityVersion(projectIndexContent) {
  const match = projectIndexContent.match(/## Continuity System Version\s+([\s\S]*?)(?:\n## |\n# |$)/);
  if (!match) {
    fail("Continuity System Version could not be found in AO-Knowledge-Base/99 - PROJECT_INDEX.md");
  }
  const version = match[1].trim().split(/\r?\n/)[0]?.trim();
  if (!version) {
    fail("Continuity System Version is blank in AO-Knowledge-Base/99 - PROJECT_INDEX.md");
  }
  return version;
}

function getLatestSprintSummary() {
  const sprintSummaryDir = repoPath("AO-Knowledge-Base", "07 - Sprint Summaries");
  if (!existsSync(sprintSummaryDir)) {
    fail("Required sprint summary folder missing: AO-Knowledge-Base/07 - Sprint Summaries");
  }

  const sprintFiles = readdirSync(sprintSummaryDir)
    .filter((fileName) => /^Sprint \d+ - .+\.md$/i.test(fileName))
    .map((fileName) => {
      const match = fileName.match(/^Sprint (\d+) - /i);
      return {
        fileName,
        sprintNumber: match ? Number.parseInt(match[1], 10) : -1,
      };
    })
    .sort((a, b) => {
      if (a.sprintNumber !== b.sprintNumber) {
        return b.sprintNumber - a.sprintNumber;
      }
      return a.fileName.localeCompare(b.fileName);
    });

  if (sprintFiles.length === 0) {
    fail("No sprint summary files found in AO-Knowledge-Base/07 - Sprint Summaries");
  }

  const latest = sprintFiles[0];
  return {
    title: latest.fileName.replace(/\.md$/i, ""),
    relativePath: `AO-Knowledge-Base/07 - Sprint Summaries/${latest.fileName}`,
  };
}

function getStandardsDocuments() {
  const standardsDir = repoPath("AO-Knowledge-Base", "10 - Standards");
  if (!existsSync(standardsDir)) {
    fail("Required standards folder missing: AO-Knowledge-Base/10 - Standards");
  }

  const preferredOrder = [
    "README.md",
    "Automation Standards.md",
    "Business Standards.md",
    "Coding Standards.md",
    "Department Standards.md",
    "Documentation Standards.md",
    "UI Standards.md",
    "Workflow Standards.md",
  ];

  const existingMarkdown = new Set(
    readdirSync(standardsDir).filter((fileName) => fileName.toLowerCase().endsWith(".md")),
  );

  const ordered = preferredOrder.filter((fileName) => existingMarkdown.has(fileName));
  const unordered = [...existingMarkdown]
    .filter((fileName) => !preferredOrder.includes(fileName))
    .sort((a, b) => a.localeCompare(b));

  const standardFiles = [...ordered, ...unordered];
  if (standardFiles.length === 0) {
    fail("No standards documents found in AO-Knowledge-Base/10 - Standards");
  }

  return standardFiles.map((fileName) => `AO-Knowledge-Base/10 - Standards/${fileName}`);
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

const projectIndex = readRequired("AO-Knowledge-Base/99 - PROJECT_INDEX.md");
const continuityVersion = getContinuityVersion(projectIndex.content);
const latestSprint = getLatestSprintSummary();

const sourceDocuments = [
  {
    ...projectIndex,
    title: "Project Index",
  },
  {
    ...readRequired("AO-Knowledge-Base/README.md"),
    title: "Vision",
  },
  {
    ...readRequired("AO-Knowledge-Base/00 - Vision/AI Operator OS Philosophy.md"),
    title: "AI Operator OS Philosophy",
  },
  {
    ...readRequired("AO-Knowledge-Base/02 - Architecture/Architecture v2 - Operating System Foundation.md"),
    title: "Architecture v2",
  },
  ...getStandardsDocuments().map((relativePath) => readRequired(relativePath)),
  {
    ...readRequired("AO-Knowledge-Base/98 - ACTIVE_PROJECT_STATE.md"),
    title: "Active Project State",
  },
  {
    ...readRequired("AO-Knowledge-Base/DEVELOPMENT_STATE.md"),
    title: "Development State",
  },
  {
    ...readRequired("AO-Knowledge-Base/CURRENT_CONTEXT.md"),
    title: "Current Context",
  },
  {
    ...readRequired(latestSprint.relativePath),
    title: latestSprint.title,
  },
  {
    ...readRequired("AO-Knowledge-Base/OPERATOR_STARTUP_REPORT_TEMPLATE.md"),
    title: "Operator Startup Report Template",
  },
];

const generationDate = new Date().toISOString().slice(0, 10);
const currentGitCommit = getGitCommit();

const bundle = [
  "# AI Operator Startup Bundle",
  "",
  "> This file is generated from the authoritative AO Knowledge Base. Do not edit it directly. Update the source documents and regenerate the bundle.",
  "",
  "## Bundle Metadata",
  "",
  `- Bundle generation date: ${generationDate}`,
  `- Continuity System Version: ${continuityVersion}`,
  `- Latest Sprint included: ${latestSprint.title}`,
  `- Current Git commit: ${currentGitCommit}`,
  "",
  "## Included Documents",
  "",
  ...sourceDocuments.map((document, index) => `${index + 1}. ${document.title} — \`${document.sourcePath}\``),
  "",
  ...sourceDocuments.map(renderDocument),
].join("\n");

writeFileSync(outputPath, `${bundle.trimEnd()}\n`, "utf8");

console.log(`Generated ${displayPath(outputPath)}`);
console.log(`Included ${sourceDocuments.length} documents.`);
console.log(`Latest Sprint included: ${latestSprint.title}`);
