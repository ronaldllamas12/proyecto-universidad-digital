import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { UserResponse } from "../api/auth";
import { setUnauthorizedHandler } from "../api/http";
import { hasAppRole } from "../auth/roleHomePath";
import { getAuthToken, setAuthToken } from "../auth/token";
import * as authService from "../services/authService";
import { getErrorMessage, isUnauthorized } from "../utils/apiError";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/forgot-password"]);

type AuthContextValue = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

let initialSessionRequest: Promise<UserResponse | null> | null = null;
let initialSessionResolved = false;
let initialSessionUser: UserResponse | null = null;
let initialSessionError: unknown = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getCurrentUser();
      setUser(me);
      setError(null);
    } catch (err) {
      setUser(null);
      if (!isUnauthorized(err)) {
        setError(getErrorMessage(err, "No se pudo validar la sesión."));
      } else {
        setAuthToken(null);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.login(email, password);
      await refreshUser();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, "Credenciales inválidas."));
      setIsLoading(false);
      return false;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback(
    (roles: string[]) => {
      if (!user) {
        return false;
      }
      return hasAppRole(user.roles, roles);
    },
    [user]
  );

  useEffect(() => {
    const currentPath = window.location.pathname;
    const hasStoredSession = Boolean(getAuthToken());
    const shouldSkipInitialSessionValidation =
      !hasStoredSession && PUBLIC_AUTH_PATHS.has(currentPath);

    setUnauthorizedHandler(() => {
      void logout();
    });

    if (shouldSkipInitialSessionValidation) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return () => setUnauthorizedHandler(null);
    }

    if (initialSessionResolved) {
      setUser(initialSessionUser);
      setError(
        initialSessionError
          ? getErrorMessage(initialSessionError, "No se pudo validar la sesión.")
          : null,
      );
      setIsLoading(false);
      return () => setUnauthorizedHandler(null);
    }

    if (!initialSessionRequest) {
      initialSessionRequest = authService
        .getCurrentUser()
        .then((me) => me)
        .catch((err) => {
          if (isUnauthorized(err)) {
            setAuthToken(null);
            return null;
          }
          throw err;
        })
        .then((me) => {
          initialSessionResolved = true;
          initialSessionUser = me;
          initialSessionError = null;
          return me;
        })
        .catch((err) => {
          initialSessionResolved = true;
          initialSessionUser = null;
          initialSessionError = err;
          throw err;
        })
        .finally(() => {
          initialSessionRequest = null;
        });
    }

    void initialSessionRequest
      .then((me) => {
        setUser(me);
        setError(null);
      })
      .catch((err) => {
        setUser(null);
        setError(getErrorMessage(err, "No se pudo validar la sesión."));
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      error,
      login,
      logout,
      refreshUser,
      hasRole
    }),
    [user, isLoading, error, login, logout, refreshUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
