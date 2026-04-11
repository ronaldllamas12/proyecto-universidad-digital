import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { exchangeResetToken, forgotPassword, resetPassword } from "../api/auth";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { AuthLayout } from "../layouts/AuthLayout";
import { getErrorMessage } from "../utils/apiError";

const exchangedResetTokens = new Map<string, Promise<string>>();

function readResetTokenFromLocation() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get("token") ?? searchParams.get("token") ?? "";
}

const forgotSchema = z.object({
  email: z.string().email("Ingresa un correo institucional valido."),
});

const resetSchema = z.object({
  token: z.string().min(1, "El token del enlace es obligatorio."),
  new_password: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
});

type ForgotForm = z.infer<typeof forgotSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPasswordPage() {
  const [alert, setAlert] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [incomingToken] = useState(readResetTokenFromLocation);
  const forgotForm = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });
  const isResetFlow = Boolean(incomingToken);

  useEffect(() => {
    if (!incomingToken) {
      return;
    }

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("token");
    cleanUrl.hash = "";
    window.history.replaceState(
      null,
      document.title,
      `${cleanUrl.pathname}${cleanUrl.search}`,
    );
  }, [incomingToken]);

  useEffect(() => {
    let isMounted = true;

    if (!incomingToken) {
      return () => {
        isMounted = false;
      };
    }

    setIsExchangingToken(true);
    const exchangeRequest =
      exchangedResetTokens.get(incomingToken) ??
      exchangeResetToken({ token: incomingToken }).then(
        (response) => response.session_token,
      );

    exchangedResetTokens.set(incomingToken, exchangeRequest);

    exchangeRequest
      .then((sessionToken) => {
        if (!isMounted) {
          return;
        }
        resetForm.setValue("token", sessionToken, {
          shouldValidate: true,
        });
      })
      .catch((err) => {
        exchangedResetTokens.delete(incomingToken);
        if (!isMounted) {
          return;
        }
        setAlert({ message: getErrorMessage(err), variant: "error" });
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        setIsExchangingToken(false);
      });

    return () => {
      isMounted = false;
    };
  }, [incomingToken, resetForm]);

  const handleForgot = async (values: ForgotForm) => {
    try {
      const response = await forgotPassword(values);
      setAlert({ message: response.detail, variant: "success" });
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  const handleReset = async (values: ResetForm) => {
    try {
      const response = await resetPassword(values);
      setAlert({ message: response.detail, variant: "success" });
      resetForm.reset();
    } catch (err) {
      setAlert({ message: getErrorMessage(err), variant: "error" });
    }
  };

  return (
    <AuthLayout>
      {alert ? <Alert message={alert.message} variant={alert.variant} /> : null}

      {!isResetFlow ? (
        <div className="grid" style={{ marginBottom: "1rem" }}>
          <h3>Ingresa tu correo institucional</h3>
          <p>
            Te enviaremos el enlace de recuperación al correo personal asociado a
            tu cuenta.
          </p>
          <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="grid">
            <Input
              label="Correo institucional"
              type="email"
              placeholder="usuario@universidad.edu"
              {...forgotForm.register("email")}
              error={forgotForm.formState.errors.email?.message}
            />
            <Button type="submit" disabled={forgotForm.formState.isSubmitting}>
              Enviar enlace de recuperación
            </Button>
          </form>
        </div>
      ) : (
        <div className="grid" style={{ marginBottom: "1rem" }}>
          <h3>Restablecer contraseña</h3>
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="grid">
            <input type="hidden" {...resetForm.register("token")} />
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...resetForm.register("new_password")}
              error={resetForm.formState.errors.new_password?.message}
            />
            {resetForm.formState.errors.token?.message ? (
              <Alert
                message={resetForm.formState.errors.token.message}
                variant="error"
              />
            ) : null}
            <Button
              type="submit"
              disabled={resetForm.formState.isSubmitting || isExchangingToken}
            >
              {isExchangingToken
                ? "Validando enlace..."
                : "Restablecer contraseña"}
            </Button>
          </form>
        </div>
      )}

      <p>
        <Link to="/login">Volver a iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
