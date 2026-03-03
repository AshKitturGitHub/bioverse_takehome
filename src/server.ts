import "dotenv/config";
import express from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { prisma } from "./lib/prisma";
import { LoginRequest, SubmitQuestionnaireRequest } from "./types/api";
import { isValidAnswerValue, normalizeAnswerValue } from "./utils/validation";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, role: true, password: true },
  });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
  });
});

app.get("/api/questionnaires", async (_req, res) => {
  const questionnaires = await prisma.questionnaire.findMany({
    orderBy: { id: "asc" },
  });

  res.json(questionnaires);
});

app.get("/api/questionnaires/:id/questions", async (req, res) => {
  const questionnaireId = Number(req.params.id);
  const username = String(req.query.username ?? "");

  if (!username) {
    return res.status(400).json({ message: "username query param is required." });
  }

  if (Number.isNaN(questionnaireId)) {
    return res.status(400).json({ message: "Invalid questionnaire id." });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: questionnaireId },
    include: {
      questionnaireQuestions: {
        orderBy: { priority: "asc" },
        include: { question: true },
      },
    },
  });

  if (!questionnaire) {
    return res.status(404).json({ message: "Questionnaire not found." });
  }

  const answers = await prisma.answer.findMany({
    where: {
      userId: user.id,
      questionId: {
        in: questionnaire.questionnaireQuestions.map(
          (item: { questionId: number }) => item.questionId
        ),
      },
    },
  });

  const answerMap = new Map<number, unknown>(
    answers.map((answer: { questionId: number; value: unknown }) => [
      answer.questionId,
      answer.value,
    ])
  );

  res.json({
    questionnaire: {
      id: questionnaire.id,
      name: questionnaire.name,
    },
    questions: questionnaire.questionnaireQuestions.map(
      (item: { question: { id: number; type: string; prompt: string; options: Prisma.JsonValue | null; allowsMultiple: boolean }; priority: number }) => ({
      questionId: item.question.id,
      type: item.question.type,
      prompt: item.question.prompt,
      options: item.question.options,
      allowsMultiple: item.question.allowsMultiple,
      priority: item.priority,
      prefilledAnswer: answerMap.get(item.question.id) ?? null,
      })
    ),
  });
});

app.post("/api/questionnaires/:id/submit", async (req, res) => {
  const questionnaireId = Number(req.params.id);
  const { username, answers } = req.body as SubmitQuestionnaireRequest;

  if (!username || !Array.isArray(answers)) {
    return res
      .status(400)
      .json({ message: "username and answers[] are required." });
  }

  if (Number.isNaN(questionnaireId)) {
    return res.status(400).json({ message: "Invalid questionnaire id." });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const questionIdsInQuestionnaire = await prisma.questionnaireQuestion.findMany({
    where: { questionnaireId },
    select: { questionId: true },
  });

  const allowedQuestionIds = new Set(
    questionIdsInQuestionnaire.map((row: { questionId: number }) => row.questionId)
  );

  for (const answer of answers) {
    if (!allowedQuestionIds.has(answer.questionId)) {
      return res.status(400).json({
        message: `questionId ${answer.questionId} is not part of questionnaire ${questionnaireId}.`,
      });
    }

    if (!isValidAnswerValue(answer.value)) {
      return res.status(400).json({
        message: `questionId ${answer.questionId} has an empty or whitespace-only answer.`,
      });
    }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const answer of answers) {
      await tx.answer.upsert({
        where: {
          userId_questionId: {
            userId: user.id,
            questionId: answer.questionId,
          },
        },
        update: {
          value: normalizeAnswerValue(answer.value),
        },
        create: {
          userId: user.id,
          questionId: answer.questionId,
          value: normalizeAnswerValue(answer.value),
        },
      });
    }

    await tx.questionnaireCompletion.upsert({
      where: {
        userId_questionnaireId: {
          userId: user.id,
          questionnaireId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        questionnaireId,
      },
    });
  });

  return res.json({ ok: true });
});

app.get("/api/admin/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { username: "asc" },
    include: {
      questionnaireCompletions: {
        select: { id: true },
      },
    },
  });

  res.json(
    users.map((user: { username: string; questionnaireCompletions: { id: number }[] }) => ({
      username: user.username,
      completedQuestionnaireCount: user.questionnaireCompletions.length,
    }))
  );
});

app.get("/api/admin/users/:username/responses", async (req, res) => {
  const username = req.params.username;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      questionnaireCompletions: {
        include: {
          questionnaire: {
            include: {
              questionnaireQuestions: {
                orderBy: { priority: "asc" },
                include: { question: true },
              },
            },
          },
        },
        orderBy: { completedAt: "desc" },
      },
      answers: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const answerMap = new Map<number, unknown>(
    user.answers.map((answer: { questionId: number; value: unknown }) => [
      answer.questionId,
      answer.value,
    ])
  );

  const questionnaires = user.questionnaireCompletions.map((completion: {
    questionnaire: {
      name: string;
      questionnaireQuestions: {
        questionId: number;
        question: { prompt: string };
      }[];
    };
    completedAt: Date;
  }) => {
    const qa = completion.questionnaire.questionnaireQuestions
      .map((item: { questionId: number; question: { prompt: string } }) => {
        const value = answerMap.get(item.questionId);
        if (value === undefined || value === null) {
          return null;
        }

        const formattedAnswer = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        return {
          q: item.question.prompt,
          a: formattedAnswer,
          formatted: `Q: ${item.question.prompt} A: ${formattedAnswer}`,
        };
      })
      .filter(
        (
          entry: { q: string; a: string; formatted: string } | null
        ): entry is { q: string; a: string; formatted: string } =>
          Boolean(entry)
      );

    return {
      questionnaireName: completion.questionnaire.name,
      completedAt: completion.completedAt,
      responses: qa,
    };
  });

  return res.json({
    username: user.username,
    questionnaires,
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
