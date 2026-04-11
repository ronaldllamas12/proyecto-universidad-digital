import { Link, useNavigate } from "react-router-dom";
import { getHomePathForRoles } from "../auth/roleHomePath";
import { useAuth } from "../hooks/useAuth";

export function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const homePath = getHomePathForRoles(user?.roles ?? []) ?? "/login";

  const handleGoBack = () => {
    const historyIndex =
      typeof window !== "undefined" && typeof window.history.state?.idx === "number"
        ? window.history.state.idx
        : 0;

    if (historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(homePath, { replace: true });
  };

  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__hero">
        <span className="not-found-page__eyebrow">Error 404</span>
        <h1 className="dashboard-page__title" id="not-found-title">
          404
        </h1>
        <p className="dashboard-page__subtitle">
          La pagina solicitada no existe o ya no esta disponible.
        </p>
        <p className="not-found-page__copy">
          {user?.full_name
            ? `Hola, ${user.full_name}. Puedes regresar al inicio para continuar desde tu panel principal sin perder el flujo de navegacion.`
            : "Puedes regresar al inicio para continuar navegando dentro de Universidad Digital."}
        </p>
        <div className="not-found-page__actions">
          <button
            type="button"
            className="not-found-page__button"
            onClick={handleGoBack}
          >
            Volver a la pantalla anterior
          </button>
          <Link className="not-found-page__link" to={homePath}>
            Regresar al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
