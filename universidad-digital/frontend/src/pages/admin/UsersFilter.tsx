import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { UserResponse } from "../../api/auth";
import { hasAppRole } from "../../auth/roleHomePath";
import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table } from "../../components/Table";
import { useFetch } from "../../hooks/useFetch";
import { usersService } from "../../services/usersService";
import { getErrorMessage } from "../../utils/apiError";

export function UsersPageFilter() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftActive, setDraftActive] = useState("true");
  const [isSaving, setIsSaving] = useState(false);

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

  const startInlineEdit = (user: UserResponse) => {
    setEditingUserId(user.id);
    setDraftName(user.full_name);
    setDraftActive(user.is_active ? "true" : "false");
    setAlert(null);
  };

  const cancelInlineEdit = () => {
    setEditingUserId(null);
    setDraftName("");
    setDraftActive("true");
  };

  const saveInlineEdit = async (userId: number) => {
    const normalizedName = draftName.trim();
    if (normalizedName.length < 2) {
      setAlert({
        message: "El nombre debe tener al menos 2 caracteres.",
        variant: "error",
      });
      return;
    }

    try {
      setIsSaving(true);
      await usersService.update(userId, {
        full_name: normalizedName,
        is_active: draftActive === "true",
      });
      setAlert({
        message: "Usuario actualizado correctamente.",
        variant: "success",
      });
      cancelInlineEdit();
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredUsers = (users ?? []).filter((user) => {
    const matchesRole =
      roleFilter === "student"
        ? hasAppRole(user.roles, ["Estudiante"])
        : roleFilter === "teacher"
          ? hasAppRole(user.roles, ["Docente"])
          : true;

    const matchesActive =
      activeFilter === "true"
        ? user.is_active === true
        : activeFilter === "false"
          ? user.is_active === false
          : true;

    const searchable = `${user.id} ${user.email} ${user.full_name}`.toLowerCase();
    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

    return matchesRole && matchesActive && matchesSearch;
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

      <Input
        label="Buscar usuario"
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Buscar por ID, email o nombre"
      />

      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <Table<UserResponse>
          caption={getTitle()}
          data={filteredUsers}
          columns={[
            { header: "ID", render: (row) => row.id },
            { header: "Email", render: (row) => row.email },
            {
              header: "Nombre",
              render: (row) =>
                editingUserId === row.id ? (
                  <input
                    className="input"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    aria-label={`Nombre de ${row.email}`}
                  />
                ) : (
                  row.full_name
                ),
            },
            { header: "Roles", render: (row) => row.roles.join(", ") },
            {
              header: "Activo",
              render: (row) =>
                editingUserId === row.id ? (
                  <select
                    className="select"
                    value={draftActive}
                    onChange={(event) => setDraftActive(event.target.value)}
                    aria-label={`Estado de ${row.email}`}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                ) : row.is_active ? (
                  "Sí"
                ) : (
                  "No"
                ),
            },
            {
              header: "Acciones",
              render: (row) => {
                if (editingUserId === row.id) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => void saveInlineEdit(row.id)}
                        disabled={isSaving}
                      >
                        Guardar
                      </Button>
                      <Button onClick={cancelInlineEdit} disabled={isSaving}>
                        Cancelar
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="secondary"
                      onClick={() => startInlineEdit(row)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={row.is_active ? "danger" : "secondary"}
                      onClick={() => void handleToggleActive(row.id, row.is_active)}
                    >
                      {row.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}
