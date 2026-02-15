import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { subjectsService } from "../../services/subjectsService";

import { getErrorMessage } from "../../utils/apiError";

const createSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  credits: z.coerce.number().min(1).max(30),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3).optional(),
  credits: z.coerce.number().min(1).max(30).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export function SubjectsPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const handleCreate = async (values: CreateForm) => {
    try {
      await subjectsService.create(values);
      setAlert({ message: "Materia creada.", variant: "success" });
      createForm.reset();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleUpdate = async (values: UpdateForm) => {
    try {
      await subjectsService.update(Number(values.id), {
        name: values.name || undefined,
        credits: values.credits || undefined,
      });
      setAlert({ message: "Materia actualizada.", variant: "success" });
      updateForm.reset();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  return (
    <>
      {alert && <Alert message={alert.message} variant={alert.variant} />}

      <div className="grid grid-2">
        {/* Crear */}
        <div className="card">
          <h2>Crear materia</h2>
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="grid"
          >
            <Input
              label="Código"
              {...createForm.register("code")}
              error={createForm.formState.errors.code?.message}
            />
            <Input
              label="Nombre"
              {...createForm.register("name")}
              error={createForm.formState.errors.name?.message}
            />
            <Input
              label="Créditos"
              type="number"
              {...createForm.register("credits")}
              error={createForm.formState.errors.credits?.message}
            />
            <Button type="submit">Crear</Button>
          </form>
        </div>

        {/* Actualizar */}
        <div className="card">
          <h2>Actualizar materia</h2>
          <form
            onSubmit={updateForm.handleSubmit(handleUpdate)}
            className="grid"
          >
            <Input
              label="ID de materia"
              {...updateForm.register("id")}
              error={updateForm.formState.errors.id?.message}
            />
            <Input
              label="Nombre (opcional)"
              {...updateForm.register("name")}
              error={updateForm.formState.errors.name?.message}
            />
            <Input
              label="Créditos (opcional)"
              type="number"
              {...updateForm.register("credits")}
              error={updateForm.formState.errors.credits?.message}
            />
            <Button type="submit" variant="secondary">
              Actualizar
            </Button>
          </form>
        </div>
      </div>

      {/* Listado con filtros */}
    </>
  );
}
