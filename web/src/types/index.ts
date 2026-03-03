export type Role = "USER" | "ADMIN";

export type Session = {
  id: number;
  username: string;
  role: Role;
};

export type Questionnaire = {
  id: number;
  name: string;
};

export type Question = {
  questionId: number;
  type: "input" | "mcq";
  prompt: string;
  options: string[] | null;
  allowsMultiple: boolean;
  priority: number;
  prefilledAnswer: string | string[] | null;
};

export type QuestionnaireQuestionsResponse = {
  questionnaire: Questionnaire;
  questions: Question[];
};

export type AdminUserSummary = {
  username: string;
  completedQuestionnaireCount: number;
};

export type AdminUserResponses = {
  username: string;
  questionnaires: {
    questionnaireName: string;
    completedAt: string;
    responses: {
      q: string;
      a: string;
      formatted: string;
    }[];
  }[];
};
