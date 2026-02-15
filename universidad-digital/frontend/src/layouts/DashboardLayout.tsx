import { type ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/Button";

const MenuIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChartIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BookIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const AcademicIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const GradeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const roles = user?.roles ?? [];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-dashboard">
      <header className="dashboard-header-bar" role="banner">
        <div className="dashboard-header-bar__brand">
          <button
            type="button"
            className="dashboard-menu-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <div className="dashboard-header-bar__brand-icon" aria-hidden>U</div>
          <div>
            <div className="dashboard-header-bar__brand-text">Universidad Digital</div>
            <div className="dashboard-header-bar__brand-sub">Panel de control</div>
          </div>
        </div>
        <div className="dashboard-header-bar__user">
          <span className="dashboard-header-bar__user-name">Hola, {user?.full_name ?? "Usuario"}</span>
          <Button variant="secondary" onClick={() => void logout()}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <div
        className={`dashboard-sidebar-overlay ${sidebarOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={closeSidebar}
      />

      <nav
        className={`dashboard-sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="Menú principal"
      >
        <div className="dashboard-sidebar__header">
          <div className="dashboard-sidebar__title">Navegación</div>
        </div>
        <ul className="dashboard-sidebar__nav">
          {roles.includes("Administrador") && (
            <>
              <li>
                <NavLink to="/admin" className="dashboard-sidebar__link" end onClick={closeSidebar}>
                  <ChartIcon /> Panel admin
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/users" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <UsersIcon /> Usuarios
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/subjects" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <BookIcon /> Materias
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/periods" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <CalendarIcon /> Periodos
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/enrollments" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <ClipboardIcon /> Inscripciones
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/grades" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <GradeIcon /> Calificaciones
                </NavLink>
              </li>
            </>
          )}
          {roles.includes("Docente") && (
            <>
              <li>
                <NavLink to="/teacher" className="dashboard-sidebar__link" end onClick={closeSidebar}>
                  <ChartIcon /> Panel docente
                </NavLink>
              </li>
              <li>
                <NavLink to="/teacher/grades" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <GradeIcon /> Calificaciones
                </NavLink>
              </li>
            </>
          )}
          {roles.includes("Estudiante") && (
            <>
              <li>
                <NavLink to="/student" className="dashboard-sidebar__link" end onClick={closeSidebar}>
                  <ChartIcon /> Panel estudiante
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/subjects" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <BookIcon /> Materias
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/enrollments" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <ClipboardIcon /> Inscripciones
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/grades" className="dashboard-sidebar__link" onClick={closeSidebar}>
                  <GradeIcon /> Calificaciones
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <main className="dashboard-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
