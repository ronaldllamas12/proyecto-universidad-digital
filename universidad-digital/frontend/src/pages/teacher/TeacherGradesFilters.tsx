
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { gradesService } from "../../services/gradesService";
import { useFetch } from "../../hooks/useFetch";
import type { GradeResponse } from "../../api/grades";




export function TeacherGradesFilters() {
 
  const {
    data: grades,
    error,
    isLoading,
} = useFetch(gradesService.list, []);

return (
    <>

    <div className="card" style={{ marginTop: 16 }}>
        <h2>Calificaciones de tus estudiantes</h2>
        <p className="text-muted" style={{ marginBottom: 8 }}>
            Solo puedes calificar a estudiantes inscritos en las materias que tienes asignadas.
        </p>
            {error ? <Alert message={error} /> : null}
            {isLoading ? (
            <p>Cargando...</p>
        ) : (
        <Table<GradeResponse>
            caption="Listado de calificaciones"
            data={grades ?? []}
            columns={[
                { header: "ID", render: (row) => row.id },
                { header: "Inscripción", render: (row) => row.subject_name },
                { header: "Estudiante",  render: (row) => row.user_name ?? "—",},
                { header: "Nota",  render: (row) => (row.value != null ? String(row.value) : "—"), },
                { header: "Notas", render: (row) => row.notes ?? "—" },]}
        />
        )}
    </div>
    </>
);
}
