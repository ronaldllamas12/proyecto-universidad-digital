import { http } from "./http";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type UserResponse = {
  id: number;
  email: string;
  recovery_email?: string | null;
  full_name: string;
  is_active: boolean;
  created_at: string;
  roles: string[];
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  detail: string;
};

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
};

export type ExchangeResetTokenRequest = {
  token: string;
};

export type ExchangeResetTokenResponse = {
  session_token: string;
};

export type MessageResponse = {
  detail: string;
};

export async function login(payload: LoginRequest) {
  const { data } = await http.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function logout() {
  await http.post("/auth/logout");
}

export async function getMe() {
  const { data } = await http.get<UserResponse>("/auth/me");
  return data;
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  const { data } = await http.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    payload,
  );
  return data;
}

export async function resetPassword(payload: ResetPasswordRequest) {
  const { data } = await http.post<MessageResponse>(
    "/auth/reset-password",
    payload,
  );
  return data;
}

export async function exchangeResetToken(payload: ExchangeResetTokenRequest) {
  const { data } = await http.post<ExchangeResetTokenResponse>(
    "/auth/reset-password/exchange",
    payload,
  );
  return data;
}
