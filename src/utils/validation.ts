export const isBlank = (value: string): boolean => value.trim().length === 0;

export const isValidAnswerValue = (value: unknown): boolean => {
  if (typeof value === "string") {
    return !isBlank(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return false;
    }

    return value.every(
      (item) => typeof item === "string" && !isBlank(item)
    );
  }

  return false;
};

export const normalizeAnswerValue = (
  value: string | string[]
): string | string[] => {
  if (typeof value === "string") {
    return value.trim();
  }

  return value.map((item) => item.trim());
};
