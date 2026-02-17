import { useState } from "react";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { gradesService } from "../../services/gradesService";
import { useFetch } from "../../hooks/useFetch";
import type { GradeResponse } from "../../api/grades";

export function GradesPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const {
    data: grades,
    error,
    isLoading,
  } = useFetch(gradesService.list, []);

  return (
    <>
      <div className="card">
        <h2>Calificaciones</h2>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Como administrador no puedes ver las notas ni registrar calificaciones. Solo los docentes pueden calificar a los estudiantes.
        </p>
        {alert ? (
          <Alert message={alert.message} variant={alert.variant} />
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Listado de calificaciones (sin valor de nota)</h2>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<GradeResponse>
            caption="Listado de calificaciones"
            data={grades ?? []}
            columns={[
              { header: "ID", render: (row) => row.id },
              { header: "Inscripción", render: (row) => row.enrollment_id },
              {
                header: "Estudiante",
                render: (row) => row.user_name ?? "—",
              },
              {
                header: "Nota",
                render: (row) => (row.value != null ? String(row.value) : "—"),
              },
              { header: "Notas", render: (row) => row.notes ?? "—" },
            ]}
          />
        )}
      </div>
    </>
  );
}
export default GradesPage;
