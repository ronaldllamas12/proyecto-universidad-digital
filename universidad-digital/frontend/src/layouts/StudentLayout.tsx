import { Outlet } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";

export function StudentLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
