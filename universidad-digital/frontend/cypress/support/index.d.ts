// ===========================================================================
// Tipos globales para los comandos personalizados de Cypress
// ===========================================================================

declare namespace Cypress {
  interface Chainable {
    // --- Auth commands ---
    /**
     * Configura interceptores de autenticación mock (login, me, logout, dashboard).
     */
    mockAuthApi(options?: MockAuthApiOptions): Chainable<void>;

    /**
     * Inicia sesión como administrador usando cy.session con mocks.
     */
    loginAsAdminSession(): Chainable<void>;

    /**
     * Resetea el estado del navegador (cookies, storages).
     */
    resetBrowserState(): Chainable<void>;

    // --- Task commands ---
    /**
     * Configura interceptores mock para la API de tareas con store en memoria.
     */
    mockTaskApi(options?: MockTaskApiOptions): Chainable<void>;

    /**
     * Crea una tarea usando la UI (rellena input y pulsa submit).
     */
    createTaskViaUI(title: string): Chainable<void>;

    /**
     * Espera a que la lista de tareas haya cargado.
     */
    waitForTaskList(): Chainable<void>;

    // --- Common commands ---
    /**
     * Valida la respuesta de un alias interceptado.
     */
    assertApiResponse(
      alias: string,
      expectedStatus: number,
      maxResponseMs?: number,
    ): Chainable<void>;

    /**
     * Valida que el body JSON de un alias contenga las claves especificadas.
     */
    assertJsonBodyKeys(alias: string, keys: string[]): Chainable<void>;
  }
}

// --- Opciones de configuración para los mocks ---

interface MockAuthApiOptions {
  /** Rol(es) del usuario mock (default: ["Administrador"]) */
  roles?: string[];
  /** Status code del login (default: 200) */
  loginStatus?: number;
  /** Si true, simula error de red en login */
  loginNetworkError?: boolean;
  /** Delay en ms para la respuesta de login */
  loginDelay?: number;
  /** Status del GET /auth/me (default: 200) */
  meStatus?: number;
  /** Si true, el primer GET /auth/me retorna 401 (sesión inicial) */
  initialMeUnauthorized?: boolean;
  /** Secuencia de respuestas de login [status, ...] */
  loginSequence?: number[];
  /** Secuencia de respuestas de me [status, ...] */
  meSequence?: number[];
}

interface MockTaskApiOptions {
  /** Tareas iniciales del store */
  initialTasks?: Array<{ id: string; title: string; completed: boolean }>;
  /** Delay en ms para GET /tasks */
  getDelay?: number;
  /** Delay en ms para POST /tasks */
  postDelay?: number;
  /** Si true, fuerza error de red en GET /tasks */
  getNetworkError?: boolean;
  /** Si true, fuerza error de red en POST /tasks */
  postNetworkError?: boolean;
  /** Status forzado para POST /tasks */
  postStatus?: number;
  /** Body de error para POST /tasks */
  postErrorBody?: Record<string, unknown>;
  /** Si true, retorna JSON corrupto en GET /tasks */
  corruptGetResponse?: boolean;
}
