import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAdminSessionValid } from "@/lib/admin-auth";
import {
  AttendantsGitHubSyncError,
  AttendantsValidationError,
  readAttendantsFromRepositoryFile,
  updateAttendantsInRepository,
} from "@/lib/attendants-store";

export const runtime = "nodejs";

function isAuthenticated(request) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  return isAdminSessionValid(sessionToken);
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Acesso negado. Faça login no painel admin." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  try {
    const attendants = await readAttendantsFromRepositoryFile();

    return NextResponse.json(
      { attendants },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar atendentes agora." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export async function PUT(request) {
  if (!isAuthenticated(request)) {
    return unauthorizedResponse();
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload inválido. Envie JSON no formato correto." },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const result = await updateAttendantsInRepository(payload?.attendants);

    return NextResponse.json(
      {
        attendants: result.attendants,
        commitSha: result.commitSha,
        pullRequestUrl: result.pullRequestUrl,
        pullRequestNumber: result.pullRequestNumber,
        workBranch: result.workBranch,
        unchanged: result.unchanged,
        autoMergeRequested: result.autoMergeRequested,
        autoMergeStatusMessage: result.autoMergeStatusMessage,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error instanceof AttendantsValidationError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (error instanceof AttendantsGitHubSyncError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 502,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao salvar atendentes." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
