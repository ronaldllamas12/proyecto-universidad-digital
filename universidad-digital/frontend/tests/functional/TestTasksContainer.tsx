import { useState } from "react";
import { TaskForm } from "../../src/components/TaskForm";
import { TaskList } from "../../src/components/TaskList";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

let nextId = 1;

export function TestTasksContainer() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleCreateTask = async (title: string) => {
    setTasks((prev) => [
      ...prev,
      { id: String(nextId++), title, completed: false }
    ]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div>
      <TaskForm onCreateTask={handleCreateTask} />
      <TaskList
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}

