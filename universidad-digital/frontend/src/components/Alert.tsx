type AlertProps = {
  message: string;
  variant?: "error" | "success";
};

export function Alert({ message, variant = "error" }: AlertProps) {
  return (
    <div className={`alert ${variant}`} role="alert" aria-live="polite">
      {message}
    </div>
  );
}
