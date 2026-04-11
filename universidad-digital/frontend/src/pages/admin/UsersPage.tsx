import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";

import { Alert } from "../../components/Alert";
import { useFetch } from "../../hooks/useFetch";
import { rolesService } from "../../services/rolesService";
import { usersService } from "../../services/usersService";
import { getErrorMessage } from "../../utils/apiError";

const createSchema = z.object({
  email: z.string().email("Ingresa un correo institucional valido."),
  recovery_email: z
    .string()
    .email("Ingresa un correo personal valido.")
    .optional()
    .or(z.literal("")),
  full_name: z.string().min(2),
  password: z.string().min(8),
  role_id: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(2).optional(),
  recovery_email: z
    .string()
    .email("Ingresa un correo personal valido.")
    .optional()
    .or(z.literal("")),
  is_active: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export function UsersPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: roles } = useFetch(rolesService.list, []);
  const {
    data: users,
    error: usersError,
    isLoading: usersLoading,
  } = useFetch(usersService.list, []);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const roleOptions =
    roles?.map((role) => ({
      value: String(role.id),
      label: `${role.name} (#${role.id})`,
    })) ?? [];

  const normalizedQuery = userQuery.trim().toLowerCase();
  const matchedUsers = (users ?? [])
    .filter((user) => {
      if (!normalizedQuery) {
        return true;
      }
      const haystack = `${user.id} ${user.email} ${user.full_name}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 50);

  const userOptions = [
    {
      value: "",
      label: usersLoading
        ? "Cargando usuarios..."
        : matchedUsers.length
          ? "Selecciona un usuario"
          : "No se encontraron usuarios",
    },
    ...matchedUsers.map((user) => ({
      value: String(user.id),
      label: `#${user.id} - ${user.full_name} (${user.email})`,
    })),
  ];

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);

    if (!id) {
      return;
    }

    const selected = (users ?? []).find((user) => String(user.id) === id);
    if (!selected) {
      return;
    }

    updateForm.setValue("id", String(selected.id), { shouldValidate: true });
    updateForm.setValue("full_name", selected.full_name, { shouldValidate: true });
    updateForm.setValue("recovery_email", selected.recovery_email ?? "", {
      shouldValidate: true,
    });
    updateForm.setValue("is_active", selected.is_active ? "true" : "false");
  };

  const handleCreate = async (values: CreateForm) => {
    try {
      await usersService.create({
        email: values.email,
        recovery_email: values.recovery_email || undefined,
        full_name: values.full_name,
        password: values.password,
        role_ids: [Number(values.role_id)],
      });
      setAlert({
        message: "Usuario creado correctamente.",
        variant: "success",
      });
      createForm.reset();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleUpdate = async (values: UpdateForm) => {
    try {
      await usersService.update(Number(values.id), {
        full_name: values.full_name || undefined,
        recovery_email: values.recovery_email || undefined,
        is_active: values.is_active ? values.is_active === "true" : undefined,
      });
      setAlert({
        message: "Usuario actualizado correctamente.",
        variant: "success",
      });
      updateForm.reset();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  return (
    <>
      <div className="grid grid-2">
        <div className="card">
          <h2>Crear usuario</h2>
          {alert ? (
            <Alert message={alert.message} variant={alert.variant} />
          ) : null}
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="grid"
          >
            <Input
              label="Correo institucional (login)"
              type="email"
              {...createForm.register("email")}
              error={createForm.formState.errors.email?.message}
            />
            <Input
              label="Correo personal (recuperacion)"
              type="email"
              {...createForm.register("recovery_email")}
              error={createForm.formState.errors.recovery_email?.message}
            />
            <Input
              label="Nombre completo"
              {...createForm.register("full_name")}
              error={createForm.formState.errors.full_name?.message}
            />
            <Input
              label="Contraseña"
              type="password"
              {...createForm.register("password")}
              error={createForm.formState.errors.password?.message}
            />
            <Select
              label="Rol"
              options={[
                { value: "", label: "Selecciona un rol" },
                ...roleOptions,
              ]}
              {...createForm.register("role_id")}
              error={createForm.formState.errors.role_id?.message}
            />
            <Button type="submit">Crear</Button>
          </form>
        </div>

        <div className="card">
          <h2>Actualizar usuario</h2>
          <Input
            label="Buscar usuario (ID, nombre o email)"
            value={userQuery}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Ejemplo: maria, 12 o correo@dominio.com"
          />
          <Select
            label="Usuario"
            value={selectedUserId}
            onChange={(event) => handleSelectUser(event.target.value)}
            options={userOptions}
            disabled={usersLoading || !userOptions.length}
          />
          {usersError ? (
            <Alert message={usersError} variant="error" />
          ) : null}
          <form
            onSubmit={updateForm.handleSubmit(handleUpdate)}
            className="grid"
          >
            <Input
              label="ID de usuario"
              {...updateForm.register("id")}
              error={updateForm.formState.errors.id?.message}
            />
            <Input
              label="Nombre completo (opcional)"
              {...updateForm.register("full_name")}
              error={updateForm.formState.errors.full_name?.message}
            />
            <Input
              label="Correo personal (recuperacion)"
              type="email"
              {...updateForm.register("recovery_email")}
              error={updateForm.formState.errors.recovery_email?.message}
            />
            <Select
              label="Activo"
              options={[
                { value: "", label: "Sin cambios" },
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ]}
              {...updateForm.register("is_active")}
              error={updateForm.formState.errors.is_active?.message}
            />
            <Button type="submit" variant="secondary">
              Actualizar
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
