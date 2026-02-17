import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useFetch } from "../../hooks/useFetch";
import { enrollmentsService } from "../../services/enrollmentsService";
import type { EnrollmentResponse } from "../../api/enrollments";

export function TeacherEnrollmentsPage() {
  const { data: enrollments, error, isLoading } = useFetch(enrollmentsService.list, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Estudiantes enrolados</h1>
        <p className="dashboard-page__subtitle">
          Estudiantes inscritos en las materias que tienes asignadas
        </p>
      </header>
      <div className="card">
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<EnrollmentResponse>
            caption="Estudiantes enrolados en tus materias"
            data={enrollments ?? []}
            columns={[
              { header: "ID", render: (row) => row.id },
              {
                header: "Materia",
                render: (row) => row.subject_name ?? `#${row.subject_id}`,
              },
              {
                header: "Estudiante",
                render: (row) => row.user_name ?? `#${row.user_id}`,
              },
              {
                header: "Periodo",
                render: (row) => row.period_name ?? `#${row.period_id}`,
              },
              {
                header: "Activo",
                render: (row) => (row.is_active ? "Sí" : "No"),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
