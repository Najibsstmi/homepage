import { useEffect, useRef } from "react";
import SimulatorCard from "../components/SimulatorCard";
import LinearMotionSimulator from "../components/LinearMotionSimulator";
import SimulatorReviewPanel from "../components/reviews/SimulatorReviewPanel";
import useRatingSummaries from "../components/reviews/useRatingSummaries";
import AlloyHardnessSimulatorPage from "./AlloyHardnessSimulatorPage";
import AtomMoleculeCompoundSimulatorPage from "./AtomMoleculeCompoundSimulatorPage";
import ChemicalCellSimulatorPage from "./ChemicalCellSimulatorPage";
import ElectrolysisSimulatorPage from "./ElectrolysisSimulatorPage";
import EndocrineSystemSimulatorPage from "./EndocrineSystemSimulatorPage";
import InertiaMassSimulatorPage from "./InertiaMassSimulatorPage";
import NuclearEnergySimulatorPage from "./NuclearEnergySimulatorPage";
import OpticsLensSimulatorPage from "./OpticsLensSimulatorPage";
import ReactionRateSimulatorPage from "./ReactionRateSimulatorPage";
import { simulators } from "../data/simulators";

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

export default function SimulatorPage() {
  const path = typeof window === "undefined" ? "/simulator" : window.location.pathname;
  const { refresh, status: ratingStatus, summaries } = useRatingSummaries();
  const getSimulator = (id) => simulators.find((simulator) => simulator.id === id);
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

  if (path === "/simulator/aloi" || path === "/simulator/alloy-hardness") {
    return <AlloyHardnessSimulatorPage reviewPanel={getReviewPanel("aloi")} />;
  }

  if (path === "/simulator/kadar-tindak-balas") {
    return (
      <ReactionRateSimulatorPage
        reviewPanel={getReviewPanel("kadar-tindak-balas")}
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
      </section>

      <section className="simulatorGrid" aria-label="Senarai simulator eksperimen">
        {simulators.map((simulator) => (
          <SimulatorCard
            key={simulator.id}
            simulator={simulator}
            ratingSummary={summaries[simulator.id]}
            ratingStatus={ratingStatus}
            onReviewSubmitted={refresh}
          />
        ))}
      </section>
    </main>
  );
}
