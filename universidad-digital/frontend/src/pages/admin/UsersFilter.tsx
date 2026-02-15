import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { usersService } from "../../services/usersService";
import { useFetch } from "../../hooks/useFetch";
import type { UserResponse } from "../../api/auth";
import { Button } from "../../components/Button";
import { getErrorMessage } from "../../utils/apiError";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export function UsersPageFilter() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const [searchParams] = useSearchParams();

  const roleFilter = searchParams.get("role");
  const activeFilter = searchParams.get("active");

  const {
    data: users,
    error,
    isLoading,
    reload,
  } = useFetch(usersService.list, []);

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await usersService.update(userId, { is_active: !isActive });
      setAlert({
        message: isActive ? "Usuario desactivado." : "Usuario activado.",
        variant: "success",
      });
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  // 🔎 FILTRO DINÁMICO
  const filteredUsers = (users ?? []).filter((user) => {
    const matchesRole =
      roleFilter === "student"
        ? user.roles.includes("Estudiante")
        : roleFilter === "teacher"
          ? user.roles.includes("Docente")
          : true;

    const matchesActive =
      activeFilter === "true"
        ? user.is_active === true
        : activeFilter === "false"
          ? user.is_active === false
          : true;

    return matchesRole && matchesActive;
  });

  // TÍTULO DINÁMICO
  const getTitle = () => {
    if (roleFilter === "student" && activeFilter === "true") {
      return "Listado de Estudiantes Activos";
    }
    if (roleFilter === "teacher" && activeFilter === "true") {
      return "Listado de Docentes Activos";
    }
    if (roleFilter === "student") {
      return "Listado de Estudiantes";
    }
    if (roleFilter === "teacher") {
      return "Listado de Docentes";
    }
    return "Listado de Usuarios";
  };

  return (
    <div className="card-list">
      <h2>{getTitle()}</h2>

      {alert && <Alert message={alert.message} variant={alert.variant} />}
      {error && <Alert message={error} />}

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <Table<UserResponse>
          caption={getTitle()}
          data={filteredUsers}
          columns={[
            { header: "ID", render: (row) => row.id },
            { header: "Email", render: (row) => row.email },
            { header: "Nombre", render: (row) => row.full_name },
            { header: "Roles", render: (row) => row.roles.join(", ") },
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
