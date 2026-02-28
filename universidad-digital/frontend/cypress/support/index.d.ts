export {};

declare global {
  namespace Cypress {
    interface Chainable {
      resetBrowserState(): Chainable<void>;
      loginAsAdminSession(): Chainable<void>;
      mockAuthApi(options?: {
        meRole?: "Administrador" | "Docente" | "Estudiante";
        meStatus?: number;
        meStatusSequence?: number[];
        loginStatus?: number;
        loginDelayMs?: number;
        forceLoginNetworkError?: boolean;
      }): Chainable<void>;
      mockTaskApi(options?: {
        initialTasks?: Array<{ id: string; title: string; completed: boolean }>;
        getDelayMs?: number;
        forceGetNetworkError?: boolean;
      }): Chainable<void>;
    }
  }
}
