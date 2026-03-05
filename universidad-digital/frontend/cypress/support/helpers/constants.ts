// ===========================================================================
// Constantes compartidas entre tests — Universidad Digital
// ===========================================================================

/** Endpoints de la API que se interceptan con frecuencia */
export const API = {
  AUTH_LOGIN: "/auth/login",
  AUTH_ME: "/auth/me",
  AUTH_LOGOUT: "/auth/logout",
  DASHBOARD_ADMIN: "/dashboard/admin",
  TASKS: "/tasks",
  TASK_BY_ID: "/tasks/*",
} as const;

/** Rutas del frontend */
export const ROUTES = {
  LOGIN: "/login",
  HOME: "/",
  ADMIN_DASHBOARD: "/admin",
  ADMIN_TASKS: "/admin/tasks",
  ADMIN_USERS: "/admin/users",
  ADMIN_SUBJECTS: "/admin/subjects",
  ADMIN_PERIODS: "/admin/periods",
  ADMIN_ENROLLMENTS: "/admin/enrollments",
  STUDENT_DASHBOARD: "/student",
  TEACHER_DASHBOARD: "/teacher",
  ACCESS_DENIED: "/denied",
  SERVER_ERROR: "/500",
  NOT_FOUND: "/404",
} as const;

/** Selectores semánticos de la UI */
export const SEL = {
  // Login
  EMAIL_INPUT: 'input[type="email"]',
  PASSWORD_INPUT: 'input[type="password"]',
  LOGIN_BUTTON: 'button:contains("Iniciar sesión")',
  LOGIN_ALERT: ".login-alert-slot",

  // Dashboard
  DASHBOARD_TITLE: ".dashboard-page__title",
  METRICS_GRID: 'section[aria-label="Métricas principales"]',
  METRIC_CARD: ".metric-card",
  USER_GREETING: ".dashboard-header-bar__user-name",

  // Sidebar
  SIDEBAR_NAV: 'nav[aria-label="Menú principal"]',
  SIDEBAR_LINK: ".dashboard-sidebar__link",
  MENU_TOGGLE: ".dashboard-menu-toggle",
  LOGOUT_BUTTON: 'button[aria-label="Cerrar sesión"]',

  // Tasks
  TASK_FORM: 'form[aria-label="Formulario de tareas"]',
  TASK_INPUT: "#task-title",
  TASK_SUBMIT: 'button:contains("Añadir tarea")',
  TASK_LIST: 'ul[aria-label="Lista de tareas"]',
  TASK_DELETE: 'button:contains("Eliminar")',
  TASK_CHECKBOX: 'input[type="checkbox"]',
  TASK_EMPTY_MSG: 'p:contains("No hay tareas todavía")',
  TASK_LOADING: 'p:contains("Cargando tareas...")',
  TASKS_PAGE: '[aria-label="Gestión de tareas"]',

  // Alert
  ALERT: '[role="alert"]',
} as const;
