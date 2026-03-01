import { useMemo, useState } from "react";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useFetch } from "../../hooks/useFetch";
import { enrollmentsService } from "../../services/enrollmentsService";
import type { EnrollmentResponse } from "../../api/enrollments";
import { Select } from "../../components/Select";

export function TeacherEnrollmentsPage() {
  const [subjectFilter, setSubjectFilter] = useState("");
  const {
    data: enrollments,
    error,
    isLoading,
  } = useFetch(enrollmentsService.list, []);

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

  const filteredEnrollments = useMemo(() => {
    if (!subjectFilter) {
      return enrollments ?? [];
    }
    const subjectId = Number(subjectFilter);
    return (enrollments ?? []).filter((row) => row.subject_id === subjectId);
  }, [enrollments, subjectFilter]);

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
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<EnrollmentResponse>
            caption="Estudiantes enrolados en tus materias"
            data={filteredEnrollments}
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
