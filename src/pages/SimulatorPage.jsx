import SimulatorCard from "../components/SimulatorCard";
import LinearMotionSimulator from "../components/LinearMotionSimulator";
import ElectrolysisSimulatorPage from "./ElectrolysisSimulatorPage";
import { simulators } from "../data/simulators";

export default function SimulatorPage() {
  const path = typeof window === "undefined" ? "/simulator" : window.location.pathname;

  if (path === "/simulator/gerakan-linear") {
    return <LinearMotionSimulator />;
  }

  if (path === "/simulator/elektrokimia-elektrolisis") {
    return <ElectrolysisSimulatorPage />;
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
          <SimulatorCard key={simulator.id} simulator={simulator} />
        ))}
      </section>
    </main>
  );
}
