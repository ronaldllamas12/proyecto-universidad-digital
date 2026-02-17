import { http } from "./http";

export type EnrollmentResponse = {
  id: number;
  user_id: number;
  subject_id: number;
  period_id: number;
  teacher_id?: number | null;
  is_active: boolean;
  enrolled_at: string;
  subject_name?: string | null;
  period_name?: string | null;
  user_name?: string | null;
  teacher_name?: string | null;
};

export type EnrollmentCreate = {
  user_id: number;
  subject_id: number;
  period_id: number;
  teacher_id?: number | null;
};

export type EnrollmentUpdate = {
  is_active?: boolean;
};

export async function listEnrollments() {
  const { data } = await http.get<EnrollmentResponse[]>("/enrollments");
  return data;
}

export async function createEnrollment(payload: EnrollmentCreate) {
  const { data } = await http.post<EnrollmentResponse>("/enrollments", payload);
  return data;
}

export async function updateEnrollment(id: number, payload: EnrollmentUpdate) {
  const { data } = await http.put<EnrollmentResponse>(
    `/enrollments/${id}`,
    payload,
  );
  return data;
}

export async function deactivateEnrollment(id: number) {
  const { data } = await http.delete<EnrollmentResponse>(`/enrollments/${id}`);
  return data;
}
