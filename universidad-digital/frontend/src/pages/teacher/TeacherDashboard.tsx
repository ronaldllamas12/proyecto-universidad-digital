import { useFetch } from "../../hooks/useFetch";
import { getTeacherMetrics, type TeacherMetrics } from "../../api/teachers";
import { Alert } from "../../components/Alert";
import { getErrorMessage } from "../../utils/apiError";
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

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6"];

function buildTeacherChartData(metrics: TeacherMetrics) {
  return [
    { name: "Materias", value: metrics.total_subjects, color: CHART_COLORS[0] },
    { name: "Estudiantes", value: metrics.total_students, color: CHART_COLORS[1] },
    { name: "Periodos", value: metrics.active_periods, color: CHART_COLORS[2] },
    { name: "Usuarios", value: metrics.total_users, color: CHART_COLORS[3] },
  ];
}

export function TeacherDashboard() {
  const { data: metrics, isLoading, error } = useFetch(getTeacherMetrics, []);

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

  const barData = buildTeacherChartData(metrics);
  const pieData = barData.map(({ name, value, color }) => ({ name, value, color }));

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Panel Docente</h1>
        <p className="dashboard-page__subtitle">
          Resumen de tus materias y estudiantes
        </p>
      </header>

      <section className="metrics-grid" aria-label="Métricas principales">
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--primary" aria-hidden />
          <span>Materias asignadas</span>
          <strong>{metrics.total_subjects}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--success" aria-hidden />
          <span>Estudiantes</span>
          <strong>{metrics.total_students}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--warning" aria-hidden />
          <span>Periodos activos</span>
          <strong>{metrics.active_periods}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--info" aria-hidden />
          <span>Usuarios totales</span>
          <strong>{metrics.total_users}</strong>
        </div>
      </section>

      <section className="charts-row" aria-label="Gráficas del dashboard">
        <article className="chart-card">
          <h3 className="chart-card__title">Resumen por categoría</h3>
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
          <h3 className="chart-card__title">Distribución</h3>
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
