import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ServerErrorPage } from "../pages/ServerErrorPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { UsersPage } from "../pages/admin/UsersPage";
import { SubjectsPage } from "../pages/admin/SubjectsPage";
import { PeriodsPage } from "../pages/admin/PeriodsPage";
import { EnrollmentsPage } from "../pages/admin/EnrollmentsPage";
import { GradesPage } from "../pages/admin/GradesPage";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { StudentSubjectsPage } from "../pages/student/StudentSubjectsPage";
import { StudentEnrollmentsPage } from "../pages/student/StudentEnrollmentsPage";
import { StudentGradesPage } from "../pages/student/StudentGradesPage";
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";
import { TeacherGradesPage } from "../pages/teacher/TeacherGradesPage";
import { TeacherEnrollmentsPage } from "../pages/teacher/TeacherEnrollmentsPage";
import { useAuth } from "../hooks/useAuth";
import { AdminLayout } from "../layouts/AdminLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { DocenteLayout } from "../layouts/DocenteLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { UsersPageFilter } from "../pages/admin/UsersFilter";
import { SubjectsListFilter } from "../pages/admin/subjectsFilters";
import { TeacherSubjectsPage } from "../pages/teacher/TeacherSubject";
import { EnrollmentsFilter } from "../pages/admin/EnrollmentsFilter";
import { PeriodsFilters } from "../pages/admin/PeriodFilters";
import { TeacherGradesFilters } from "../pages/teacher/TeacherGradesFilters";
import { TasksPage } from "../pages/admin/TasksPage";

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="card">Cargando...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.roles.includes("Administrador")) {
    return <Navigate to="/admin" replace />;
  }
  if (user.roles.includes("Docente")) {
    return <Navigate to="/teacher" replace />;
  }
  return <Navigate to="/student" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/denied" element={<AccessDeniedPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["Administrador"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="periods" element={<PeriodsPage />} />
        <Route path="periods/Filter" element={<PeriodsFilters />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="enrollments/Filter" element={<EnrollmentsFilter />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="users/list" element={<UsersPageFilter />} />
        <Route path="subject/Filter" element={<SubjectsListFilter />} />
        <Route path="tasks" element={<TasksPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["Estudiante"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="subjects" element={<StudentSubjectsPage />} />
        <Route path="enrollments" element={<StudentEnrollmentsPage />} />
        <Route path="grades" element={<StudentGradesPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["Docente"]}>
            <DocenteLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="grades" element={<TeacherGradesPage />} />
        <Route path="enrollments" element={<TeacherEnrollmentsPage />} />
        <Route path="subjects" element={<TeacherSubjectsPage />} />
        <Route path="grades/Filter" element={<TeacherGradesFilters />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["Administrador"]}>
            <DashboardLayout emptySidebar>
              <NotFoundPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute roles={["Estudiante"]}>
            <DashboardLayout emptySidebar>
              <NotFoundPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute roles={["Docente"]}>
            <DashboardLayout emptySidebar>
              <NotFoundPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
