import { useEffect, useRef, useState } from "react";
import SimulatorCard from "../components/SimulatorCard";
import LinearMotionSimulator from "../components/LinearMotionSimulator";
import SimulatorReviewPanel from "../components/reviews/SimulatorReviewPanel";
import useRatingSummaries from "../components/reviews/useRatingSummaries";
import AlloyHardnessSimulatorPage from "./AlloyHardnessSimulatorPage";
import AlloyDiscoverySimulatorPage from "./AlloyDiscoverySimulatorPage";
import AtomMoleculeCompoundSimulatorPage from "./AtomMoleculeCompoundSimulatorPage";
import ChemicalCellSimulatorPage from "./ChemicalCellSimulatorPage";
import ElectrolysisSimulatorPage from "./ElectrolysisSimulatorPage";
import EndocrineSystemSimulatorPage from "./EndocrineSystemSimulatorPage";
import InertiaMassSimulatorPage from "./InertiaMassSimulatorPage";
import MudPressureRescueSimulatorPage from "./MudPressureRescueSimulatorPage";
import NitrogenCycleSimulatorPage from "./NitrogenCycleSimulatorPage";
import NuclearEnergySimulatorPage from "./NuclearEnergySimulatorPage";
import OpticsLensSimulatorPage from "./OpticsLensSimulatorPage";
import PollutionDetectiveSimulatorPage from "./PollutionDetectiveSimulatorPage";
import ReactionRateSimulatorPage from "./ReactionRateSimulatorPage";
import PascalHydraulicSimulator from "../components/PascalHydraulicSimulator";
import { SimulatorSearch } from "../components/SimulatorSearch";
import { SIMULATORS } from "../data/simulators";

const SIMULATORS_PER_PAGE = 6;

function StaticHtmlSimulatorFrame({ src, title }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }

    const resizeFrame = () => {
      try {
        const doc = frame.contentDocument;
        const body = doc?.body;
        const html = doc?.documentElement;

        if (!body || !html) {
          return;
        }

        const contentHeight = Math.max(body.scrollHeight, html.scrollHeight);
        const viewportHeight = Math.max(window.innerHeight - 86, 720);
        frame.style.height = `${Math.max(contentHeight, viewportHeight)}px`;
      } catch {
        frame.style.height = "1100px";
      }
    };

    frame.addEventListener("load", resizeFrame);
    const resizeTimer = window.setInterval(resizeFrame, 700);
    resizeFrame();

    return () => {
      frame.removeEventListener("load", resizeFrame);
      window.clearInterval(resizeTimer);
    };
  }, [src]);

  return (
    <main className="staticHtmlSimulatorPage">
      <iframe
        ref={frameRef}
        className="staticHtmlSimulatorFrame"
        src={src}
        title={title}
      />
    </main>
  );
}

export default function SimulatorPage({ onOpenSimulator }) {
  const path = typeof window === "undefined" ? "/simulator" : window.location.pathname;
  const { refresh, status: ratingStatus, summaries } = useRatingSummaries();
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef(null);
  const hasChangedPage = useRef(false);
  const totalPages = Math.ceil(SIMULATORS.length / SIMULATORS_PER_PAGE);
  const pageStart = (currentPage - 1) * SIMULATORS_PER_PAGE;
  const visibleSimulators = SIMULATORS.slice(
    pageStart,
    pageStart + SIMULATORS_PER_PAGE,
  );

  useEffect(() => {
    if (!hasChangedPage.current) {
      return;
    }

    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    hasChangedPage.current = true;
    setCurrentPage(nextPage);
  };

  const getSimulator = (id) => SIMULATORS.find((simulator) => simulator.id === id);
  const getReviewPanel = (simulatorId) => {
    const simulator = getSimulator(simulatorId);

    return (
      <div className="simulatorDetailReviewSlot">
        <SimulatorReviewPanel
          simulatorId={simulatorId}
          simulatorTitle={simulator?.title}
          summary={summaries[simulatorId]}
          summaryStatus={ratingStatus}
          compact
          onReviewSubmitted={refresh}
        />
      </div>
    );
  };

  if (path === "/simulator/gerakan-linear") {
    return <LinearMotionSimulator reviewPanel={getReviewPanel("gerakan-linear")} />;
  }

  if (path === "/simulator/elektrokimia-elektrolisis") {
    return (
      <ElectrolysisSimulatorPage
        reviewPanel={getReviewPanel("elektrokimia-elektrolisis")}
      />
    );
  }

  if (path === "/simulator/sel-kimia") {
    return <ChemicalCellSimulatorPage reviewPanel={getReviewPanel("sel-kimia")} />;
  }

  if (path === "/simulator/atom-molekul-sebatian") {
    return (
      <AtomMoleculeCompoundSimulatorPage
        reviewPanel={getReviewPanel("atom-molekul-sebatian")}
      />
    );
  }

  if (path === "/simulator/aloi" || path === "/simulator/kenali-aloi") {
    return (
      <AlloyDiscoverySimulatorPage reviewPanel={getReviewPanel("kenali-aloi")} />
    );
  }

  if (path === "/simulator/alloy-hardness") {
    return <AlloyHardnessSimulatorPage reviewPanel={getReviewPanel("aloi")} />;
  }

  if (path === "/simulator/kadar-tindak-balas") {
    return (
      <ReactionRateSimulatorPage
        reviewPanel={getReviewPanel("kadar-tindak-balas")}
      />
    );
  }

  if (path === "/simulator/detektif-pencemaran-alam") {
    return (
      <PollutionDetectiveSimulatorPage
        reviewPanel={getReviewPanel("detektif-pencemaran-alam")}
      />
    );
  }

  if (path === "/simulator/kitar-nitrogen") {
    return (
      <NitrogenCycleSimulatorPage
        reviewPanel={getReviewPanel("kitar-nitrogen")}
      />
    );
  }

  if (path === "/simulator/kesan-suhu-aktiviti-yis") {
    return (
      <StaticHtmlSimulatorFrame
        src="/kesan-suhu-aktiviti-yis.html"
        title="Kesan Suhu Terhadap Aktiviti Yis"
      />
    );
  }

  if (path === "/simulator/misi-ambulans-lumpur") {
    return (
      <MudPressureRescueSimulatorPage
        reviewPanel={getReviewPanel("misi-ambulans-lumpur")}
      />
    );
  }

  if (path === "/simulator/sistem-hidraulik-pascal") {
    return (
      <PascalHydraulicSimulator
        reviewPanel={getReviewPanel("sistem-hidraulik-pascal")}
      />
    );
  }

  if (path === "/simulator/inersia") {
    return <InertiaMassSimulatorPage reviewPanel={getReviewPanel("inersia")} />;
  }

  if (path === "/simulator/tenaga-nuklear") {
    return (
      <NuclearEnergySimulatorPage reviewPanel={getReviewPanel("tenaga-nuklear")} />
    );
  }

  if (path === "/simulator/sistem-endokrin") {
    return (
      <EndocrineSystemSimulatorPage
        reviewPanel={getReviewPanel("sistem-endokrin")}
      />
    );
  }

  if (path === "/simulator/cahaya-optik-kanta") {
    return (
      <OpticsLensSimulatorPage
        reviewPanel={getReviewPanel("cahaya-optik-kanta")}
      />
    );
  }

  return (
    <main className="simulatorPage">
      <section className="simulatorHero">
        <span className="simulatorHero__kicker">Simulator Sains</span>
        <h1>Simulator Eksperimen Sains KSSM</h1>
        <p>
          Koleksi simulator eksperimen Sains Tingkatan 4 dan Tingkatan 5 untuk
          membantu murid meneroka konsep abstrak secara visual, interaktif dan
          lebih dekat dengan konteks pembelajaran KSSM.
        </p>
        <div className="simulatorHero__actions">
          <SimulatorSearch onOpenSimulator={onOpenSimulator} />
        </div>
      </section>

      <section
        ref={gridRef}
        className="simulatorGrid"
        aria-label={`Senarai simulator eksperimen, halaman ${currentPage} daripada ${totalPages}`}
      >
        {visibleSimulators.map((simulator) => (
          <SimulatorCard
            key={simulator.id}
            simulator={simulator}
            ratingSummary={summaries[simulator.id]}
            ratingStatus={ratingStatus}
            onReviewSubmitted={refresh}
          />
        ))}
      </section>

      <nav className="simulatorPagination" aria-label="Navigasi halaman simulator">
        <button
          type="button"
          className="simulatorPagination__button"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Sebelum
        </button>
        <p className="simulatorPagination__status" aria-live="polite">
          Halaman {currentPage} daripada {totalPages}
        </p>
        <button
          type="button"
          className="simulatorPagination__button"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Seterusnya
        </button>
      </nav>
    </main>
  );
}
