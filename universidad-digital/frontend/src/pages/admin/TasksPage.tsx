import { useEffect, useState } from "react";
import { Alert } from "../../components/Alert";
import { TaskForm } from "../../components/TaskForm";
import { TaskList } from "../../components/TaskList";
import {
  createTask,
  deleteTask,
  fetchTasksFromServer,
  toggleTask,
  type Task,
} from "../../services/taskService";
import { getErrorMessage } from "../../utils/apiError";

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetchTasksFromServer();
      setTasks(response);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const handleCreateTask = async (title: string) => {
    try {
      const created = await createTask(title);
      setTasks((previous) => [...previous, created]);
      setSuccess("Tarea creada correctamente.");
      setError(null);
    } catch (err) {
      setSuccess(null);
      setError(getErrorMessage(err));
    }
  };

  const handleToggleTask = async (id: string) => {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;

    try {
      const updated = await toggleTask(id, !current.completed);
      setTasks((previous) =>
        previous.map((task) => (task.id === id ? updated : task)),
      );
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks((previous) => previous.filter((task) => task.id !== id));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="dashboard-page" aria-label="Gestión de tareas">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Gestión de tareas</h1>
        <p className="dashboard-page__subtitle">
          Flujo completo QA: crear, persistir y visualizar tareas.
        </p>
      </header>

      {error ? <Alert message={error} /> : null}
      {success ? <Alert message={success} variant="success" /> : null}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <TaskForm onCreateTask={handleCreateTask} />
      </div>

      <div className="card">
        {isLoading ? <p>Cargando tareas...</p> : null}
        {!isLoading ? (
          <TaskList
            tasks={tasks}
            onToggleTask={(id) => {
              void handleToggleTask(id);
            }}
            onDeleteTask={(id) => {
              void handleDeleteTask(id);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
