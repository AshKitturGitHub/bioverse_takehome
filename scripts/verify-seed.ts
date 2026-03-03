import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const questionnaires = await prisma.questionnaire.count();
  const questions = await prisma.question.count();
  const junctions = await prisma.questionnaireQuestion.count();
  const answers = await prisma.answer.count();
  const completions = await prisma.questionnaireCompletion.count();

  console.log(
    JSON.stringify(
      { users, questionnaires, questions, junctions, answers, completions },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
