import { useState } from "react";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { enrollmentsService } from "../../services/enrollmentsService";

import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { EnrollmentResponse } from "../../api/enrollments";




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
        <h2>Listado de inscripciones</h2>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<EnrollmentResponse>
            caption="Listado de inscripciones"
            data={enrollments ?? []}
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
                render: (row) => row.teacher_name ?? row.teacher_id ? `${row.teacher_name}` : "Por asignar",
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
