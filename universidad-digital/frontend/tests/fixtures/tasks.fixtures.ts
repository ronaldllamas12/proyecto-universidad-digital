export const singleTask = {
  id: "1",
  title: "Aprender Testing Library",
  completed: false,
};

export const multipleTasks = [
  singleTask,
  {
    id: "2",
    title: "Escribir tests de integración",
    completed: true,
  },
  {
    id: "3",
    title: "Refactorizar TaskList",
    completed: false,
  },
];

export const longTaskTitle =
  "Implementar una estrategia de pruebas de comportamiento para validar flujos críticos de usuario en la interfaz";

export const serverTasksFixture = [
  {
    id: "server-1",
    title: "Sincronizar tareas del servidor",
    completed: false,
  },
  {
    id: "server-2",
    title: "Verificar estado inicial cargado",
    completed: true,
  },
];
