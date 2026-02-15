import { http } from "./http";

export type TeacherMetrics = {
  total_subjects: number;
  total_students: number;
  active_periods: number;
  total_users: number;
};

export async function getTeacherMetrics() {
  const { data } = await http.get<TeacherMetrics>("/dashboard/teacher");
  return data;
}
