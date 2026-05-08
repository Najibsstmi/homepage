export default function IonAnimation({ active, cation = "Pb²⁺", anion = "Br⁻" }) {
  return (
    <g className={`ionLayer${active ? " ionLayer--active" : ""}`}>
      {[0, 1, 2, 3].map((index) => (
        <text key={`cation-${index}`} className={`ion ion--cation ion--path${index + 1}`} x={332 + index * 38} y={322 - index * 15}>
          {cation}
        </text>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <text key={`anion-${index}`} className={`ion ion--anion ion--path${index + 1}`} x={520 - index * 38} y={306 + index * 15}>
          {anion}
        </text>
      ))}
      {active && (
        <>
          <path className="ionPath ionPath--cation" d="M 372 306 C 430 268 520 218 592 172" />
          <path className="ionPath ionPath--anion" d="M 500 306 C 440 272 362 220 312 172" />
          <text className="ionLabel" x="582" y="254">Kation bergerak ke katod</text>
          <text className="ionLabel" x="268" y="254">Anion bergerak ke anod</text>
        </>
      )}
    </g>
  );
}
