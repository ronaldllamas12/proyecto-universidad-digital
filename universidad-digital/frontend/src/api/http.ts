import axios from "axios";
import { getAuthToken } from "../auth/token";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

let onUnauthorized: (() => void) | null = null;

const RETRY_MAX_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 200;

type RetryConfig = {
  __retryCount?: number;
};

function isRetriableError(error: unknown): boolean {
  const e = error as {
    code?: string;
    response?: { status?: number };
  };

  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED") {
    return true;
  }

  const status = e.response?.status;
  if (!status) {
    return true;
  }

  if (status === 429) {
    return true;
  }

  return status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = (error?.config ?? {}) as RetryConfig;

    if (isRetriableError(error)) {
      requestConfig.__retryCount = requestConfig.__retryCount ?? 0;

      if (requestConfig.__retryCount < RETRY_MAX_ATTEMPTS) {
        requestConfig.__retryCount += 1;
        const backoffMs =
          RETRY_BASE_DELAY_MS * 2 ** (requestConfig.__retryCount - 1);
        await delay(backoffMs);
        return http.request(error.config);
      }
    }

    if (error?.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    if (error?.response?.status >= 500) {
      window.location.assign("/500");
    }
    return Promise.reject(error);
  },
);
