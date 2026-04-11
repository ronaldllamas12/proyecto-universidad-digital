import { Navigate, Route, Routes } from "react-router-dom";
import { getHomePathForRoles } from "../auth/roleHomePath";
import { useAuth } from "../hooks/useAuth";
import { AdminLayout } from "../layouts/AdminLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { DocenteLayout } from "../layouts/DocenteLayout";
import { StudentLayout } from "../layouts/StudentLayout";
import { AccessDeniedPage } from "../pages/AccessDeniedPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ServerErrorPage } from "../pages/ServerErrorPage";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { EnrollmentsFilter } from "../pages/admin/EnrollmentsFilter";
import { EnrollmentsPage } from "../pages/admin/EnrollmentsPage";
import { GradesPage } from "../pages/admin/GradesPage";
import { PeriodsFilters } from "../pages/admin/PeriodFilters";
import { PeriodsPage } from "../pages/admin/PeriodsPage";
import { SubjectsPage } from "../pages/admin/SubjectsPage";
import { TasksPage } from "../pages/admin/TasksPage";
import { UsersPageFilter } from "../pages/admin/UsersFilter";
import { UsersPage } from "../pages/admin/UsersPage";
import { SubjectsListFilter } from "../pages/admin/subjectsFilters";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { StudentEnrollmentsPage } from "../pages/student/StudentEnrollmentsPage";
import { StudentGradesPage } from "../pages/student/StudentGradesPage";
import { StudentSubjectsPage } from "../pages/student/StudentSubjectsPage";
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";
import { TeacherEnrollmentsPage } from "../pages/teacher/TeacherEnrollmentsPage";
import { TeacherGradesFilters } from "../pages/teacher/TeacherGradesFilters";
import { TeacherGradesPage } from "../pages/teacher/TeacherGradesPage";
import { TeacherSubjectsPage } from "../pages/teacher/TeacherSubject";
import { ProtectedRoute } from "./ProtectedRoute";

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="card">Cargando...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const homePath = getHomePathForRoles(user.roles);
  if (!homePath) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homePath} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
