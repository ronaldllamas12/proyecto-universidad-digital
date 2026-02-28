import { http } from "../api/http";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export async function fetchTasksFromServer(): Promise<Task[]> {
  const { data } = await http.get<Task[]>("/tasks");
  return data;
}

export async function createTask(title: string): Promise<Task> {
  const { data } = await http.post<Task>("/tasks", { title });
  return data;
}

export async function toggleTask(
  id: string,
  completed: boolean,
): Promise<Task> {
  const { data } = await http.patch<Task>(`/tasks/${id}`, { completed });
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`/tasks/${id}`);
}
