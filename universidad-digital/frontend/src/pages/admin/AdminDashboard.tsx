import { useFetch } from "../../hooks/useFetch";
import { getAdminMetrics, type AdminMetrics } from "../../api/dashboard";
import { Alert } from "../../components/Alert";
import { getErrorMessage } from "../../utils/apiError";
import { NavLink } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const METRIC_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

function buildChartData(metrics: AdminMetrics) {
  return [
    { name: "Usuarios", value: metrics.total_users, color: METRIC_COLORS[0] },
    { name: "Estudiantes", value: metrics.total_students, color: METRIC_COLORS[1] },
    { name: "Docentes", value: metrics.total_teachers, color: METRIC_COLORS[2] },
    { name: "Materias", value: metrics.total_subjects, color: METRIC_COLORS[3] },
    { name: "Periodos", value: metrics.active_periods, color: METRIC_COLORS[4] },
  ];
}

export function AdminDashboard() {
  const { data: metrics, isLoading, error } = useFetch(getAdminMetrics, []);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="card">
          <p>Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="card">
          <Alert message={getErrorMessage(error)} />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="dashboard-page">
        <div className="card">No hay datos disponibles</div>
      </div>
    );
  }

  const barData = buildChartData(metrics);
  const pieData = barData.map(({ name, value, color }) => ({ name, value, color }));

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Panel Administrador</h1>
        <p className="dashboard-page__subtitle">Resumen general del sistema</p>
      </header>

      <section className="metrics-grid" aria-label="Métricas principales">
        <NavLink to="/admin/users/list" className="metric-card metric-card--link">
          <div className="metric-card__icon metric-card__icon--primary" aria-hidden />
          <span>Usuarios</span>
          <strong>{metrics.total_users}</strong>
        </NavLink>
        <NavLink
          to="/admin/users/list?role=student&active=true"
          className="metric-card metric-card--link"
        >
          <div className="metric-card__icon metric-card__icon--success" aria-hidden />
          <span>Estudiantes activos</span>
          <strong>{metrics.total_students}</strong>
        </NavLink>
        <NavLink
          to="/admin/users/list?role=teacher&active=true"
          className="metric-card metric-card--link"
        >
          <div className="metric-card__icon metric-card__icon--warning" aria-hidden />
          <span>Docentes activos</span>
          <strong>{metrics.total_teachers}</strong>
        </NavLink>
        <NavLink to="/admin/subject/filter" className="metric-card metric-card--link">
          <div className="metric-card__icon metric-card__icon--info" aria-hidden />
          <span>Materias</span>
          <strong>{metrics.total_subjects}</strong>
        </NavLink>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--primary" aria-hidden />
          <span>Periodos activos</span>
          <strong>{metrics.active_periods}</strong>
        </div>
      </section>

      <section className="charts-row" aria-label="Gráficas del dashboard">
        <article className="chart-card">
          <h3 className="chart-card__title">Distribución por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              />
              <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
        <article className="chart-card">
          <h3 className="chart-card__title">Proporción del sistema</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>
    </div>
  );
}
