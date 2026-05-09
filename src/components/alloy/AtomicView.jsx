export default function AtomicView({ selectedMaterial, show, onToggle }) {
  const atoms = Array.from({ length: 24 }, (_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    const varied = selectedMaterial === "alloy" && (index % 4 === 0 || index % 7 === 0);
    return {
      x: 56 + col * 54 + (row % 2) * 14,
      y: 56 + row * 46,
      r: varied ? 20 : 16,
      varied,
    };
  });

  return (
    <section className="electroPanel alloyAtomicPanel">
      <div className="alloyPanelHeader">
        <h2>Atomic View</h2>
        <button type="button" onClick={onToggle}>{show ? "Sembunyikan" : "Lihat susunan atom"}</button>
      </div>

      {show ? (
        <div className="alloyAtomicContent">
          <svg viewBox="0 0 390 250" role="img" aria-label="Susunan atom logam tulen dan aloi">
            <rect className="alloyAtomicBg" x="0" y="0" width="390" height="250" rx="20" />
            {atoms.map((atom, index) => (
              <circle
                key={index}
                className={atom.varied ? "atom atom--mixed" : "atom"}
                cx={atom.x}
                cy={atom.y}
                r={atom.r}
              />
            ))}
            <path className="atomLayerArrow" d="M 58 210 C 126 190, 210 224, 304 196" />
          </svg>
          <p>
            {selectedMaterial === "alloy"
              ? "Aloi mempunyai atom berlainan saiz. Susunan ini menyukarkan lapisan atom menggelongsor, maka aloi lebih keras."
              : "Logam tulen mempunyai atom sama saiz yang tersusun teratur. Lapisan atom lebih mudah menggelongsor, maka lekukan lebih dalam."}
          </p>
        </div>
      ) : (
        <p className="alloyMuted">Tekan butang untuk melihat susunan atom dan kaitannya dengan kekerasan bahan.</p>
      )}
    </section>
  );
}
