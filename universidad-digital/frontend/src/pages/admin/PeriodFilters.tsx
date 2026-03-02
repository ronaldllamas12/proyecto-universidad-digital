import { useState } from "react";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { periodsService } from "../../services/periodsService";
import { useFetch } from "../../hooks/useFetch";
import { getErrorMessage } from "../../utils/apiError";
import type { PeriodResponse } from "../../api/periods";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const activeFilter = searchParams.get("active");

  const filteredPeriods = (periods ?? []).filter((period) => {
    if (activeFilter === "true") {
      return period.is_active === true;
    }
    if (activeFilter === "false") {
      return period.is_active === false;
    }
    return true;
  });

  const getTitle = () => {
    if (activeFilter === "true") {
      return "Listado de periodos activos";
    }
    if (activeFilter === "false") {
      return "Listado de periodos inactivos";
    }
    return "Listado de periodos";
  };

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
        <h2>{getTitle()}</h2>
        {alert ? (
          <Alert message={alert.message} variant={alert.variant} />
        ) : null}
        {error ? <Alert message={error} /> : null}
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Table<PeriodResponse>
            caption={getTitle()}
            data={filteredPeriods}
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
