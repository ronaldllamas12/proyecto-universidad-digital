import { useEffect, useState } from "react";
import { TaskList } from "../../src/components/TaskList";
import {
  fetchTasksFromServer,
  type Task,
} from "../../src/services/taskService";

export function TestTasksFromServerContainer() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    void fetchTasksFromServer().then(setTasks);
  }, []);

  return (
    <TaskList
      tasks={tasks}
      onToggleTask={() => undefined}
      onDeleteTask={() => undefined}
    />
  );
}
