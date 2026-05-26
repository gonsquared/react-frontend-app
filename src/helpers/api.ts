const defaultApiBaseUrl = "http://localhost:4000";

type ApiValidationError = {
  loc?: Array<string | number>;
  msg?: string;
};

const fieldLabels: Record<string, string> = {
  avatarUrl: "Avatar image",
  contents: "Contents",
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  password: "Password",
  status: "Status",
  title: "Title",
  verifyPassword: "Verify password",
};

const formatFieldName = (fieldName: string): string =>
  fieldLabels[fieldName] ||
  fieldName
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());

export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;
  return new URL(path, baseUrl).toString();
};

export const readJsonResponse = async <T>(
  response: Response,
): Promise<T | null> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
};

export const getErrorMessage = (
  detail: unknown,
  fallbackMessage: string,
): string => {
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((error: ApiValidationError) => {
        const fieldName = error.loc?.[error.loc.length - 1];
        const message = error.msg?.trim();

        if (!message) return "";
        if (typeof fieldName === "string") {
          return `${formatFieldName(fieldName)}: ${message}`;
        }

        return message;
      })
      .filter(Boolean);

    if (messages.length > 0) return messages.join(" ");
  }

  return fallbackMessage;
};
