import { http } from "./http";

export type StudentResponse = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export async function listStudents() {
  const { data } = await http.get<StudentResponse[]>("/students");
  return data;
}

export async function getStudent(id: number) {
  const { data } = await http.get<StudentResponse>(`/students/${id}`);
  return data;
}

export type StudentMetrics = {
  name: string;
  enrolled_subjects: number;
  active_periods: number;
  grades_count: number;
};

export async function getStudentMetrics() {
  const { data } = await http.get<StudentMetrics>("/dashboard/student");
  return data;
}

export async function getStudentSubjects() {
  const { data } = await http.get("/student/subjects");
  return data;
}
