import { useState } from "react";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { enrollmentsService } from "../../services/enrollmentsService";
import { useSearchParams } from "react-router-dom";

import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { EnrollmentResponse } from "../../api/enrollments";
import { Select } from "../../components/Select";

export function EnrollmentsFilter() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const {
    data: enrollments,
    error,
    isLoading,
    reload,
  } = useFetch(enrollmentsService.list, []);
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("active") ?? "",
  );
  const teacherFilter = searchParams.get("teacher");

  const filteredEnrollments = (enrollments ?? []).filter((enrollment) => {
    const matchesActive =
      activeFilter === "true"
        ? enrollment.is_active === true
        : activeFilter === "false"
          ? enrollment.is_active === false
          : true;

    const hasTeacher = Boolean(
      enrollment.teacher_id || enrollment.teacher_name,
    );
    const matchesTeacher =
      teacherFilter === "assigned"
        ? hasTeacher
        : teacherFilter === "unassigned"
          ? !hasTeacher
          : true;

    return matchesActive && matchesTeacher;
  });

  const getTitle = () => {
    if (activeFilter === "true" && teacherFilter === "unassigned") {
      return "Inscripciones activas sin docente";
    }
    if (activeFilter === "true" && teacherFilter === "assigned") {
      return "Inscripciones activas con docente";
    }
    if (activeFilter === "false" && teacherFilter === "assigned") {
      return "Inscripciones inactivas con docente";
    }
    if (activeFilter === "false" && teacherFilter === "unassigned") {
      return "Inscripciones inactivas sin docente";
    }
    if (activeFilter === "true") {
      return "Inscripciones activas";
    }
    if (activeFilter === "false") {
      return "Inscripciones inactivas";
    }
    if (teacherFilter === "assigned") {
      return "Inscripciones con docente asignado";
    }
    if (teacherFilter === "unassigned") {
      return "Inscripciones sin docente asignado";
    }
    return "Listado de inscripciones";
  };

  const handleToggle = async (row: EnrollmentResponse) => {
    try {
      await enrollmentsService.update(row.id, {
        is_active: !row.is_active,
      });

      setAlert({
        message: row.is_active
          ? "Inscripción cancelada."
          : "Inscripción activada.",
        variant: "success",
      });

      await reload();
    } catch (err) {
      setAlert({
        message: getErrorMessage(err),
        variant: "error",
      });
    }
  };

  return (
    <>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>{getTitle()}</h2>
        <details className="filters-mobile" open>
          <summary>Filtros</summary>
          <div className="grid filters-block">
            <Select
              label="Filtrar por estado"
              options={[
                { value: "", label: "Todas" },
                { value: "true", label: "Activas" },
                { value: "false", label: "Inactivas" },
              ]}
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
            />
          </div>
        </details>
        {alert ? (
          <Alert message={alert.message} variant={alert.variant} />
        ) : null}
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<EnrollmentResponse>
            caption={getTitle()}
            data={filteredEnrollments}
            columns={[
              { header: "ID", render: (row) => row.id },
              {
                header: "Estudiante",
                render: (row) => row.user_name ?? `#${row.user_id}`,
              },
              {
                header: "Materia",
                render: (row) => row.subject_name ?? `#${row.subject_id}`,
              },
              {
                header: "Periodo",
                render: (row) => row.period_name ?? `#${row.period_id}`,
              },
              {
                header: "Docente",
                render: (row) =>
                  (row.teacher_name ?? row.teacher_id)
                    ? `${row.teacher_name}`
                    : "Por asignar",
              },
              {
                header: "Activo",
                render: (row) => (row.is_active ? "Sí" : "No"),
              },
              {
                header: "Acciones",
                render: (row) =>
                  row.is_active ? (
                    <Button
                      variant="danger"
                      onClick={() => void handleToggle(row)}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => void handleToggle(row)}
                    >
                      Activar
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
