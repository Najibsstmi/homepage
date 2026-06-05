import SimulatorReviewPanel from "./reviews/SimulatorReviewPanel";

export default function SimulatorCard({
  simulator,
  ratingSummary,
  ratingStatus,
  onReviewSubmitted,
}) {
  return (
    <article className="simulatorCard">
      <div className="simulatorCard__meta">
        <span>{simulator.level}</span>
        <span>{simulator.topic}</span>
      </div>

      <h3>{simulator.title}</h3>
      <p>{simulator.description}</p>

      <SimulatorReviewPanel
        simulatorId={simulator.id}
        simulatorTitle={simulator.title}
        summary={ratingSummary}
        summaryStatus={ratingStatus}
        compact
        onReviewSubmitted={onReviewSubmitted}
      />

      <a className="simulatorCard__button" href={simulator.href}>
        Buka Simulator
      </a>
    </article>
  );
}
