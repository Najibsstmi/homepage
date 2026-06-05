type ChemicalFormulaProps = {
  value: string;
  className?: string;
};

export default function ChemicalFormula({ value, className = "" }: ChemicalFormulaProps) {
  if (!value || value === "-") {
    return <span className={className}>-</span>;
  }

  const parts = value.split(" + ");

  return (
    <span className={className}>
      {parts.map((part, partIndex) => (
        <span key={`${part}-${partIndex}`} className="atomFormulaPart">
          {partIndex > 0 && <span className="atomFormulaPlus"> + </span>}
          <FormulaPart value={part} />
        </span>
      ))}
    </span>
  );
}

function FormulaPart({ value }: { value: string }) {
  const tokens = Array.from(value.matchAll(/(\d*)([A-Z][a-z]?)(\d*)/g));

  if (!tokens.length) {
    return <>{value}</>;
  }

  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${token[0]}-${index}`}>
          {token[1] && <span className="atomFormulaCoeff">{token[1]}</span>}
          <span>{token[2]}</span>
          {token[3] && <sub>{token[3]}</sub>}
        </span>
      ))}
    </>
  );
}
