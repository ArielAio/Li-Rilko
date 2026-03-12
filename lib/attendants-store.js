import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { defaultAttendants } from "@/lib/attendants-data";
import { sanitizeAttendants, validateAttendantsInput } from "@/lib/attendants-utils";

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY_BRANCH = "main";
const DEFAULT_ATTENDANTS_FILE_PATH = "data/attendants.json";

export class AttendantsValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AttendantsValidationError";
  }
}

export class AttendantsGitHubSyncError extends Error {
  constructor(message) {
    super(message);
    this.name = "AttendantsGitHubSyncError";
  }
}

function getAttendantsFilePath() {
  return process.env.GITHUB_ATTENDANTS_PATH || DEFAULT_ATTENDANTS_FILE_PATH;
}

function getRepositoryConfig() {
  const token = process.env.GITHUB_TOKEN || "";
  const owner = process.env.GITHUB_REPO_OWNER || "";
  const repo = process.env.GITHUB_REPO_NAME || "";
  const branch = process.env.GITHUB_REPO_BRANCH || DEFAULT_REPOSITORY_BRANCH;
  const filePath = getAttendantsFilePath();

  if (!token || !owner || !repo) {
    throw new Error(
      "Configuração do GitHub incompleta. Defina GITHUB_TOKEN, GITHUB_REPO_OWNER e GITHUB_REPO_NAME.",
    );
  }

  return { token, owner, repo, branch, filePath };
}

function getAttendantsFileAbsolutePath() {
  return path.join(process.cwd(), getAttendantsFilePath());
}

function getGitHubContentApiUrl({ owner, repo, filePath }) {
  const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, "/");
  return `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${encodedPath}`;
}

function getGitHubContentReadUrl(config) {
  const contentApiUrl = getGitHubContentApiUrl(config);
  return `${contentApiUrl}?ref=${encodeURIComponent(config.branch)}`;
}

async function parseGitHubErrorMessage(response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Ignora erro de parse e usa fallback.
  }

  return `${response.status} ${response.statusText}`;
}

async function fetchCurrentFileSha(config) {
  const response = await fetch(getGitHubContentReadUrl(config), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    throw new AttendantsGitHubSyncError(`Falha ao buscar arquivo no GitHub: ${reason}`);
  }

  const payload = await response.json();
  return typeof payload?.sha === "string" ? payload.sha : null;
}

export async function readAttendantsFromRepositoryFile() {
  try {
    const serialized = await readFile(getAttendantsFileAbsolutePath(), "utf8");
    const parsed = JSON.parse(serialized);
    return sanitizeAttendants(parsed?.attendants);
  } catch {
    return defaultAttendants;
  }
}

export async function updateAttendantsInRepository(rawAttendants) {
  const validation = validateAttendantsInput(rawAttendants);
  if (!validation.ok) {
    throw new AttendantsValidationError(validation.error);
  }

  const config = getRepositoryConfig();
  const fileSha = await fetchCurrentFileSha(config);
  const nextContent = `${JSON.stringify({ attendants: validation.attendants }, null, 2)}\n`;

  const payload = {
    message: "chore: update attendants via admin panel",
    content: Buffer.from(nextContent, "utf8").toString("base64"),
    branch: config.branch,
  };

  if (fileSha) {
    payload.sha = fileSha;
  }

  const response = await fetch(getGitHubContentApiUrl(config), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    throw new AttendantsGitHubSyncError(`Falha ao salvar atendentes no GitHub: ${reason}`);
  }

  const result = await response.json();

  return {
    attendants: validation.attendants,
    commitSha: result?.commit?.sha || "",
  };
}
