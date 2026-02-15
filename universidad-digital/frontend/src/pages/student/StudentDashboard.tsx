import { useEffect, useState } from "react";
import { getStudentMetrics, type StudentMetrics } from "../../api/estudiantes";
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

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

function buildStudentChartData(metrics: StudentMetrics) {
  return [
    { name: "Materias inscritas", value: metrics.enrolled_subjects, color: CHART_COLORS[0] },
    { name: "Periodos activos", value: metrics.active_periods, color: CHART_COLORS[1] },
    { name: "Calificaciones", value: metrics.grades_count, color: CHART_COLORS[2] },
  ];
}

export function StudentDashboard() {
  const [metrics, setMetrics] = useState<StudentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentMetrics()
      .then(setMetrics)
      .catch((err) => {
        console.error("Error cargando métricas estudiante", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="card">
          <p>Cargando métricas...</p>
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

  const barData = buildStudentChartData(metrics);
  const pieData = barData.map(({ name, value, color }) => ({ name, value, color }));

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1 className="dashboard-page__title">Panel Estudiante</h1>
        <p className="dashboard-page__subtitle">Tu progreso académico</p>
      </header>

      <section className="metrics-grid" aria-label="Métricas principales">
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--primary" aria-hidden />
          <span>Materias inscritas</span>
          <strong>{metrics.enrolled_subjects}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--success" aria-hidden />
          <span>Periodos activos</span>
          <strong>{metrics.active_periods}</strong>
        </div>
        <div className="metric-card">
          <div className="metric-card__icon metric-card__icon--warning" aria-hidden />
          <span>Calificaciones registradas</span>
          <strong>{metrics.grades_count}</strong>
        </div>
      </section>

      <section className="charts-row" aria-label="Gráficas del dashboard">
        <article className="chart-card">
          <h3 className="chart-card__title">Tu actividad</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
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
