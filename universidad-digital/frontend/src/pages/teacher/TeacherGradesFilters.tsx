import { useMemo, useState } from "react";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { gradesService } from "../../services/gradesService";
import { enrollmentsService } from "../../services/enrollmentsService";
import { useFetch } from "../../hooks/useFetch";
import type { GradeResponse } from "../../api/grades";
import { Select } from "../../components/Select";

export function TeacherGradesFilters() {
  const [subjectFilter, setSubjectFilter] = useState("");
  const { data: grades, error, isLoading } = useFetch(gradesService.list, []);

  const { data: enrollments } = useFetch(enrollmentsService.list, []);

  const enrollmentById = useMemo(() => {
    const map = new Map<number, (typeof enrollments)[number]>();
    (enrollments ?? []).forEach((enrollment) => {
      map.set(enrollment.id, enrollment);
    });
    return map;
  }, [enrollments]);

  const subjectOptions = useMemo(() => {
    const map = new Map<number, string>();
    (enrollments ?? []).forEach((row) => {
      map.set(row.subject_id, row.subject_name ?? `Materia #${row.subject_id}`);
    });

    return [
      { value: "", label: "Todas las materias" },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [enrollments]);

  const filteredGrades = useMemo(() => {
    if (!subjectFilter) {
      return grades ?? [];
    }

    const subjectId = Number(subjectFilter);
    return (grades ?? []).filter((grade) => {
      const enrollment = enrollmentById.get(grade.enrollment_id);
      return enrollment?.subject_id === subjectId;
    });
  }, [grades, enrollmentById, subjectFilter]);

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Calificaciones de tus estudiantes</h2>
        <p className="text-muted" style={{ marginBottom: 8 }}>
          Solo puedes calificar a estudiantes inscritos en las materias que
          tienes asignadas.
        </p>
        <details className="filters-mobile" open>
          <summary>Filtros</summary>
          <div className="grid filters-block">
            <Select
              label="Filtrar por materia"
              options={subjectOptions}
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            />
          </div>
        </details>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<GradeResponse>
            caption="Listado de calificaciones"
            data={filteredGrades}
            columns={[
              { header: "ID", render: (row) => row.id },
              {
                header: "Materia",
                render: (row) =>
                  enrollmentById.get(row.enrollment_id)?.subject_name ??
                  row.subject_name ??
                  "—",
              },
              {
                header: "Estudiante",
                render: (row) =>
                  enrollmentById.get(row.enrollment_id)?.user_name ??
                  row.user_name ??
                  "—",
              },
              {
                header: "Periodo",
                render: (row) =>
                  enrollmentById.get(row.enrollment_id)?.period_name ?? "—",
              },
              {
                header: "Estado",
                render: (row) => {
                  const isActive = enrollmentById.get(
                    row.enrollment_id,
                  )?.is_active;
                  if (typeof isActive !== "boolean") {
                    return "—";
                  }
                  return isActive ? "Activo" : "Inactivo";
                },
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
