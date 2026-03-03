import {
  AdminUserResponses,
  AdminUserSummary,
  Questionnaire,
  QuestionnaireQuestionsResponse,
  Session,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message ?? "Request failed.");
  }

  return (await response.json()) as T;
};

export const login = async (
  username: string,
  password: string
): Promise<Session> => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return toJson<Session>(response);
};

export const getQuestionnaires = async (): Promise<Questionnaire[]> => {
  const response = await fetch(`${API_BASE_URL}/api/questionnaires`, {
    cache: "no-store",
  });

  return toJson<Questionnaire[]>(response);
};

export const getQuestionnaireQuestions = async (
  questionnaireId: number,
  username: string
): Promise<QuestionnaireQuestionsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/questionnaires/${questionnaireId}/questions?username=${encodeURIComponent(
      username
    )}`,
    {
      cache: "no-store",
    }
  );

  return toJson<QuestionnaireQuestionsResponse>(response);
};

export const submitQuestionnaire = async (
  questionnaireId: number,
  username: string,
  answers: { questionId: number; value: string | string[] }[]
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/questionnaires/${questionnaireId}/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, answers }),
    }
  );

  return toJson<{ ok: true }>(response);
};

export const getAdminUsers = async (): Promise<AdminUserSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    cache: "no-store",
  });

  return toJson<AdminUserSummary[]>(response);
};

export const getAdminUserResponses = async (
  username: string
): Promise<AdminUserResponses> => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(username)}/responses`,
    {
      cache: "no-store",
    }
  );

  return toJson<AdminUserResponses>(response);
};
