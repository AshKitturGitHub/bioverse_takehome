export type Role = "USER" | "ADMIN";

export type LoginRequest = {
  username: string;
  password: string;
};

export type SubmitAnswerInput = {
  questionId: number;
  value: string | string[];
};

export type SubmitQuestionnaireRequest = {
  username: string;
  answers: SubmitAnswerInput[];
};
