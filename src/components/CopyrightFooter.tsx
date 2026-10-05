import type { MouseEventHandler } from "react";
import "./CopyrightFooter.css";

type CopyrightFooterProps = {
  className?: string;
  showSiteDescriptor?: boolean;
  tone?: "dark" | "light";
  onCopyrightClick?: MouseEventHandler<HTMLAnchorElement>;
};

const currentYear = new Date().getFullYear();

export default function CopyrightFooter({
  className = "",
  showSiteDescriptor = false,
  tone = "dark",
  onCopyrightClick,
}: CopyrightFooterProps) {
  const footerClassName = [
    "copyrightFooter",
    `copyrightFooter--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={footerClassName} aria-label="Maklumat hak cipta EduSim">
      <p className="copyrightFooter__line">
        <span>© {currentYear} EduSim by CikguStem. Hak Cipta Terpelihara.</span>
        <span className="copyrightFooter__separator" aria-hidden="true">
          ·
        </span>
        <span>Pemberitahuan Sukarela Hak Cipta MyIPO</span>
        <span className="copyrightFooter__separator" aria-hidden="true">
          ·
        </span>
        <a href="/copyright" onClick={onCopyrightClick}>
          Maklumat Hak Cipta
        </a>
      </p>

      {showSiteDescriptor ? (
        <p className="copyrightFooter__descriptor">
          STEM Educator <span aria-hidden="true">•</span> Innovation{" "}
          <span aria-hidden="true">•</span> Education Technology
        </p>
      ) : null}
    </footer>
  );
}
