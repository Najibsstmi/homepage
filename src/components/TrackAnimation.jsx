export default function TrackAnimation({
  heightCm,
  systemMass,
  cartCount,
  extraLoad,
  travelTime,
  acceleration,
  currentVelocityCms,
  progress,
  running,
  paused,
  completed,
  statusMessage,
}) {
  const floorY = 270;
  const startX = 105;
  const endX = 850;
  const railBaseY = floorY - 42;
  const supportHeight = 42 + (heightCm / 60) * 135;
  const startY = floorY - supportHeight;
  const endY = railBaseY;
  const angle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;
  const cartStackHeight = 34;
  const loadBlocks = Math.min(Math.ceil(extraLoad), 4);
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  const cartX = startX + (endX - 76 - startX) * safeProgress;
  const cartY = startY + (endY - 12 - startY) * safeProgress;
  const gravityLength = 28 + (heightCm / 60) * 48;
  const trailEndX = startX + (cartX - startX) * 0.86;
  const trailEndY = startY + (cartY - startY) * 0.86;

  return (
    <section className="linearStage" aria-label="Animasi troli menuruni landasan condong">
      <div className="linearStage__metrics">
        <div>
          <span>Panjang landasan</span>
          <strong>2.0 m</strong>
        </div>
        <div>
          <span>Masa diambil</span>
          <strong>{travelTime ? `${travelTime.toFixed(2)} s` : "Belum bergerak"}</strong>
        </div>
        <div>
          <span>Pecutan anggaran</span>
          <strong>{acceleration.toFixed(1)} cm s⁻²</strong>
        </div>
        <div>
          <span>Jisim sistem</span>
          <strong>{systemMass.toFixed(1)} kg</strong>
        </div>
        <div>
          <span>Bilangan troli</span>
          <strong>{cartCount}</strong>
        </div>
        <div>
          <span>Halaju semasa</span>
          <strong>{(currentVelocityCms / 100).toFixed(2)} m/s</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{statusMessage || (completed ? "Troli telah sampai ke dinding lembut." : running ? "Troli sedang bergerak." : "Sedia untuk dilepaskan.")}</strong>
        </div>
      </div>

      <div className="linearTrackWrap">
        <svg className="linearTrackSvg" viewBox="0 0 960 330" role="img" aria-label="Troli bergerak menuruni landasan condong">
          <defs>
            <linearGradient id="trackMetal" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="cartBlue" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          <rect className="trackSky" x="0" y="0" width="960" height="330" rx="24" />
          <line className="trackFloor" x1="50" y1={floorY} x2="910" y2={floorY} />
          <text className="trackFloorLabel" x="58" y={floorY + 28}>Lantai tetap</text>

          <line className="trackSupport" x1={startX} y1={floorY} x2={startX} y2={startY + 12} />
          <line className="trackSupport" x1={endX} y1={floorY} x2={endX} y2={endY + 12} />
          <text className="trackHeightLabel" x={startX - 68} y={startY - 12}>{heightCm} cm</text>

          <line className="trackRailShadow" x1={startX} y1={startY} x2={endX} y2={endY} />
          <line className="trackRail" x1={startX} y1={startY} x2={endX} y2={endY} />

          {heightCm > 0 && (
            <g className="gravityArrow" transform={`translate(${startX + 120} ${startY - 42})`}>
              <line x1="0" y1="0" x2="0" y2={gravityLength} />
              <path d={`M -8 ${gravityLength - 10} L 0 ${gravityLength} L 8 ${gravityLength - 10}`} />
              <text x="14" y={gravityLength / 2}>Daya graviti</text>
            </g>
          )}

          {safeProgress > 0 && (
            <line className="motionTrail" x1={startX} y1={startY - 12} x2={trailEndX} y2={trailEndY - 12} />
          )}

          <g className="softWall" transform={`translate(${endX + 18} ${endY - 86})`}>
            <rect className="softWall__pad" x="0" y="0" width="36" height="106" rx="12" />
            <rect className="softWall__base" x="-8" y="100" width="52" height="10" rx="5" />
            <text x="-12" y="45">Dinding</text>
            <text x="-12" y="65">lembut</text>
          </g>

          <g
            className="svgCartRig"
            style={{ transform: `translate(${cartX}px, ${cartY}px)` }}
          >
            <g transform={`rotate(${angle}) translate(-44 -52)`}>
              {Array.from({ length: cartCount }, (_, index) => (
                <g key={`cart-${index}`} transform={`translate(0 ${-index * cartStackHeight})`}>
                  <rect className="svgCartBody" x="0" y="0" width="86" height="46" rx="12" />
                  <rect className="svgCartPanel" x="18" y="10" width="50" height="18" rx="7" />
                  <circle className="svgCartWheel" cx="22" cy="50" r="10" />
                  <circle className="svgCartWheel" cx="64" cy="50" r="10" />
                </g>
              ))}

              {loadBlocks > 0 && (
                <g className="svgLoad" transform={`translate(14 ${-cartCount * cartStackHeight - 5})`}>
                  {Array.from({ length: loadBlocks }, (_, index) => (
                    <rect key={`load-${index}`} x={index * 15} y="0" width="12" height="22" rx="4" />
                  ))}
                </g>
              )}
            </g>
          </g>
        </svg>
      </div>
    </section>
  );
}
