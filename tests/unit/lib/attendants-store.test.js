import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendantsValidationError, updateAttendantsInRepository } from "@/lib/attendants-store";

function mockJsonResponse({ status, payload, statusText }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText || (status === 404 ? "Not Found" : "OK"),
    json: vi.fn().mockResolvedValue(payload),
  };
}

function queueFetchResponses(responses) {
  const fetchMock = vi.fn();

  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce(mockJsonResponse(response));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function setupGitHubEnv() {
  vi.stubEnv("GITHUB_TOKEN", "test-token");
  vi.stubEnv("GITHUB_REPO_OWNER", "ArielAio");
  vi.stubEnv("GITHUB_REPO_NAME", "Li-Rilko");
  vi.stubEnv("GITHUB_REPO_BRANCH", "main");
  vi.stubEnv("GITHUB_ATTENDANTS_PATH", "data/attendants.json");
  vi.stubEnv("GITHUB_ATTENDANTS_WORK_BRANCH", "bot/attendants-admin");
  vi.stubEnv("GITHUB_ATTENDANTS_AUTO_MERGE", "true");
  vi.stubEnv("GITHUB_ATTENDANTS_AUTO_MERGE_METHOD", "squash");
}

function makeAttendantsPayload() {
  return [{ name: "Ari", phone: "5517999991111" }];
}

function makeSerializedAttendantsFile(attendants) {
  return `${JSON.stringify({ attendants }, null, 2)}\n`;
}

describe("lib/attendants-store updateAttendantsInRepository", () => {
  beforeEach(() => {
    setupGitHubEnv();
  });

  it("cria branch de trabalho e PR quando ainda não existem, e solicita auto-merge", async () => {
    const attendants = makeAttendantsPayload();
    const fetchMock = queueFetchResponses([
      { status: 404, payload: { message: "Not Found" } },
      { status: 200, payload: { object: { sha: "base-sha" } } },
      { status: 201, payload: { ref: "refs/heads/bot/attendants-admin" } },
      { status: 404, payload: { message: "Not Found" } },
      { status: 200, payload: { commit: { sha: "commit-1" } } },
      { status: 200, payload: [] },
      {
        status: 201,
        payload: {
          number: 42,
          html_url: "https://github.com/ArielAio/Li-Rilko/pull/42",
          node_id: "PR_node_42",
        },
      },
      { status: 200, payload: { data: { enablePullRequestAutoMerge: { pullRequest: { number: 42 } } } } },
    ]);

    const result = await updateAttendantsInRepository(attendants);

    expect(result.commitSha).toBe("commit-1");
    expect(result.workBranch).toBe("bot/attendants-admin");
    expect(result.pullRequestNumber).toBe(42);
    expect(result.pullRequestUrl).toContain("/pull/42");
    expect(result.unchanged).toBe(false);
    expect(result.autoMergeRequested).toBe(true);
    expect(result.autoMergeStatusMessage).toContain("squash");

    const createPullRequestCall = fetchMock.mock.calls.find(
      ([url, options]) => String(url).endsWith("/pulls") && options?.method === "POST",
    );
    expect(createPullRequestCall).toBeTruthy();
    expect(JSON.parse(createPullRequestCall[1].body)).toMatchObject({
      head: "bot/attendants-admin",
      base: "main",
    });

    const autoMergeCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/graphql"));
    expect(autoMergeCall).toBeTruthy();
  });

  it("reusa branch e PR abertos e trata arquivo sem alterações como unchanged", async () => {
    const attendants = makeAttendantsPayload();
    const fileContent = makeSerializedAttendantsFile(attendants);
    const encodedContent = Buffer.from(fileContent, "utf8").toString("base64");

    const fetchMock = queueFetchResponses([
      { status: 200, payload: { object: { sha: "work-sha" } } },
      {
        status: 200,
        payload: {
          sha: "file-sha",
          content: encodedContent,
        },
      },
      {
        status: 200,
        payload: [
          {
            number: 99,
            html_url: "https://github.com/ArielAio/Li-Rilko/pull/99",
            node_id: "PR_node_99",
          },
        ],
      },
      { status: 200, payload: { data: { enablePullRequestAutoMerge: { pullRequest: { number: 99 } } } } },
    ]);

    const result = await updateAttendantsInRepository(attendants);

    expect(result.unchanged).toBe(true);
    expect(result.commitSha).toBe("");
    expect(result.pullRequestNumber).toBe(99);
    expect(result.autoMergeRequested).toBe(true);

    const putContentCall = fetchMock.mock.calls.find(([, options]) => options?.method === "PUT");
    expect(putContentCall).toBeUndefined();
  });

  it("não quebra salvamento quando auto-merge não pode ser solicitado", async () => {
    const attendants = makeAttendantsPayload();

    const result = await (async () => {
      queueFetchResponses([
        { status: 200, payload: { object: { sha: "work-sha" } } },
        { status: 404, payload: { message: "Not Found" } },
        { status: 200, payload: { commit: { sha: "commit-2" } } },
        {
          status: 200,
          payload: [
            {
              number: 77,
              html_url: "https://github.com/ArielAio/Li-Rilko/pull/77",
              node_id: "PR_node_77",
            },
          ],
        },
        {
          status: 200,
          payload: {
            errors: [{ message: "Resource not accessible by integration" }],
          },
        },
      ]);

      return updateAttendantsInRepository(attendants);
    })();

    expect(result.commitSha).toBe("commit-2");
    expect(result.pullRequestNumber).toBe(77);
    expect(result.autoMergeRequested).toBe(false);
    expect(result.autoMergeStatusMessage).toContain("Não foi possível solicitar auto-merge");
  });

  it("retorna sucesso quando não há commits entre branches (unchanged sem PR)", async () => {
    const attendants = makeAttendantsPayload();
    const fileContent = makeSerializedAttendantsFile(attendants);
    const encodedContent = Buffer.from(fileContent, "utf8").toString("base64");

    queueFetchResponses([
      { status: 200, payload: { object: { sha: "work-sha" } } },
      {
        status: 200,
        payload: {
          sha: "file-sha",
          content: encodedContent,
        },
      },
      { status: 200, payload: [] },
      { status: 422, payload: { message: "No commits between main and bot/attendants-admin" } },
    ]);

    const result = await updateAttendantsInRepository(attendants);

    expect(result.unchanged).toBe(true);
    expect(result.pullRequestNumber).toBe(0);
    expect(result.pullRequestUrl).toBe("");
    expect(result.autoMergeRequested).toBe(false);
    expect(result.autoMergeStatusMessage).toContain("Nenhuma mudança pendente");
  });

  it("lança erro de validação para payload inválido antes de chamar GitHub", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateAttendantsInRepository([])).rejects.toBeInstanceOf(AttendantsValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
