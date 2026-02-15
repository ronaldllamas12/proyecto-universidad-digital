import * as authApi from "../api/auth";
import { setAuthToken } from "../auth/token";

export async function login(email: string, password: string) {
  const response = await authApi.login({ email, password });
  setAuthToken(response.access_token);
  return response;
}

export async function logout() {
  setAuthToken(null);
  await authApi.logout();
}

export async function getCurrentUser() {
  return authApi.getMe();
}
