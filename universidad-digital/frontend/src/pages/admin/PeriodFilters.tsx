import { useState } from "react";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { periodsService } from "../../services/periodsService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { PeriodResponse } from "../../api/periods";


export function PeriodsFilters() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const {
    data: periods,
    error,
    isLoading,
    reload,
  } = useFetch(periodsService.list, []);

  const handleDeactivate = async (id: number) => {
    try {
      await periodsService.deactivate(id);
      setAlert({ message: "Periodo desactivado.", variant: "success" });
      await reload();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await periodsService.activate(id);
      await reload();
    } catch (err) {
      console.error("Error al activar período", error);
    }
  };
  return (
    <>

    <div className="card" style={{ marginTop: 16 }}>
        <h2>Listado de periodos</h2>
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
        <p>Cargando...</p>
        ) : (
        <Table<PeriodResponse>
            caption="Listado de periodos"
            data={periods ?? []}
            columns={[
            { header: "ID", render: (row) => row.id },
            { header: "Código", render: (row) => row.code },
            { header: "Nombre", render: (row) => row.name },
            { header: "Inicio", render: (row) => row.start_date },
            { header: "Fin", render: (row) => row.end_date },
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
                    onClick={() => void handleDeactivate(row.id)}
                >
                    Desactivar
                </Button>
                ) : (
                <Button
                    variant="primary"
                    onClick={() => void handleActivate(row.id)}
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
