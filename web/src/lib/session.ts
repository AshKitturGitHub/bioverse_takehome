import { Session } from "@/types";

const SESSION_KEY = "intake_session";

export const saveSession = (session: Session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): Session | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
