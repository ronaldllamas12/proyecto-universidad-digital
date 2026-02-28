import type { FormEvent } from "react";
import { useState } from "react";

type TaskFormProps = {
  onCreateTask: (title: string) => Promise<void> | void;
};

export function TaskForm({ onCreateTask }: TaskFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = value.trim();
    if (!trimmed) {
      setError("La tarea no puede estar vacía");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateTask(trimmed);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Formulario de tareas">
      <label htmlFor="task-title">Nueva tarea</label>
      <input
        id="task-title"
        name="task-title"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Escribe una tarea..."
      />
      {error && (
        <p role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        Añadir tarea
      </button>
    </form>
  );
}

