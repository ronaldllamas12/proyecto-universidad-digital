import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { getHomePathForRoles } from "../auth/roleHomePath";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../layouts/AuthLayout";
import { sanitizeText } from "../utils/sanitize";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, error, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const homePath = getHomePathForRoles(user?.roles ?? []);
  const accessError =
    isAuthenticated && !homePath
      ? "Tu cuenta no tiene un rol habilitado para acceder al panel. Contacta al administrador."
      : null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginForm) => {
    const email = sanitizeText(values.email);
    const password = values.password;
    await login(email, password);
  };

  useEffect(() => {
    if (isAuthenticated && homePath) {
      navigate(homePath, { replace: true });
    }
  }, [homePath, isAuthenticated, navigate]);

  return (
    <AuthLayout>
      <div className="login-alert-slot">
        {error ? <Alert message={error} /> : null}
        {!error && accessError ? <Alert message={accessError} /> : null}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid">
        <Input
          label="Correo institucional"
          type="email"
          placeholder="usuario@universidad.edu"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Ingrese su Contraseña min 8 caracteres"
          {...register("password")}
          error={errors.password?.message}
        />
        <Button type="submit" disabled={isSubmitting}>
          Iniciar sesión
        </Button>
        <p>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
