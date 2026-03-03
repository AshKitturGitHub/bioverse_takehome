"use client";

import { login } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const session = await login(username.trim(), password.trim());
      saveSession(session);

      if (session.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      router.push("/questionnaires");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Login failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <form
        onSubmit={onSubmit}
        className="w-full rounded-lg border border-gray-200 bg-white p-6"
      >
        <h1 className="text-2xl font-semibold text-gray-900">Intake Login</h1>
        <p className="mt-1 text-sm text-gray-600">
          Use a seeded user login to continue.
        </p>

        <label className="mt-5 block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          placeholder="user1"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          placeholder="password123"
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
