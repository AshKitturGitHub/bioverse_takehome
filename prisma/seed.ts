import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CsvQuestionnaire = {
  id: string;
  name: string;
};

type CsvJunction = {
  id: string;
  question_id: string;
  questionnaire_id: string;
  priority: string;
};

type CsvQuestion = {
  id: string;
  question: string;
};

type ParsedQuestionPayload = {
  type: "mcq" | "input";
  question: string;
  options?: string[];
};

const dataPath = (fileName: string) =>
  path.resolve(process.cwd(), "data", fileName);

const readCsv = async <T>(fileName: string): Promise<T[]> => {
  const content = await readFile(dataPath(fileName), "utf-8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
};

const isSelectAllPrompt = (prompt: string): boolean =>
  prompt.toLowerCase().includes("select all that apply");

const seedUsers = async () => {
  const users = [
    { username: "user1", password: "password123", role: "USER" as const },
    { username: "user2", password: "password123", role: "USER" as const },
    { username: "admin", password: "admin123", role: "ADMIN" as const },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { password: user.password, role: user.role },
      create: user,
    });
  }
};

async function main() {
  const [questionnaires, junctions, questions] = await Promise.all([
    readCsv<CsvQuestionnaire>("questionnaire_questionnaires.csv"),
    readCsv<CsvJunction>("questionnaire_junction.csv"),
    readCsv<CsvQuestion>("questionnaire_questions.csv"),
  ]);

  await prisma.$transaction([
    prisma.answer.deleteMany(),
    prisma.questionnaireCompletion.deleteMany(),
    prisma.questionnaireQuestion.deleteMany(),
    prisma.question.deleteMany(),
    prisma.questionnaire.deleteMany(),
  ]);

  for (const questionnaire of questionnaires) {
    await prisma.questionnaire.create({
      data: {
        id: Number(questionnaire.id),
        name: questionnaire.name,
      },
    });
  }

  for (const question of questions) {
    const payload = JSON.parse(question.question) as ParsedQuestionPayload;
    await prisma.question.create({
      data: {
        id: Number(question.id),
        type: payload.type,
        prompt: payload.question,
        options: payload.options ?? undefined,
        allowsMultiple: isSelectAllPrompt(payload.question),
        raw: payload,
      },
    });
  }

  for (const junction of junctions) {
    await prisma.questionnaireQuestion.create({
      data: {
        id: Number(junction.id),
        questionId: Number(junction.question_id),
        questionnaireId: Number(junction.questionnaire_id),
        priority: Number(junction.priority),
      },
    });
  }

  await seedUsers();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
