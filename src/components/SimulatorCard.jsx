export default function SimulatorCard({ simulator }) {
  return (
    <article className="simulatorCard">
      <div className="simulatorCard__meta">
        <span>{simulator.level}</span>
        <span>{simulator.topic}</span>
      </div>

      <h3>{simulator.title}</h3>
      <p>{simulator.description}</p>

      <a className="simulatorCard__button" href={simulator.href}>
        Buka Simulator
      </a>
    </article>
  );
}
