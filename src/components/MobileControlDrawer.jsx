import { useEffect, useState } from "react";

const mobileQuery = "(max-width: 760px)";

export default function MobileControlDrawer({ title, summary, children, className = "" }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return !window.matchMedia(mobileQuery).matches;
  });

  useEffect(() => {
    const query = window.matchMedia(mobileQuery);
    const syncOpenState = () => setOpen(!query.matches);

    query.addEventListener("change", syncOpenState);
    return () => query.removeEventListener("change", syncOpenState);
  }, []);

  return (
    <section className={`mobileControlDrawer${open ? " mobileControlDrawer--open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="mobileControlDrawer__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="mobileControlDrawer__icon" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          <strong>{title}</strong>
          {summary && <small>{summary}</small>}
        </span>
      </button>
      <div className="mobileControlDrawer__body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
