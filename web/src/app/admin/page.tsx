"use client";

import { getAdminUserResponses, getAdminUsers } from "@/lib/api";
import { clearSession, getSession } from "@/lib/session";
import { AdminUserResponses, AdminUserSummary } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selected, setSelected] = useState<AdminUserResponses | null>(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    getAdminUsers()
      .then(setUsers)
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load users."
        );
      });
  }, [router]);

  const onOpenUser = async (username: string) => {
    setError("");
    setIsLoadingModal(true);
    try {
      const payload = await getAdminUserResponses(username);
      setSelected(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load user responses."
      );
    } finally {
      setIsLoadingModal(false);
    }
  };

  const onLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
        <button
          onClick={onLogout}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
        >
          Logout
        </button>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Completed Questionnaires
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.username}>
                <td className="px-4 py-3 text-sm text-gray-900">{user.username}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {user.completedQuestionnaireCount}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onOpenUser(user.username)}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoadingModal ? <p className="mt-4 text-sm text-gray-600">Loading responses...</p> : null}

      {selected ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-md bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Responses for {selected.username}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              {selected.questionnaires.map((questionnaire) => (
                <section
                  key={`${questionnaire.questionnaireName}-${questionnaire.completedAt}`}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    {questionnaire.questionnaireName}
                  </p>
                  <div className="space-y-2 text-sm text-gray-800">
                    {questionnaire.responses.map((entry) => (
                      <p key={entry.formatted}>{entry.formatted}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
