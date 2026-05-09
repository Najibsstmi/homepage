export default function TickerTape({ tickerDots, segments, started, isCut, onCut, active }) {
  const lastDistance = tickerDots[tickerDots.length - 1]?.distance || 0;
  const continuousWidth = Math.min(Math.max(lastDistance * 4, 420), 1600);

  return (
    <div className={`tickerTape ${active ? "tickerTape--active" : ""}`}>
      <div className="tickerTape__header">
        <div>
          <div className="tickerTape__label">Pita detik 50 Hz</div>
          <p>{isCut ? "Pita telah dipotong setiap 10 detik." : "Pita asal direkodkan sebagai satu pita panjang."}</p>
        </div>
        <button type="button" onClick={onCut} disabled={!started || segments.length === 0 || isCut}>
          Potong pita
        </button>
      </div>

      {!started || tickerDots.length === 0 ? (
        <div className="tickerTape__empty">Pita detik akan direkodkan selepas butang Mula ditekan.</div>
      ) : !isCut ? (
        <div className="tickerTape__continuousWrap">
          <div className="tickerTape__continuous" style={{ width: `${continuousWidth}px` }}>
            {tickerDots.map((dot) => (
              <span
                key={dot.tick}
                style={{ left: `${lastDistance > 0 ? (dot.distance / lastDistance) * 100 : 0}%` }}
              />
            ))}
          </div>
          <small>Panjang pita semasa: {lastDistance.toFixed(1)} cm</small>
        </div>
      ) : (
        <div className="tickerTape__segments">
          {segments.map((segment) => (
            <div className="tickerSegment" key={segment.index}>
              <div className="tickerSegment__strip" style={{ width: `${segment.displayWidth}px` }}>
                {segment.dots.map((dot) => (
                  <span key={`${segment.index}-${dot.tick}`} style={{ left: `${dot.position}%` }} />
                ))}
              </div>
              <strong>Pita {segment.index}</strong>
              <small>{segment.lengthCm.toFixed(1)} cm</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
