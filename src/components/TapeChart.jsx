export default function TapeChart({ segments }) {
  const maxLength = Math.max(...segments.map((segment) => segment.lengthCm), 1);

  return (
    <div className="tapeChart">
      <div className="linearChart__header">
        <h4>Graf Panjang Pita Detik melawan Bilangan Pita</h4>
        <span>cm</span>
      </div>

      {segments.length === 0 ? (
        <div className="tapeChart__empty">Graf akan terhasil selepas pita asal dipotong kepada 10 detik setiap pita.</div>
      ) : (
        <div className="tapeChart__body">
          <span className="tapeChart__yLabel">Panjang pita / cm</span>
          <div className="tapeChart__scroll">
            <div className="tapeChart__plot" role="img" aria-label="Graf panjang pita detik menggunakan potongan pita">
              {segments.map((segment) => (
                <div className="tapeChart__barGroup" key={segment.index}>
                  <div className="tapeChart__barWrap">
                    <div
                      className="tapeChart__tapeBar"
                      style={{ height: `${Math.max((segment.lengthCm / maxLength) * 100, 4)}%` }}
                    >
                      {segment.dots.map((dot) => (
                        <span key={`${segment.index}-${dot.tick}`} style={{ bottom: `${dot.position}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tapeChart__xLabels" aria-hidden="true">
              {segments.map((segment) => (
                <div className="tapeChart__labelGroup" key={`label-${segment.index}`}>
                  <strong>{segment.index}</strong>
                  <small>{segment.lengthCm.toFixed(1)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="tapeChart__axis">
        <span />
        <span>Paksi-x: Bilangan pita</span>
      </div>
    </div>
  );
}
