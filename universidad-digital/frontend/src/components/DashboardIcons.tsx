import type { PropsWithChildren } from "react";

type IconProps = {
  className?: string;
};

function SvgBase({ className, children }: PropsWithChildren<IconProps>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="M23 20v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13A3 3 0 0 1 16 11" />
    </SvgBase>
  );
}

export function StudentIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M2 8l10-5 10 5-10 5-10-5z" />
      <path d="M6 10.5V15c0 2 3 4 6 4s6-2 6-4v-4.5" />
    </SvgBase>
  );
}

export function TeacherIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
    </SvgBase>
  );
}

export function SubjectIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M4 5h8a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5z" />
      <path d="M20 5h-8a3 3 0 0 0-3 3v11h8a3 3 0 0 1 3 3V5z" />
    </SvgBase>
  );
}

export function PeriodIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </SvgBase>
  );
}

export function EnrollmentIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M15 17l2 2 4-4" />
    </SvgBase>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" />
    </SvgBase>
  );
}

export function GradeIcon({ className }: IconProps) {
  return (
    <SvgBase className={className}>
      <path d="M7 4h10l-1 10H8L7 4z" />
      <path d="M9 18h6" />
      <path d="M10 8l1.5 2L14 7" />
    </SvgBase>
  );
}
