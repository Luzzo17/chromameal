/** Requests go through Vite's proxy in development; use /api on the production host too. */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const csrf = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (csrf)
    headers.set(
      "X-XSRF-TOKEN",
      decodeURIComponent(csrf.slice("XSRF-TOKEN=".length)),
    );

  const response = await fetch(`/api/${path.replace(/^\/+/, "")}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.message ?? "Richiesta non riuscita",
      body.errors ?? {},
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function apiErrorMessage(reason: unknown, resource: string) {
  if (
    reason instanceof ApiError &&
    (reason.status === 401 || reason.status === 419)
  ) {
    return {
      needsLogin: true,
      message:
        reason.status === 401
          ? `Accedi per visualizzare ${resource}.`
          : "La sessione è scaduta. Accedi di nuovo.",
    };
  }
  if (reason instanceof ApiError && reason.status === 422) {
    return {
      needsLogin: false,
      message: Object.values(reason.errors).flat().join(" ") || reason.message,
    };
  }
  return {
    needsLogin: false,
    message: `Impossibile caricare ${resource}. Controlla la connessione e riprova.`,
  };
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch("/sanctum/csrf-cookie", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Impossibile inizializzare la sessione");
}
