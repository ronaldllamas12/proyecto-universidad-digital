import { render } from "@testing-library/react";

import {
    EnrollmentIcon,
    GradeIcon,
    PeriodIcon,
    StudentIcon,
    SubjectIcon,
    TeacherIcon,
    UsersIcon,
    WarningIcon,
} from "../../src/components/DashboardIcons";

describe("DashboardIcons", () => {
  it("renderiza todos los iconos SVG", () => {
    render(
      <div>
        <UsersIcon className="icon users" />
        <StudentIcon className="icon student" />
        <TeacherIcon className="icon teacher" />
        <SubjectIcon className="icon subject" />
        <PeriodIcon className="icon period" />
        <EnrollmentIcon className="icon enrollment" />
        <WarningIcon className="icon warning" />
        <GradeIcon className="icon grade" />
      </div>,
    );

    const icons = document.querySelectorAll("svg");
    expect(icons).toHaveLength(8);
    expect(Array.from(icons).every((icon) => icon.tagName.toLowerCase() === "svg")).toBe(true);
  });

  it("aplica className personalizada", () => {
    const { container } = render(<UsersIcon className="custom-icon" />);
    const svg = container.querySelector("svg");

    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("custom-icon");
  });
});
