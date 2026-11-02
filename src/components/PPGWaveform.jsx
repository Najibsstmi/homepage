import { useEffect, useRef } from "react";

export default function PPGWaveform({ samples, running }) {
  const canvasRef = useRef(null);
  const samplesRef = useRef(samples);
  samplesRef.current = samples;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let animationId;
    const draw = () => {
      const context = canvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;
      const bounds = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(bounds.width * ratio) || canvas.height !== Math.round(bounds.height * ratio)) {
        canvas.width = Math.round(bounds.width * ratio);
        canvas.height = Math.round(bounds.height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const width = bounds.width;
      const height = bounds.height;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(220, 38, 38, 0.1)";
      context.lineWidth = 1;
      for (let x = 0; x <= width; x += width / 10) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
      }
      for (let y = 0; y <= height; y += height / 4) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
      }

      const all = samplesRef.current || [];
      if (all.length > 1) {
        const latest = all.at(-1).time;
        const visible = all.filter((sample) => sample.time >= latest - 10000);
        const values = visible.map((sample) => sample.value);
        const max = Math.max(0.5, ...values.map(Math.abs));
        context.beginPath();
        context.strokeStyle = "#dc2626";
        context.shadowColor = "rgba(220, 38, 38, 0.35)";
        context.shadowBlur = 8;
        context.lineWidth = 2;
        visible.forEach((sample, index) => {
          const x = width - ((latest - sample.time) / 10000) * width;
          const y = height / 2 - (sample.value / max) * height * 0.38;
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.stroke();
        context.shadowBlur = 0;
      } else {
        context.fillStyle = "rgba(35, 35, 35, 0.62)";
        context.font = "500 15px system-ui";
        context.textAlign = "center";
        context.fillText("Gelombang sebenar akan dipaparkan selepas isyarat dikesan", width / 2, height / 2);
      }
      context.fillStyle = "rgba(35, 35, 35, 0.65)";
      context.font = "500 13px system-ui";
      context.textAlign = "left";
      context.fillText("−10 s", 8, height - 8);
      context.textAlign = "right";
      context.fillText("sekarang", width - 8, height - 8);
      if (running) animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [running]);

  return <canvas ref={canvasRef} className="pulseWaveform" aria-label="Gelombang PPG masa nyata" />;
}
