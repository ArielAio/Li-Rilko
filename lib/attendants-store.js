import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { defaultAttendants } from "@/lib/attendants-data";
import { sanitizeAttendants, validateAttendantsInput } from "@/lib/attendants-utils";

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY_BRANCH = "main";
const DEFAULT_ATTENDANTS_FILE_PATH = "data/attendants.json";
const DEFAULT_WORK_BRANCH = "bot/attendants-admin";
const DEFAULT_AUTO_MERGE_METHOD = "squash";
const ATTENDANTS_UPDATE_COMMIT_MESSAGE = "chore: update attendants via admin panel";

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

function normalizeBranchName(value, fallback) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeAutoMergeMethod(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "merge" || normalized === "rebase" || normalized === "squash") {
    return normalized;
  }

  return DEFAULT_AUTO_MERGE_METHOD;
}

function parseBooleanEnv(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  return !["0", "false", "no", "off"].includes(normalized);
}

function getRepositoryConfig() {
  const token = process.env.GITHUB_TOKEN || "";
  const owner = process.env.GITHUB_REPO_OWNER || "";
  const repo = process.env.GITHUB_REPO_NAME || "";
  const baseBranch = normalizeBranchName(process.env.GITHUB_REPO_BRANCH, DEFAULT_REPOSITORY_BRANCH);
  const workBranch = normalizeBranchName(process.env.GITHUB_ATTENDANTS_WORK_BRANCH, DEFAULT_WORK_BRANCH);
  const filePath = getAttendantsFilePath();
  const autoMergeEnabled = parseBooleanEnv(process.env.GITHUB_ATTENDANTS_AUTO_MERGE, true);
  const autoMergeMethod = normalizeAutoMergeMethod(process.env.GITHUB_ATTENDANTS_AUTO_MERGE_METHOD);

  if (!token || !owner || !repo) {
    throw new Error(
      "Configuração do GitHub incompleta. Defina GITHUB_TOKEN, GITHUB_REPO_OWNER e GITHUB_REPO_NAME.",
    );
  }

  return {
    token,
    owner,
    repo,
    baseBranch,
    workBranch,
    filePath,
    autoMergeEnabled,
    autoMergeMethod,
  };
}

function getAttendantsFileAbsolutePath() {
  return path.join(process.cwd(), getAttendantsFilePath());
}

function encodeGitHubPath(value) {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

function getGitHubContentApiUrl({ owner, repo, filePath }) {
  const encodedPath = encodeGitHubPath(filePath);
  return `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents/${encodedPath}`;
}

function getGitHubContentReadUrl(config, branch) {
  const contentApiUrl = getGitHubContentApiUrl(config);
  return `${contentApiUrl}?ref=${encodeURIComponent(branch)}`;
}

function getGitHubRefUrl(config, branch) {
  const encodedBranch = encodeGitHubPath(branch);
  return `${GITHUB_API_BASE_URL}/repos/${config.owner}/${config.repo}/git/ref/heads/${encodedBranch}`;
}

function getGitHubRefsCollectionUrl(config) {
  return `${GITHUB_API_BASE_URL}/repos/${config.owner}/${config.repo}/git/refs`;
}

function getGitHubPullsUrl(config, query = "") {
  const base = `${GITHUB_API_BASE_URL}/repos/${config.owner}/${config.repo}/pulls`;
  return query ? `${base}?${query}` : base;
}

function getGitHubGraphQlUrl() {
  return `${GITHUB_API_BASE_URL}/graphql`;
}

function getGitHubHeaders(config, extra = {}) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    ...extra,
  };
}

function decodeBase64Content(value) {
  return Buffer.from(String(value || "").replace(/\n/g, ""), "base64").toString("utf8");
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

async function fetchBranchSha(config, branch, options = {}) {
  const { allowMissing = false } = options;
  const response = await fetch(getGitHubRefUrl(config, branch), {
    method: "GET",
    headers: getGitHubHeaders(config),
    cache: "no-store",
  });

  if (allowMissing && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    throw new AttendantsGitHubSyncError(`Falha ao ler branch "${branch}" no GitHub: ${reason}`);
  }

  const payload = await response.json();
  return typeof payload?.object?.sha === "string" ? payload.object.sha : null;
}

async function ensureWorkBranchExists(config) {
  const workBranchSha = await fetchBranchSha(config, config.workBranch, { allowMissing: true });
  if (workBranchSha) {
    return workBranchSha;
  }

  const baseSha = await fetchBranchSha(config, config.baseBranch);
  if (!baseSha) {
    throw new AttendantsGitHubSyncError(`Não foi possível encontrar SHA da branch base "${config.baseBranch}".`);
  }

  const response = await fetch(getGitHubRefsCollectionUrl(config), {
    method: "POST",
    headers: getGitHubHeaders(config, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      ref: `refs/heads/${config.workBranch}`,
      sha: baseSha,
    }),
  });

  if (response.ok) {
    return baseSha;
  }

  if (response.status === 422) {
    const createdSha = await fetchBranchSha(config, config.workBranch, { allowMissing: true });
    if (createdSha) {
      return createdSha;
    }
  }

  const reason = await parseGitHubErrorMessage(response);
  throw new AttendantsGitHubSyncError(`Falha ao criar branch de trabalho "${config.workBranch}": ${reason}`);
}

async function fetchFileStateFromBranch(config, branch) {
  const response = await fetch(getGitHubContentReadUrl(config, branch), {
    method: "GET",
    headers: getGitHubHeaders(config),
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      sha: null,
      content: "",
    };
  }

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    throw new AttendantsGitHubSyncError(`Falha ao buscar arquivo no GitHub: ${reason}`);
  }

  const payload = await response.json();
  return {
    sha: typeof payload?.sha === "string" ? payload.sha : null,
    content: decodeBase64Content(payload?.content),
  };
}

async function writeFileToWorkBranch(config, nextContent, currentFileSha) {
  const payload = {
    message: ATTENDANTS_UPDATE_COMMIT_MESSAGE,
    content: Buffer.from(nextContent, "utf8").toString("base64"),
    branch: config.workBranch,
  };

  if (currentFileSha) {
    payload.sha = currentFileSha;
  }

  const response = await fetch(getGitHubContentApiUrl(config), {
    method: "PUT",
    headers: getGitHubHeaders(config, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);

    if (response.status === 422 && String(reason).toLowerCase().includes("content is unchanged")) {
      return {
        commitSha: "",
        unchanged: true,
      };
    }

    throw new AttendantsGitHubSyncError(`Falha ao salvar atendentes no GitHub: ${reason}`);
  }

  const result = await response.json();
  return {
    commitSha: result?.commit?.sha || "",
    unchanged: false,
  };
}

function toPullRequestMetadata(pullRequest) {
  if (!pullRequest || typeof pullRequest !== "object") {
    return null;
  }

  const number = Number(pullRequest.number);
  const hasNumber = Number.isFinite(number) && number > 0;

  return {
    number: hasNumber ? number : 0,
    htmlUrl: typeof pullRequest.html_url === "string" ? pullRequest.html_url : "",
    nodeId: typeof pullRequest.node_id === "string" ? pullRequest.node_id : "",
  };
}

async function findOpenPullRequest(config) {
  const query = new URLSearchParams({
    state: "open",
    head: `${config.owner}:${config.workBranch}`,
    base: config.baseBranch,
    per_page: "1",
  }).toString();

  const response = await fetch(getGitHubPullsUrl(config, query), {
    method: "GET",
    headers: getGitHubHeaders(config),
    cache: "no-store",
  });

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    throw new AttendantsGitHubSyncError(`Falha ao buscar pull request de atendentes: ${reason}`);
  }

  const payload = await response.json();
  const pullRequest = Array.isArray(payload) ? payload[0] : null;
  return toPullRequestMetadata(pullRequest);
}

async function createPullRequest(config) {
  const response = await fetch(getGitHubPullsUrl(config), {
    method: "POST",
    headers: getGitHubHeaders(config, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      title: ATTENDANTS_UPDATE_COMMIT_MESSAGE,
      head: config.workBranch,
      base: config.baseBranch,
      body: "Atualização automática dos atendentes via painel administrativo.",
      maintainer_can_modify: true,
    }),
  });

  if (response.ok) {
    const payload = await response.json();
    return toPullRequestMetadata(payload);
  }

  const reason = await parseGitHubErrorMessage(response);
  const reasonText = String(reason || "");

  if (response.status === 422 && reasonText.includes("No commits between")) {
    return null;
  }

  if (response.status === 422 && reasonText.includes("A pull request already exists")) {
    return findOpenPullRequest(config);
  }

  throw new AttendantsGitHubSyncError(`Falha ao criar pull request de atendentes: ${reason}`);
}

function toGraphQlAutoMergeMethod(method) {
  if (method === "merge") {
    return "MERGE";
  }

  if (method === "rebase") {
    return "REBASE";
  }

  return "SQUASH";
}

async function requestPullRequestAutoMerge(config, pullRequestNodeId) {
  if (!pullRequestNodeId) {
    return {
      requested: false,
      statusMessage: "Auto-merge não solicitado: pull request sem node id.",
    };
  }

  const graphQlMutation = `
    mutation EnableAutoMerge($pullRequestId: ID!, $mergeMethod: PullRequestMergeMethod!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: $mergeMethod }) {
        pullRequest {
          number
        }
      }
    }
  `;

  const response = await fetch(getGitHubGraphQlUrl(), {
    method: "POST",
    headers: getGitHubHeaders(config, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      query: graphQlMutation,
      variables: {
        pullRequestId: pullRequestNodeId,
        mergeMethod: toGraphQlAutoMergeMethod(config.autoMergeMethod),
      },
    }),
  });

  if (!response.ok) {
    const reason = await parseGitHubErrorMessage(response);
    return {
      requested: false,
      statusMessage: `Não foi possível solicitar auto-merge: ${reason}`,
    };
  }

  const payload = await response.json();
  const errorMessage = Array.isArray(payload?.errors)
    ? payload.errors
        .map((item) => String(item?.message || "").trim())
        .filter(Boolean)
        .join("; ")
    : "";

  if (errorMessage) {
    return {
      requested: false,
      statusMessage: `Não foi possível solicitar auto-merge: ${errorMessage}`,
    };
  }

  return {
    requested: true,
    statusMessage: `Auto-merge solicitado com método ${config.autoMergeMethod}.`,
  };
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
  await ensureWorkBranchExists(config);

  const nextContent = `${JSON.stringify({ attendants: validation.attendants }, null, 2)}\n`;
  const currentFileState = await fetchFileStateFromBranch(config, config.workBranch);
  let commitSha = "";
  let unchanged = false;

  if (currentFileState.content === nextContent) {
    unchanged = true;
  } else {
    const writeResult = await writeFileToWorkBranch(config, nextContent, currentFileState.sha);
    commitSha = writeResult.commitSha;
    unchanged = writeResult.unchanged;
  }

  let pullRequest = await findOpenPullRequest(config);
  if (!pullRequest) {
    pullRequest = await createPullRequest(config);
  }

  let autoMergeRequested = false;
  let autoMergeStatusMessage = "";

  if (!config.autoMergeEnabled) {
    autoMergeStatusMessage = "Auto-merge desativado por configuração.";
  } else if (!pullRequest) {
    autoMergeStatusMessage = unchanged
      ? "Nenhuma mudança pendente para abrir pull request."
      : "Pull request não disponível para solicitar auto-merge.";
  } else {
    const autoMergeResult = await requestPullRequestAutoMerge(config, pullRequest.nodeId);
    autoMergeRequested = autoMergeResult.requested;
    autoMergeStatusMessage = autoMergeResult.statusMessage;
  }

  return {
    attendants: validation.attendants,
    commitSha,
    pullRequestUrl: pullRequest?.htmlUrl || "",
    pullRequestNumber: pullRequest?.number || 0,
    workBranch: config.workBranch,
    unchanged,
    autoMergeRequested,
    autoMergeStatusMessage,
  };
}
