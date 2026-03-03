"use client";

import { getQuestionnaireQuestions, submitQuestionnaire } from "@/lib/api";
import { getSession } from "@/lib/session";
import { Question } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AnswerMap = Record<number, string | string[]>;

const isBlank = (value: string) => value.trim().length === 0;

export default function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [questionnaireId, setQuestionnaireId] = useState<number | null>(null);
  const [questionnaireName, setQuestionnaireName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      const parsed = Number(resolvedParams.id);
      if (Number.isNaN(parsed)) {
        router.replace("/questionnaires");
        return;
      }

      setQuestionnaireId(parsed);
    });
  }, [params, router]);

  useEffect(() => {
    if (questionnaireId === null) {
      return;
    }

    const session = getSession();
    if (!session || session.role !== "USER") {
      router.replace("/");
      return;
    }

    setUsername(session.username);

    getQuestionnaireQuestions(questionnaireId, session.username)
      .then((payload) => {
        setQuestionnaireName(payload.questionnaire.name);
        setQuestions(payload.questions);

        const initialAnswers: AnswerMap = {};
        for (const question of payload.questions) {
          if (question.prefilledAnswer !== null) {
            initialAnswers[question.questionId] = question.prefilledAnswer;
          } else if (question.allowsMultiple) {
            initialAnswers[question.questionId] = [];
          } else {
            initialAnswers[question.questionId] = "";
          }
        }

        setAnswers(initialAnswers);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load questionnaire."
        );
      });
  }, [questionnaireId, router]);

  const validationError = useMemo(() => {
    for (const question of questions) {
      const value = answers[question.questionId];

      if (typeof value === "string") {
        if (isBlank(value)) {
          return `Answer required: ${question.prompt}`;
        }
      }

      if (Array.isArray(value)) {
        if (value.length === 0 || value.some((entry) => isBlank(entry))) {
          return `Answer required: ${question.prompt}`;
        }
      }
    }

    return "";
  }, [answers, questions]);

  const onSubmit = async () => {
    if (questionnaireId === null) {
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitQuestionnaire(
        questionnaireId,
        username,
        questions.map((question) => ({
          questionId: question.questionId,
          value: answers[question.questionId],
        }))
      );

      router.push("/questionnaires");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not submit questionnaire."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const setInputValue = (questionId: number, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  const toggleMultiSelectValue = (questionId: number, option: string) => {
    setAnswers((previous) => {
      const current = previous[questionId];
      const currentValues = Array.isArray(current) ? current : [];

      const nextValues = currentValues.includes(option)
        ? currentValues.filter((entry) => entry !== option)
        : [...currentValues, option];

      return {
        ...previous,
        [questionId]: nextValues,
      };
    });
  };

  if (questionnaireId === null) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{questionnaireName}</h1>
          <p className="text-sm text-gray-600">Complete all questions to submit.</p>
        </div>
        <button
          onClick={() => router.push("/questionnaires")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
        >
          Back
        </button>
      </div>

      <div className="space-y-6">
        {questions.map((question) => {
          const value = answers[question.questionId];

          return (
            <section
              key={question.questionId}
              className="rounded-md border border-gray-200 bg-white p-4"
            >
              <p className="text-sm font-medium text-gray-900">{question.prompt}</p>

              {question.type === "input" ? (
                <textarea
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) =>
                    setInputValue(question.questionId, event.target.value)
                  }
                  rows={4}
                  className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                />
              ) : null}

              {question.type === "mcq" && question.options ? (
                <div className="mt-3 space-y-2">
                  {question.options.map((option) => {
                    if (question.allowsMultiple) {
                      const selected = Array.isArray(value)
                        ? value.includes(option)
                        : false;

                      return (
                        <label key={option} className="flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              toggleMultiSelectValue(question.questionId, option)
                            }
                          />
                          <span>{option}</span>
                        </label>
                      );
                    }

                    return (
                      <label key={option} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="radio"
                          name={`question-${question.questionId}`}
                          checked={value === option}
                          onChange={() => setInputValue(question.questionId, option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-6 rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </main>
  );
}
