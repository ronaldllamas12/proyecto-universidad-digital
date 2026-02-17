import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useGrades } from "../../hooks/useGrades";
import type { GradeResponse } from "../../api/grades";

export function StudentGradesPage() {
  const { data, error, isLoading } = useGrades();

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Mis calificaciones</h1>
        <p className="dashboard-page__subtitle">
          Calificaciones asignadas por tus profesores
        </p>
      </header>
      <div className="card">
        <h2>Calificaciones</h2>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<GradeResponse>
            caption="Calificaciones"
            data={data ?? []}
            columns={[
              { header: "ID", render: (row) => row.id },
              { header: "Inscripción", render: (row) => row.enrollment_id },
              {
                header: "Nota",
                render: (row) => (row.value != null ? String(row.value) : "—"),
              },
              { header: "Notas", render: (row) => row.notes ?? "—" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
