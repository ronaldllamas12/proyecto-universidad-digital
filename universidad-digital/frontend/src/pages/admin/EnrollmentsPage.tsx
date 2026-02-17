import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { enrollmentsService } from "../../services/enrollmentsService";
import { usersService } from "../../services/usersService";
import { subjectsService } from "../../services/subjectsService";
import { periodsService } from "../../services/periodsService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { EnrollmentResponse } from "../../api/enrollments";

const createSchema = z.object({
  user_id: z.string().min(1, "Selecciona un estudiante"),
  subject_id: z.string().min(1, "Selecciona una materia"),
  period_id: z.string().min(1, "Selecciona un periodo activo"),
  teacher_id: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export function EnrollmentsPage() {
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
  const { data: users } = useFetch(usersService.list, []);
  const { data: subjects } = useFetch(subjectsService.list, []);
  const { data: periods } = useFetch(periodsService.list, []);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const students =
    users?.filter((u) => u.roles?.includes("Estudiante")) ?? [];
  const teachers =
    users?.filter((u) => u.roles?.includes("Docente")) ?? [];
  const activePeriods = periods?.filter((p) => p.is_active) ?? [];

  const studentOptions = students.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (#${user.id})`,
  }));
  const teacherOptions = teachers.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (#${user.id})`,
  }));
  const subjectOptions =
    subjects?.map((subject) => ({
      value: String(subject.id),
      label: `${subject.name} (#${subject.id})`,
    })) ?? [];
  const periodOptions = [
    { value: "", label: "Selecciona un periodo activo" },
    ...activePeriods.map((period) => ({
      value: String(period.id),
      label: `${period.name} (#${period.id})`,
    })),
  ];

  const handleCreate = async (values: CreateForm) => {
    try {
      await enrollmentsService.create({
        user_id: Number(values.user_id),
        subject_id: Number(values.subject_id),
        period_id: Number(values.period_id),
        teacher_id: values.teacher_id ? Number(values.teacher_id) : undefined,
      });
      setAlert({ message: "Inscripción creada.", variant: "success" });
      createForm.reset();
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await enrollmentsService.deactivate(id);
      setAlert({ message: "Inscripción cancelada.", variant: "success" });
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  return (
    <>
      <div className="card">
        <h2>Crear inscripción</h2>
        {alert ? (
          <Alert message={alert.message} variant={alert.variant} />
        ) : null}
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="grid">
          <Select
            label="Periodo (solo activos)"
            options={periodOptions}
            {...createForm.register("period_id")}
            error={createForm.formState.errors.period_id?.message}
          />
          <Select
            label="Materia"
            options={[
              { value: "", label: "Selecciona una materia" },
              ...subjectOptions,
            ]}
            {...createForm.register("subject_id")}
            error={createForm.formState.errors.subject_id?.message}
          />
          <Select
            label="Estudiante"
            options={[
              { value: "", label: "Selecciona un estudiante" },
              ...studentOptions,
            ]}
            {...createForm.register("user_id")}
            error={createForm.formState.errors.user_id?.message}
          />
          <Select
            label="Docente (opcional)"
            options={[
              { value: "", label: "Selecciona un docente" },
              ...teacherOptions,
            ]}
            {...createForm.register("teacher_id")}
            error={createForm.formState.errors.teacher_id?.message}
          />
          <Button type="submit">Crear inscripción</Button>
        </form>
      </div>

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
                render: (row) => row.teacher_name ?? row.teacher_id ? `#${row.teacher_id}` : "—",
              },
              {
                header: "Activo",
                render: (row) => (row.is_active ? "Sí" : "No"),
              },
              {
                header: "Acciones",
                render: (row) => (
                  <Button
                    variant="danger"
                    onClick={() => void handleDeactivate(row.id)}
                  >
                    Cancelar
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
