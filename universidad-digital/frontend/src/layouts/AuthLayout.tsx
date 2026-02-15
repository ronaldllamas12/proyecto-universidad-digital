import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="container-login" role="main">
      <div className="login-wrapper">
        <div className="login-card">
          <header className="titulo-login">
            <h1>Universidad Digital</h1>
            <p>Sistema académico</p>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
