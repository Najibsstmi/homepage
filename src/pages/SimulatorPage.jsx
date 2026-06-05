import SimulatorCard from "../components/SimulatorCard";
import LinearMotionSimulator from "../components/LinearMotionSimulator";
import SimulatorReviewPanel from "../components/reviews/SimulatorReviewPanel";
import useRatingSummaries from "../components/reviews/useRatingSummaries";
import AlloyHardnessSimulatorPage from "./AlloyHardnessSimulatorPage";
import AtomMoleculeCompoundSimulatorPage from "./AtomMoleculeCompoundSimulatorPage";
import ElectrolysisSimulatorPage from "./ElectrolysisSimulatorPage";
import InertiaMassSimulatorPage from "./InertiaMassSimulatorPage";
import NuclearEnergySimulatorPage from "./NuclearEnergySimulatorPage";
import ReactionRateSimulatorPage from "./ReactionRateSimulatorPage";
import { simulators } from "../data/simulators";

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

  if (path === "/simulator/inersia") {
    return <InertiaMassSimulatorPage reviewPanel={getReviewPanel("inersia")} />;
  }

  if (path === "/simulator/tenaga-nuklear") {
    return (
      <NuclearEnergySimulatorPage reviewPanel={getReviewPanel("tenaga-nuklear")} />
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
