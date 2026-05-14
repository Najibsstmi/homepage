import { useRef, useState } from "react";
import { clampTemperature, temperatureMax, temperatureMin } from "../../data/reactionRateData";

export default function TemperatureThermometerControl({ temperature, running, onChange }) {
  const railRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const selectedTemperature = clampTemperature(temperature);
  const ratio = (selectedTemperature - temperatureMin) / (temperatureMax - temperatureMin);
  const handleLeft = `${ratio * 100}%`;

  const updateFromPointer = (event) => {
    const rail = railRef.current;

    if (!rail || running) {
      return;
    }

    const rect = rail.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
    const nextTemperature = clampTemperature(temperatureMin + (x / rect.width) * (temperatureMax - temperatureMin));
    onChange(nextTemperature);
  };

  const handlePointerDown = (event) => {
    if (running) {
      return;
    }

    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    if (!dragging) {
      return;
    }

    updateFromPointer(event);
  };

  const handlePointerEnd = (event) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event) => {
    if (running) {
      return;
    }

    if (!["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      onChange(temperatureMin);
      return;
    }

    if (event.key === "End") {
      onChange(temperatureMax);
      return;
    }

    const delta = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1 : -1;
    onChange(clampTemperature(selectedTemperature + delta));
  };

  return (
    <div className="reactionThermometerControl" aria-label="Kawalan suhu melintang">
      <div className="reactionThermometerTrackWrap">
        <img
          className="reactionThermometerImage"
          src="/assets/thermometer-user-horizontal.png"
          alt=""
          draggable="false"
        />
        <div
          ref={railRef}
          className={running ? "reactionThermometerRail reactionThermometerRail--locked" : "reactionThermometerRail"}
          role="slider"
          tabIndex={running ? -1 : 0}
          aria-label="Suhu eksperimen"
          aria-valuemin={temperatureMin}
          aria-valuemax={temperatureMax}
          aria-valuenow={selectedTemperature}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeyDown}
        >
          {[30, 35, 40, 45, 50, 55, 60].map((value) => (
            <span
              key={value}
              className="reactionThermometerTick"
              style={{ left: `${((value - temperatureMin) / (temperatureMax - temperatureMin)) * 100}%` }}
            >
              {value}°C
            </span>
          ))}
          <div
            className={dragging ? "reactionThermometerHandle reactionThermometerHandle--dragging" : "reactionThermometerHandle"}
            style={{ left: handleLeft }}
          >
            <strong className="reactionThermometerReadout">{selectedTemperature}°C</strong>
            <span className="reactionThermometerPointer" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
