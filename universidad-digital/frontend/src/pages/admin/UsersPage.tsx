import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";

import { Alert } from "../../components/Alert";
import { usersService } from "../../services/usersService";
import { rolesService } from "../../services/rolesService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  password: z.string().min(8),
  role_id: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(2).optional(),
  is_active: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export function UsersPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const { data: roles } = useFetch(rolesService.list, []);

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

  const handleCreate = async (values: CreateForm) => {
    try {
      await usersService.create({
        email: values.email,
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
              label="Email"
              type="email"
              {...createForm.register("email")}
              error={createForm.formState.errors.email?.message}
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
