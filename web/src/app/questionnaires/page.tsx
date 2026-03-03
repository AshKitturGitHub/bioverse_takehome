"use client";

import { getQuestionnaires } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";
import { Questionnaire } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function QuestionnairesPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "USER") {
      router.replace("/");
      return;
    }

    setUsername(session.username);

    getQuestionnaires()
      .then(setQuestionnaires)
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load questionnaires."
        );
      });
  }, [router]);

  const onLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Questionnaires</h1>
          <p className="text-sm text-gray-600">Signed in as {username}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
        >
          Logout
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 grid gap-3">
        {questionnaires.map((questionnaire) => (
          <Link
            key={questionnaire.id}
            href={`/questionnaires/${questionnaire.id}`}
            className="rounded-md border border-gray-200 bg-white px-4 py-3 text-gray-900 hover:bg-gray-50"
          >
            {questionnaire.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
