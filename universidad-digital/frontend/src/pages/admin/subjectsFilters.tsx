import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { subjectsService } from "../../services/subjectsService";
import { useFetch } from "../../hooks/useFetch";
import type { SubjectResponse } from "../../api/subjects";
import { Button } from "../../components/Button";
import { getErrorMessage } from "../../utils/apiError";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export function SubjectsListFilter() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const [searchParams] = useSearchParams();

  const teacherFilter = searchParams.get("teacher");
  const activeFilter = searchParams.get("active");

  const {
    data: subjects,
    error,
    isLoading,
    reload,
  } = useFetch(subjectsService.list, []);

  const handleToggleActive = async (subjectId: number, isActive: boolean) => {
    try {
      await subjectsService.update(subjectId, { is_active: !isActive });

      setAlert({
        message: isActive ? "Materia desactivada." : "Materia activada.",
        variant: "success",
      });

      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  // 🔎 FILTRO DINÁMICO
  const filteredSubjects = (subjects ?? []).filter((subject) => {
    const matchesTeacher =
      teacherFilter === "assigned"
        ? !!subject.teacher_full_name
        : teacherFilter === "unassigned"
          ? !subject.teacher_full_name
          : true;

    const matchesActive =
      activeFilter === "true"
        ? subject.is_active === true
        : activeFilter === "false"
          ? subject.is_active === false
          : true;

    return matchesTeacher && matchesActive;
  });

  // 🏷️ TÍTULO DINÁMICO
  const getTitle = () => {
    if (teacherFilter === "unassigned" && activeFilter === "true") {
      return "Materias Activas sin Profesor";
    }
    if (teacherFilter === "assigned" && activeFilter === "true") {
      return "Materias Activas con Profesor";
    }
    if (teacherFilter === "unassigned") {
      return "Materias sin Profesor";
    }
    if (teacherFilter === "assigned") {
      return "Materias con Profesor Asignado";
    }
    return "Listado de Materias";
  };

  return (
    <div className="card">
      <h2>{getTitle()}</h2>

      {alert && <Alert message={alert.message} variant={alert.variant} />}
      {error && <Alert message={error} />}

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <Table<SubjectResponse>
          caption={getTitle()}
          data={filteredSubjects}
          columns={[
            { header: "ID", render: (row) => row.id },
            { header: "Código", render: (row) => row.code },
            { header: "Nombre", render: (row) => row.name },
            { header: "Créditos", render: (row) => row.credits },

            {
              header: "Profesor",
              render: (row) => row.teacher_full_name || "Profesor por asignar",
            },

            {
              header: "Estudiantes",
              render: (row) => row.students_count ?? 0,
            },

            {
              header: "Activo",
              render: (row) => (row.is_active ? "Sí" : "No"),
            },

            {
              header: "Acciones",
              render: (row) => (
                <Button
                  variant={row.is_active ? "danger" : "secondary"}
                  onClick={() => void handleToggleActive(row.id, row.is_active)}
                >
                  {row.is_active ? "Desactivar" : "Activar"}
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
