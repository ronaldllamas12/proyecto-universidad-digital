import type { AxiosError } from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado.",
) {
  const axiosError = error as AxiosError<{
    detail?: string | { msg?: string }[];
  }>;

  if (!axiosError.response) {
    return "No se pudo conectar con el servidor. Verifique su conexión.";
  }

  const detail = axiosError?.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail[0]?.msg) {
    return detail[0].msg ?? fallback;
  }
  return `${fallback} (Código: ${axiosError.response.status})`;
}

export function getStatusCode(error: unknown) {
  const axiosError = error as AxiosError;
  return axiosError?.response?.status;
}

export function isUnauthorized(error: unknown) {
  const status = getStatusCode(error);
  return status === 401 || status === 403;
}
