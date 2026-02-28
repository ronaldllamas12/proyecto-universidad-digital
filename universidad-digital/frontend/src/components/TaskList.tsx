type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
};

export function TaskList({ tasks, onToggleTask, onDeleteTask }: TaskListProps) {
  if (!tasks.length) {
    return <p>No hay tareas todavía</p>;
  }

  return (
    <ul aria-label="Lista de tareas">
      {tasks.map((task) => (
        <li key={task.id}>
          <label
            style={{
              textDecoration: task.completed ? "line-through" : "none"
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(task.id)}
            />
            {task.title}
          </label>
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
          >
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  );
}

