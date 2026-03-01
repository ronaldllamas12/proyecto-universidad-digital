import { useMemo, useState } from "react";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { useEnrollments } from "../../hooks/useEnrollments";
import type { EnrollmentResponse } from "../../api/enrollments";
import { Select } from "../../components/Select";

export function StudentEnrollmentsPage() {
  const [subjectFilter, setSubjectFilter] = useState("");
  const { data, error, isLoading } = useEnrollments();

  const subjectOptions = useMemo(() => {
    const map = new Map<number, string>();
    (data ?? []).forEach((row) => {
      map.set(row.subject_id, row.subject_name ?? `Materia #${row.subject_id}`);
    });

    return [
      { value: "", label: "Todas las materias" },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [data]);

  const filteredEnrollments = useMemo(() => {
    if (!subjectFilter) {
      return data ?? [];
    }
    const subjectId = Number(subjectFilter);
    return (data ?? []).filter((row) => row.subject_id === subjectId);
  }, [data, subjectFilter]);

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
          <Table<EnrollmentResponse>
            caption="Mis inscripciones"
            data={filteredEnrollments}
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
                render: (row) =>
                  row.teacher_name ??
                  (row.teacher_id ? `#${row.teacher_id}` : "—"),
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
