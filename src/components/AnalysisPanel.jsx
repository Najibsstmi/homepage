export default function AnalysisPanel({
  firstSegmentLength,
  lastSegmentLength,
  initialVelocity,
  finalVelocity,
  acceleration,
  travelTime,
}) {
  const velocityChange = finalVelocity - initialVelocity;

  return (
    <aside className="linearPanel analysisPanel">
      <h2>Analisis Pita Detik</h2>
      <dl>
        <div>
          <dt>Frekuensi ticker timer</dt>
          <dd>50 Hz</dd>
        </div>
        <div>
          <dt>1 detik</dt>
          <dd>0.02 s</dd>
        </div>
        <div>
          <dt>10 detik</dt>
          <dd>0.2 s</dd>
        </div>
      </dl>

      <div className="formulaStack">
        <div className="formulaBlock">
          <p>Halaju awal, u</p>
          <div className="formulaLine">
            <span>u =</span>
            <span className="formulaFraction">
              <span>{firstSegmentLength.toFixed(2)} cm</span>
              <span>0.2 saat</span>
            </span>
            <span>= {initialVelocity.toFixed(1)} cm s⁻¹</span>
          </div>
        </div>

        <div className="formulaBlock">
          <p>Halaju akhir, v</p>
          <div className="formulaLine">
            <span>v =</span>
            <span className="formulaFraction">
              <span>{lastSegmentLength.toFixed(2)} cm</span>
              <span>0.2 saat</span>
            </span>
            <span>= {finalVelocity.toFixed(1)} cm s⁻¹</span>
          </div>
        </div>

        <div className="formulaBlock">
          <p>Pecutan, a</p>
          <div className="formulaLine">
            <span>a =</span>
            <span className="formulaFraction">
              <span>
                {finalVelocity.toFixed(1)} - {initialVelocity.toFixed(1)}
              </span>
              <span>{travelTime.toFixed(2)} saat</span>
            </span>
            <span>= {acceleration.toFixed(1)} cm s⁻²</span>
          </div>
          <small>Perubahan halaju = {velocityChange.toFixed(1)} cm s⁻¹</small>
        </div>
      </div>
    </aside>
  );
}
