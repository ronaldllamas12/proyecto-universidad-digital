import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useEnrollments } from "../../hooks/useEnrollments";
import type { EnrollmentResponse } from "../../api/enrollments";

export function StudentEnrollmentsPage() {
  const { data, error, isLoading } = useEnrollments();

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Mis inscripciones</h1>
        <p className="dashboard-page__subtitle">
          Materias en las que estás inscrito y tus profesores
        </p>
      </header>
      <div className="card">
      <h2>Inscripciones</h2>
      {error ? <Alert message={error} /> : null}
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <Table<EnrollmentResponse>
          caption="Mis inscripciones"
          data={data ?? []}
          columns={[
            { header: "ID", render: (row) => row.id },
            {
              header: "Materia",
              render: (row) => row.subject_name ?? `#${row.subject_id}`,
            },
            {
              header: "Periodo",
              render: (row) => row.period_name ?? `#${row.period_id}`,
            },
            {
              header: "Profesor",
              render: (row) => row.teacher_name ?? (row.teacher_id ? `#${row.teacher_id}` : "—"),
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
