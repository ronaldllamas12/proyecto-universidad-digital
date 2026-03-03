import { useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Alert } from "../../components/Alert";
import { gradesService } from "../../services/gradesService";
import { enrollmentsService } from "../../services/enrollmentsService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";

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

function truncateLabel(text: string, maxLength = 46) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function TeacherGradesPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const { reload } = useFetch(gradesService.list, []);
  const { data: enrollments } = useFetch(enrollmentsService.list, []);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  });

  const subjectOptions = useMemo(() => {
    const map = new Map<number, string>();
    (enrollments ?? []).forEach((row) => {
      map.set(row.subject_id, row.subject_name ?? `Materia #${row.subject_id}`);
    });

    return [
      { value: "", label: "Selecciona una materia" },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, name]) => ({ value: String(id), label: name })),
    ];
  }, [enrollments]);

  const filteredEnrollments = useMemo(() => {
    if (!subjectFilter) {
      return [];
    }

    const subjectId = Number(subjectFilter);
    return (enrollments ?? []).filter((row) => row.subject_id === subjectId);
  }, [enrollments, subjectFilter]);

  const enrollmentOptions = filteredEnrollments.map((enrollment) => ({
    value: String(enrollment.id),
    label: truncateLabel(
      `${enrollment.user_name ?? "Estudiante"} · ${enrollment.period_name ?? "Periodo"}`,
    ),
  }));

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
              label="Materia"
              options={subjectOptions}
              value={subjectFilter}
              onChange={(event) => {
                setSubjectFilter(event.target.value);
                createForm.setValue("enrollment_id", "");
              }}
            />
            <Select
              label="Estudiante inscrito"
              options={[
                {
                  value: "",
                  label: subjectFilter
                    ? "Selecciona un estudiante inscrito"
                    : "Primero selecciona una materia",
                },
                ...enrollmentOptions,
              ]}
              {...createForm.register("enrollment_id")}
              disabled={!subjectFilter}
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
    </>
  );
}
