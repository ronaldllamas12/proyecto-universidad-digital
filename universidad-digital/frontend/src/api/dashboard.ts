import { http } from "./http";

export type AdminMetrics = {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  active_periods: number;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { data } = await http.get<AdminMetrics>("/dashboard/admin");
  return data;
}
