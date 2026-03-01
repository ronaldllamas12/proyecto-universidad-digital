import { useMemo, useState } from "react";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useGrades } from "../../hooks/useGrades";
import { useEnrollments } from "../../hooks/useEnrollments";
import type { GradeResponse } from "../../api/grades";
import { Select } from "../../components/Select";

export function StudentGradesPage() {
  const [subjectFilter, setSubjectFilter] = useState("");
  const { data, error, isLoading } = useGrades();
  const { data: enrollments } = useEnrollments();

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
      return data ?? [];
    }
    const subjectId = Number(subjectFilter);
    return (data ?? []).filter((grade) => {
      const enrollment = enrollmentById.get(grade.enrollment_id);
      return enrollment?.subject_id === subjectId;
    });
  }, [data, enrollmentById, subjectFilter]);

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
            caption="Calificaciones"
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
    </div>
  );
}
