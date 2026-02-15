import { Outlet } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";

export function DocenteLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
