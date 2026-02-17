import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { gradesService } from "../../services/gradesService";
import { enrollmentsService } from "../../services/enrollmentsService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { GradeResponse } from "../../api/grades";
import { SubjectResponse } from "../../api/subjects";

const createSchema = z.object({
  enrollment_id: z.string().min(1),
  value: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  value: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

export function TeacherGradesPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const {
    data: grades,
    error,
    isLoading,
    reload,
  } = useFetch(gradesService.list, []);
  const { data: enrollments } = useFetch(enrollmentsService.list, []);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const enrollmentOptions =
    enrollments?.map((enrollment) => ({
      value: String(enrollment.id),
      label: `${enrollment.subject_name ?? "Materia"} - ${enrollment.user_name ?? "Estudiante"} (#${enrollment.id})`,
    })) ?? [];

  const handleCreate = async (values: CreateForm) => {
    try {
      await gradesService.create({
        enrollment_id: Number(values.enrollment_id),
        value: Number(values.value),
        notes: values.notes ?? null,
      });
      setAlert({ message: "Calificación registrada.", variant: "success" });
      createForm.reset();
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleUpdate = async (values: UpdateForm) => {
    try {
      await gradesService.update(Number(values.id), {
        value: values.value ?? undefined,
        notes: values.notes ?? undefined,
      });
      setAlert({ message: "Calificación actualizada.", variant: "success" });
      updateForm.reset();
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  return (
    <>
      <div className="grid grid-2">
        <div className="card">
          <h2>Registrar calificación</h2>
          {alert ? (
            <Alert message={alert.message} variant={alert.variant} />
          ) : null}
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="grid"
          >
            <Select
              label="Inscripción"
              options={[
                { value: "", label: "Selecciona una inscripción" },
                ...enrollmentOptions,
              ]}
              {...createForm.register("enrollment_id")}
              error={createForm.formState.errors.enrollment_id?.message}
            />
            <Input
              label="Nota"
              type="number"
              step="0.01"
              {...createForm.register("value")}
              error={createForm.formState.errors.value?.message}
            />
            <Input
              label="Notas (opcional)"
              {...createForm.register("notes")}
              error={createForm.formState.errors.notes?.message}
            />
            <Button type="submit">Registrar</Button>
          </form>
        </div>

        <div className="card">
          <h2>Actualizar calificación</h2>
          <form
            onSubmit={updateForm.handleSubmit(handleUpdate)}
            className="grid"
          >
            <Input
              label="ID de calificación"
              {...updateForm.register("id")}
              error={updateForm.formState.errors.id?.message}
            />
            <Input
              label="Nota (opcional)"
              type="number"
              step="0.01"
              {...updateForm.register("value")}
              error={updateForm.formState.errors.value?.message}
            />
            <Input
              label="Notas (opcional)"
              {...updateForm.register("notes")}
              error={updateForm.formState.errors.notes?.message}
            />
            <Button type="submit" variant="secondary">
              Actualizar
            </Button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Calificaciones de tus estudiantes</h2>
        <p className="text-muted" style={{ marginBottom: 8 }}>
          Solo puedes calificar a estudiantes inscritos en las materias que tienes asignadas.
        </p>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<GradeResponse>
            caption="Listado de calificaciones"
            data={grades ?? []}
            columns={[
              { header: "ID", render: (row) => row.id },
              { header: "Inscripción", render: (row) => row.subject_name },
              {
                header: "Estudiante",
                render: (row) => row.user_name ?? "—",
              },
              {
                header: "Nota",
                render: (row) => (row.value != null ? String(row.value) : "—"),
              },
              { header: "Notas", render: (row) => row.notes ?? "—" },
            ]}
          />
        )}
      </div>
    </>
  );
}
