const AUTH_TOKEN_KEY = "universidad-digital.auth-token";

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

let authToken: string | null = readStoredToken();

export function setAuthToken(token: string | null) {
  authToken = token;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      return;
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignoramos errores de storage para no bloquear el flujo de autenticación.
  }
}

export function getAuthToken() {
  return authToken;
}
