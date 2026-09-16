// Shared by both entry pages. New /simulator/... routes need no analytics setup.
(() => {
  if (window.goatcounter?.no_onload) return;
  window.goatcounter = { ...window.goatcounter, no_onload: true };

  const pending = [];
  let previousPath;
  let previousUrl = document.referrer;

  function flush() {
    if (typeof window.goatcounter?.count !== "function") return;
    while (pending.length) window.goatcounter.count(pending.shift());
  }

  function track() {
    const url = new URL(window.location.href);
    let path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/simulator.html" || (path === "/" && url.searchParams.get("page") === "simulator")) {
      path = "/simulator";
    }
    // Preserve other app pages, but omit campaign parameters and fragment changes.
    if (path === "/" && url.searchParams.has("page")) {
      path += "?page=" + encodeURIComponent(url.searchParams.get("page"));
    }
    // Both routes open the same simulator.
    if (path === "/simulator/aloi") path = "/simulator/kenali-aloi";
    if (path === previousPath) return;
    const title = path.startsWith("/simulator/")
      ? "EduSim | " + decodeURIComponent(path.slice("/simulator/".length)).replace(/[-/]/g, " ")
      : path === "/simulator" ? "EduSim | Simulator Eksperimen Sains KSSM" : document.title;
    pending.push({ path, title, referrer: previousUrl });
    previousPath = path;
    previousUrl = url.href;
    flush();
  }

  for (const method of ["pushState", "replaceState"]) {
    const original = window.history[method];
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      track();
      return result;
    };
  }
  window.addEventListener("popstate", track);
  // Capture the async script load without polling, including a slow connection.
  document.addEventListener("load", (event) => {
    if (event.target?.matches?.("script[data-goatcounter]")) flush();
  }, true);
  track();
})();
