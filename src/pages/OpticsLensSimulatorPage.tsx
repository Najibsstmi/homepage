import { useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

type LensType = "convex" | "concave";
type DisplayOptionKey = keyof DisplayOptions;
type ObjectStopId = (typeof objectStops)[number]["id"];
type ObjectStop = (typeof objectStops)[number];

type DisplayOptions = {
  rays: boolean;
  virtualRays: boolean;
  foci: boolean;
  image: boolean;
  values: boolean;
};

type Point = {
  x: number;
  y: number;
};

type OpticsData = {
  objectTip: Point;
  imageTip: Point | null;
  imageX: number | null;
  imageHeight: number;
  realImage: boolean;
  clearImage: boolean;
  redPaths: string[];
  orangePaths: string[];
  virtualPaths: string[];
  objectDistance: number;
  imageDistance: number | null;
  imageType: string;
  orientation: string;
  size: string;
  imagePosition: string;
  note: string;
};

type OpticalTool = {
  icon: string;
  name: string;
  context: string;
};

type CssVarStyle = CSSProperties & Record<`--${string}`, string | number>;

const diagram = {
  width: 1200,
  height: 520,
  axisY: 260,
  lensX: 600,
  focalLength: 160,
  objectHeight: 100,
  minY: 38,
  maxY: 482,
  maxX: 1150,
};

const objectStops = [
  { id: "outside-2f", label: "Luar 2F", x: 160 },
  { id: "at-2f", label: "Di 2F", x: 280 },
  { id: "between-f-2f", label: "Antara F dan 2F", x: 360 },
  { id: "at-f", label: "Di F", x: 440 },
  { id: "between-f-lens", label: "Antara F dan kanta", x: 520 },
] as const;

const defaultObjectStop = objectStops[2];

const lensOptions: Array<{
  id: LensType;
  label: string;
  shortLabel: string;
}> = [
  { id: "convex", label: "Kanta Cembung", shortLabel: "Cembung" },
  { id: "concave", label: "Kanta Cekung", shortLabel: "Cekung" },
];

const displayOptionLabels: Array<{ key: DisplayOptionKey; label: string }> = [
  { key: "rays", label: "Tunjuk garisan sinar" },
  {
    key: "virtualRays",
    label: "Tunjuk garisan putus-putus (sinar maya)",
  },
  { key: "foci", label: "Tunjuk titik fokus (F) dan 2F" },
  { key: "image", label: "Tunjuk imej" },
  { key: "values", label: "Tunjuk nilai jarak" },
];

const defaultDisplayOptions: DisplayOptions = {
  rays: true,
  virtualRays: true,
  foci: true,
  image: true,
  values: false,
};

const convexOpticalTools: Record<ObjectStopId, OpticalTool[]> = {
  "outside-2f": [
    {
      icon: "📷",
      name: "Kamera",
      context: "Imej nyata, songsang dan dikecilkan.",
    },
  ],
  "at-2f": [
    {
      icon: "📄",
      name: "Mesin Fotostat",
      context: "Imej sama saiz apabila objek berada di 2F.",
    },
  ],
  "between-f-2f": [
    {
      icon: "📽️",
      name: "Projektor LCD",
      context: "Imej nyata, songsang dan diperbesarkan.",
    },
  ],
  "at-f": [
    {
      icon: "🔦",
      name: "Lampu Suluh",
      context: "Sinar keluar selari selepas melalui kanta.",
    },
  ],
  "between-f-lens": [
    {
      icon: "🔍",
      name: "Kanta Pembesar",
      context: "Imej maya, tegak dan diperbesarkan.",
    },
  ],
};

const concaveOpticalTools: OpticalTool[] = [
  {
    icon: "👓",
    name: "Cermin Mata Rabun Jauh",
    context: "Kanta cekung membentuk imej maya, tegak dan dikecilkan.",
  },
  {
    icon: "🚪",
    name: "Lubang Intai Pintu",
    context: "Medan penglihatan luas dengan imej maya yang kecil.",
  },
];

function getOpticalTools(lensType: LensType, stopId: ObjectStopId) {
  return lensType === "convex" ? convexOpticalTools[stopId] : concaveOpticalTools;
}

function round(value: number) {
  return Number(value.toFixed(1));
}

function formatPoint(point: Point) {
  return `${round(point.x)} ${round(point.y)}`;
}

function pathFromPoints(points: Point[]) {
  const first = points[0];

  if (!first) {
    return "";
  }

  return points
    .slice(1)
    .reduce((path, point) => `${path} L ${formatPoint(point)}`, `M ${formatPoint(first)}`);
}

function rightwardEnd(from: Point, through: Point) {
  const dx = through.x - from.x;

  if (dx === 0) {
    return {
      x: from.x,
      y: through.y > from.y ? diagram.maxY : diagram.minY,
    };
  }

  const slope = (through.y - from.y) / dx;
  const yAtMaxX = from.y + slope * (diagram.maxX - from.x);

  if (yAtMaxX >= diagram.minY && yAtMaxX <= diagram.maxY) {
    return { x: diagram.maxX, y: yAtMaxX };
  }

  if (slope > 0) {
    return {
      x: from.x + (diagram.maxY - from.y) / slope,
      y: diagram.maxY,
    };
  }

  if (slope < 0) {
    return {
      x: from.x + (diagram.minY - from.y) / slope,
      y: diagram.minY,
    };
  }

  return { x: diagram.maxX, y: from.y };
}

function getConvexLabels(stop: ObjectStop, imageDistance: number | null) {
  if (stop.id === "outside-2f") {
    return {
      imageType: "Nyata",
      orientation: "Songsang",
      size: "Dikecilkan",
      imagePosition: "Antara F dan 2F di sebelah kanan kanta",
      note: "",
    };
  }

  if (stop.id === "at-2f") {
    return {
      imageType: "Nyata",
      orientation: "Songsang",
      size: "Sama saiz",
      imagePosition: "Di 2F sebelah kanan kanta",
      note: "",
    };
  }

  if (stop.id === "between-f-2f") {
    return {
      imageType: "Nyata",
      orientation: "Songsang",
      size: "Diperbesarkan",
      imagePosition: "Luar 2F di sebelah kanan kanta",
      note: "",
    };
  }

  if (stop.id === "at-f") {
    return {
      imageType: "Tiada imej jelas",
      orientation: "Sinar biasan selari",
      size: "-",
      imagePosition: "Di infiniti",
      note: "Imej tidak terbentuk dengan jelas kerana sinar biasan adalah selari.",
    };
  }

  return {
    imageType: "Maya",
    orientation: "Tegak",
    size: "Diperbesarkan",
    imagePosition:
      imageDistance && imageDistance < 0
        ? "Sebelah kiri kanta"
        : "Sebelah kiri kanta",
    note: "",
  };
}

function getOpticsData(lensType: LensType, stop: ObjectStop): OpticsData {
  const axisY = diagram.axisY;
  const lensX = diagram.lensX;
  const focus = diagram.focalLength;
  const objectTip = {
    x: stop.x,
    y: axisY - diagram.objectHeight,
  };
  const opticalCenter = { x: lensX, y: axisY };
  const lensTop = { x: lensX, y: objectTip.y };
  const leftFocus = { x: lensX - focus, y: axisY };
  const rightFocus = { x: lensX + focus, y: axisY };
  const objectDistance = lensX - stop.x;
  const redPaths: string[] = [];
  const orangePaths: string[] = [];
  const virtualPaths: string[] = [];

  if (lensType === "convex" && stop.id === "at-f") {
    const redEnd = rightwardEnd(lensTop, rightFocus);
    const orangeEnd = rightwardEnd(objectTip, opticalCenter);

    redPaths.push(pathFromPoints([objectTip, lensTop, redEnd]));
    orangePaths.push(pathFromPoints([objectTip, opticalCenter, orangeEnd]));

    const labels = getConvexLabels(stop, null);

    return {
      objectTip,
      imageTip: null,
      imageX: null,
      imageHeight: 0,
      realImage: false,
      clearImage: false,
      redPaths,
      orangePaths,
      virtualPaths,
      objectDistance,
      imageDistance: null,
      ...labels,
    };
  }

  const focalLength = lensType === "convex" ? focus : -focus;
  const imageDistance = 1 / (1 / focalLength - 1 / objectDistance);
  const magnification = -imageDistance / objectDistance;
  const imageHeight = diagram.objectHeight * magnification;
  const imageX = lensX + imageDistance;
  const imageTip = {
    x: imageX,
    y: axisY - imageHeight,
  };

  if (lensType === "convex") {
    const labels = getConvexLabels(stop, imageDistance);

    if (imageDistance > 0) {
      redPaths.push(pathFromPoints([objectTip, lensTop, imageTip]));
      orangePaths.push(pathFromPoints([objectTip, opticalCenter, imageTip]));
    } else {
      const redEnd = rightwardEnd(lensTop, rightFocus);
      const orangeEnd = rightwardEnd(objectTip, opticalCenter);

      redPaths.push(pathFromPoints([objectTip, lensTop, redEnd]));
      orangePaths.push(pathFromPoints([objectTip, opticalCenter, orangeEnd]));
      virtualPaths.push(pathFromPoints([lensTop, imageTip]));
      virtualPaths.push(pathFromPoints([opticalCenter, imageTip]));
    }

    return {
      objectTip,
      imageTip,
      imageX,
      imageHeight,
      realImage: imageDistance > 0,
      clearImage: true,
      redPaths,
      orangePaths,
      virtualPaths,
      objectDistance,
      imageDistance,
      ...labels,
    };
  }

  const redEnd = rightwardEnd(leftFocus, lensTop);
  const orangeEnd = rightwardEnd(objectTip, opticalCenter);

  redPaths.push(pathFromPoints([objectTip, lensTop, redEnd]));
  orangePaths.push(pathFromPoints([objectTip, opticalCenter, orangeEnd]));
  virtualPaths.push(pathFromPoints([lensTop, leftFocus]));
  virtualPaths.push(pathFromPoints([opticalCenter, imageTip]));

  return {
    objectTip,
    imageTip,
    imageX,
    imageHeight,
    realImage: false,
    clearImage: true,
    redPaths,
    orangePaths,
    virtualPaths,
    objectDistance,
    imageDistance,
    imageType: "Maya",
    orientation: "Tegak",
    size: "Dikecilkan",
    imagePosition: "Antara F dan O di sebelah kiri kanta",
    note: "",
  };
}

function formatDistance(value: number | null) {
  if (value === null) {
    return "infiniti";
  }

  return `${Math.abs(Math.round(value / 8))} cm`;
}

function LensSelector({
  lensType,
  onLensChange,
}: {
  lensType: LensType;
  onLensChange: (lensType: LensType) => void;
}) {
  return (
    <div className="opticsLensTabs" role="tablist" aria-label="Pilihan jenis kanta">
      {lensOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`opticsLensTab${
            lensType === option.id ? " opticsLensTab--active" : ""
          }`}
          role="tab"
          aria-selected={lensType === option.id}
          onClick={() => onLensChange(option.id)}
        >
          <span
            className={`opticsLensTab__icon opticsLensTab__icon--${option.id}`}
            aria-hidden="true"
          />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function LensShape({ lensType }: { lensType: LensType }) {
  if (lensType === "concave") {
    return (
      <g className="opticsLensShape opticsLensShape--concave" aria-hidden="true">
        <path d="M 568 62 C 606 148 606 372 568 458 L 632 458 C 594 372 594 148 632 62 Z" />
        <path className="opticsLensHighlight" d="M 585 84 C 610 158 610 362 585 436" />
        <line x1="600" y1="70" x2="600" y2="450" />
      </g>
    );
  }

  return (
    <g className="opticsLensShape opticsLensShape--convex" aria-hidden="true">
      <path d="M 600 52 C 638 138 638 382 600 468 C 562 382 562 138 600 52 Z" />
      <path className="opticsLensHighlight" d="M 588 84 C 615 166 615 354 588 436" />
      <line x1="600" y1="70" x2="600" y2="450" />
    </g>
  );
}

function ArrowFigure({
  x,
  axisY,
  height,
  label,
  tone,
  draggable = false,
}: {
  x: number;
  axisY: number;
  height: number;
  label: string;
  tone: "object" | "image";
  draggable?: boolean;
}) {
  const tipY = axisY - height;
  const labelY = height >= 0 ? tipY - 16 : tipY + 34;

  return (
    <g
      className={`opticsArrow opticsArrow--${tone}${
        draggable ? " opticsArrow--draggable" : ""
      }`}
    >
      <line x1={x} y1={axisY} x2={x} y2={tipY} />
      <text x={x} y={labelY}>
        {label}
      </text>
      <circle cx={x} cy={axisY} r="5.5" />
      {draggable && (
        <rect
          className="opticsObjectHitArea"
          x={x - 36}
          y={Math.min(axisY, tipY) - 44}
          width="72"
          height={Math.abs(height) + 88}
          rx="18"
        />
      )}
    </g>
  );
}

function RayDiagram({
  lensType,
  objectStop,
  opticsData,
  displayOptions,
  lightOn,
  playing,
  animationKey,
  animationSpeed,
  onObjectStopChange,
}: {
  lensType: LensType;
  objectStop: ObjectStop;
  opticsData: OpticsData;
  displayOptions: DisplayOptions;
  lightOn: boolean;
  playing: boolean;
  animationKey: number;
  animationSpeed: number;
  onObjectStopChange: (stopId: ObjectStopId) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const leftFocusX = diagram.lensX - diagram.focalLength;
  const rightFocusX = diagram.lensX + diagram.focalLength;
  const leftTwoFocusX = diagram.lensX - diagram.focalLength * 2;
  const rightTwoFocusX = diagram.lensX + diagram.focalLength * 2;
  const duration = Math.max(0.7, 3.4 / animationSpeed);
  const rayStyle = {
    "--ray-duration": `${duration.toFixed(2)}s`,
    animationPlayState: playing ? "running" : "paused",
  } as CssVarStyle;

  const setNearestStopFromPointer = (clientX: number) => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const viewX = ((clientX - rect.left) / rect.width) * diagram.width;
    const nearestStop = objectStops.reduce<ObjectStop>((nearest, stop) => {
      const currentDistance = Math.abs(stop.x - viewX);
      const nearestDistance = Math.abs(nearest.x - viewX);

      return currentDistance < nearestDistance ? stop : nearest;
    }, objectStops[0]);

    onObjectStopChange(nearestStop.id);
  };

  const handleObjectPointerDown = (event: ReactPointerEvent<SVGGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setNearestStopFromPointer(event.clientX);
  };

  const handleObjectPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    if (!dragging) {
      return;
    }

    setNearestStopFromPointer(event.clientX);
  };

  const stopDragging = (event: ReactPointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragging(false);
  };

  return (
    <svg
      ref={svgRef}
      className="opticsDiagram"
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      role="img"
      aria-label="Rajah sinar pembentukan imej oleh kanta"
    >
      <defs>
        <marker
          id="opticsArrowRed"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef1d1d" />
        </marker>
        <marker
          id="opticsArrowOrange"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
        <marker
          id="opticsArrowRedMid"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="4.8"
          markerHeight="4.8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef1d1d" />
        </marker>
        <marker
          id="opticsArrowOrangeMid"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="4.8"
          markerHeight="4.8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
        <marker
          id="opticsArrowBlue"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="18"
          markerHeight="18"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0b4cff" />
        </marker>
        <marker
          id="opticsArrowPurple"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="17"
          markerHeight="17"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c2dff" />
        </marker>
      </defs>

      <rect className="opticsStageGrid" x="0" y="0" width="1200" height="520" rx="18" />
      <line className="opticsAxis" x1="42" y1={diagram.axisY} x2="1160" y2={diagram.axisY} />
      <text className="opticsAxisLabel" x="58" y="238">
        Paksi utama
      </text>

      {displayOptions.foci && (
        <g className="opticsFocusMarks">
          {[
            { x: leftTwoFocusX, label: "2F" },
            { x: leftFocusX, label: "F" },
            { x: diagram.lensX, label: "O" },
            { x: rightFocusX, label: "F" },
            { x: rightTwoFocusX, label: "2F" },
          ].map((mark) => (
            <g key={`${mark.label}-${mark.x}`}>
              <circle cx={mark.x} cy={diagram.axisY} r="5.5" />
              <text x={mark.x} y={diagram.axisY + 32}>
                {mark.label}
              </text>
            </g>
          ))}
        </g>
      )}

      <LensShape lensType={lensType} />

      <g
        onPointerDown={handleObjectPointerDown}
        onPointerMove={handleObjectPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        <ArrowFigure
          x={objectStop.x}
          axisY={diagram.axisY}
          height={diagram.objectHeight}
          label="Objek"
          tone="object"
          draggable
        />
      </g>

      {lightOn && displayOptions.rays && (
        <g
          key={`rays-${animationKey}`}
          className={`opticsRayGroup${playing ? " opticsRayGroup--playing" : ""}`}
        >
          {opticsData.redPaths.map((path, index) => (
            <path
              key={`red-${index}`}
              className="opticsRay opticsRay--red opticsRay--animated"
              d={path}
              markerMid="url(#opticsArrowRedMid)"
              markerEnd="url(#opticsArrowRed)"
              style={rayStyle}
            />
          ))}
          {opticsData.orangePaths.map((path, index) => (
            <path
              key={`orange-${index}`}
              className="opticsRay opticsRay--orange opticsRay--animated"
              d={path}
              markerMid="url(#opticsArrowOrangeMid)"
              markerEnd="url(#opticsArrowOrange)"
              style={rayStyle}
            />
          ))}
          {displayOptions.virtualRays &&
            opticsData.virtualPaths.map((path, index) => (
              <path
                key={`virtual-${index}`}
                className="opticsRay opticsRay--virtual opticsRay--animated"
                d={path}
                style={rayStyle}
              />
            ))}
        </g>
      )}

      {lightOn && displayOptions.image && opticsData.clearImage && opticsData.imageX !== null && (
        <ArrowFigure
          x={opticsData.imageX}
          axisY={diagram.axisY}
          height={opticsData.imageHeight}
          label="Imej"
          tone="image"
        />
      )}

      {!opticsData.clearImage && lightOn && (
        <g className="opticsNoImageNote">
          <rect x="714" y="70" width="360" height="74" rx="16" />
          <text x="738" y="101">
            Imej tidak terbentuk dengan jelas.
          </text>
          <text x="738" y="126">
            Sinar biasan bergerak selari.
          </text>
        </g>
      )}

      {displayOptions.values && (
        <g className="opticsValueLabels">
          <text x={(objectStop.x + diagram.lensX) / 2} y={diagram.axisY + 74}>
            u = {formatDistance(opticsData.objectDistance)}
          </text>
          <text x={diagram.lensX - diagram.focalLength / 2} y={diagram.axisY - 72}>
            f = {formatDistance(diagram.focalLength)}
          </text>
          <text
            x={
              opticsData.imageX === null
                ? diagram.lensX + 260
                : (opticsData.imageX + diagram.lensX) / 2
            }
            y={diagram.axisY + 96}
          >
            v = {formatDistance(opticsData.imageDistance)}
          </text>
        </g>
      )}
    </svg>
  );
}

function ObjectSlider({
  objectStop,
  onObjectStopChange,
}: {
  objectStop: ObjectStop;
  onObjectStopChange: (stopId: ObjectStopId) => void;
}) {
  const activeIndex = objectStops.findIndex((stop) => stop.id === objectStop.id);
  const safeIndex = activeIndex >= 0 ? activeIndex : 2;
  const progress = `${(safeIndex / (objectStops.length - 1)) * 100}%`;

  return (
    <div className="opticsObjectControl">
      <div className="opticsControlTitle">Kedudukan Objek</div>
      <div className="opticsSliderWrap">
        <input
          type="range"
          min="0"
          max={objectStops.length - 1}
          step="1"
          value={safeIndex}
          aria-label="Kedudukan objek"
          onChange={(event) => {
            const nextStop = objectStops[Number(event.target.value)];

            if (nextStop) {
              onObjectStopChange(nextStop.id);
            }
          }}
          style={{ "--slider-progress": progress } as CssVarStyle}
        />
        <div className="opticsSliderTicks" aria-hidden="true">
          {objectStops.map((stop, index) => (
            <span
              key={stop.id}
              style={
                {
                  "--tick-position": `${(index / (objectStops.length - 1)) * 100}%`,
                } as CssVarStyle
              }
            >
              {stop.label}
            </span>
          ))}
        </div>
      </div>
      <div className="opticsDragHint">
        <span aria-hidden="true" />
        Seret objek biru atau laraskan gelangsar untuk mengubah kedudukan objek.
      </div>
    </div>
  );
}

function ImageInfoPanel({
  lightOn,
  lensType,
  objectStop,
  opticsData,
}: {
  lightOn: boolean;
  lensType: LensType;
  objectStop: ObjectStop;
  opticsData: OpticsData;
}) {
  const opticalTools = getOpticalTools(lensType, objectStop.id);
  const rows = [
    { label: "Jenis imej", value: opticsData.imageType },
    { label: "Orientasi", value: opticsData.orientation },
    { label: "Saiz", value: opticsData.size },
    { label: "Kedudukan imej", value: opticsData.imagePosition },
  ];

  return (
    <aside className="opticsSideCard opticsImageInfoPanel">
      <h2>Ciri-ciri Imej</h2>
      {!lightOn ? (
        <div className="opticsImageInfoEmpty">
          <span aria-hidden="true" />
          <strong>Maklumat imej belum tersedia</strong>
          <p>Hidupkan cahaya untuk melihat ciri-ciri imej dan aplikasi alat optik.</p>
        </div>
      ) : (
        <>
      <div className="opticsObjectStatus">
        <span>Kedudukan objek:</span>
        <strong>{objectStop.label}</strong>
      </div>
      <div className="opticsInfoRows">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`opticsInfoRow${
              opticsData.clearImage ? "" : " opticsInfoRow--warning"
            }`}
          >
            <span aria-hidden="true" />
            <div>
              <small>{row.label}</small>
              <strong>{row.value}</strong>
            </div>
          </div>
        ))}
      </div>
      {opticsData.note && <p className="opticsImageNote">{opticsData.note}</p>}
      <div className="opticsToolPanel">
        <span>Aplikasi alat optik</span>
        <div className="opticsToolList">
          {opticalTools.map((tool) => (
            <article className="opticsToolItem" key={tool.name}>
              <strong aria-hidden="true">{tool.icon}</strong>
              <div>
                <b>{tool.name}</b>
                <small>{tool.context}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
        </>
      )}
    </aside>
  );
}

function DisplayOptionsPanel({
  displayOptions,
  onToggle,
}: {
  displayOptions: DisplayOptions;
  onToggle: (key: DisplayOptionKey) => void;
}) {
  return (
    <aside className="opticsSideCard opticsDisplayPanel">
      <h2>Pilihan Paparan</h2>
      <div className="opticsCheckboxList">
        {displayOptionLabels.map((option) => (
          <label key={option.key}>
            <input
              type="checkbox"
              checked={displayOptions[option.key]}
              onChange={() => onToggle(option.key)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

function AnimationControls({
  lightOn,
  playing,
  animationSpeed,
  onStartLight,
  onPlay,
  onPause,
  onReplay,
  onSpeedChange,
}: {
  lightOn: boolean;
  playing: boolean;
  animationSpeed: number;
  onStartLight: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onSpeedChange: (speed: number) => void;
}) {
  return (
    <section className="opticsControlBar" aria-label="Kawalan animasi cahaya">
      <button type="button" className="opticsLightButton" onClick={onStartLight}>
        <span aria-hidden="true" />
        {lightOn ? "Cahaya Hidup" : "Hidupkan Cahaya"}
      </button>
      <div className="opticsPlaybackButtons">
        <button
          type="button"
          className={playing ? "opticsRoundButton opticsRoundButton--active" : "opticsRoundButton"}
          onClick={onPlay}
          aria-label="Main animasi"
        >
          <span className="opticsPlayIcon" aria-hidden="true" />
          <small>Main</small>
        </button>
        <button
          type="button"
          className={!playing && lightOn ? "opticsRoundButton opticsRoundButton--active" : "opticsRoundButton"}
          onClick={onPause}
          aria-label="Jeda animasi"
        >
          <span className="opticsPauseIcon" aria-hidden="true" />
          <small>Jeda</small>
        </button>
        <button
          type="button"
          className="opticsRoundButton"
          onClick={onReplay}
          aria-label="Ulangi animasi"
        >
          <span className="opticsReplayIcon" aria-hidden="true" />
          <small>Ulangi</small>
        </button>
      </div>
      <label className="opticsSpeedControl">
        <span>Kelajuan Animasi</span>
        <input
          type="range"
          min="0.7"
          max="1.8"
          step="0.1"
          value={animationSpeed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        />
        <small>
          <span>Perlahan</span>
          <span>Cepat</span>
        </small>
      </label>
    </section>
  );
}

function InfoCard({ lensType }: { lensType: LensType }) {
  const lines =
    lensType === "convex"
      ? [
          "Sinar 1: Selari paksi utama, dibiaskan melalui titik fokus (F) di sebelah kanan.",
          "Sinar 2: Melalui pusat optik (O), diteruskan dalam garis lurus.",
        ]
      : [
          "Sinar 1: Selari paksi utama, dibiaskan mencapah seolah-olah datang dari F sebelah kiri.",
          "Sinar 2: Melalui pusat optik (O), diteruskan dalam garis lurus.",
        ];

  return (
    <section className="opticsInfoCard" aria-label="Info sinar cahaya">
      <span className="opticsInfoBulb" aria-hidden="true" />
      <div>
        <h2>Info</h2>
        {lines.map((line) => {
          const [title, detail] = line.split(": ");

          return (
            <p key={line}>
              <strong>{title}:</strong> {detail}
            </p>
          );
        })}
      </div>
    </section>
  );
}

export default function OpticsLensSimulatorPage({
  reviewPanel,
}: {
  reviewPanel?: ReactNode;
}) {
  const [lensType, setLensType] = useState<LensType>("convex");
  const [objectStopId, setObjectStopId] = useState<ObjectStopId>(defaultObjectStop.id);
  const [lightOn, setLightOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1.1);
  const [displayOptions, setDisplayOptions] =
    useState<DisplayOptions>(defaultDisplayOptions);
  const [helpOpen, setHelpOpen] = useState(false);
  const objectStop =
    objectStops.find((stop) => stop.id === objectStopId) ?? defaultObjectStop;
  const opticsData = useMemo(
    () => getOpticsData(lensType, objectStop),
    [lensType, objectStop],
  );
  const selectedLens = lensOptions.find((option) => option.id === lensType);

  const handleLensChange = (nextLensType: LensType) => {
    setLensType(nextLensType);

    if (lightOn) {
      setAnimationKey((current) => current + 1);
      setPlaying(true);
    }
  };

  const handleObjectStopChange = (stopId: ObjectStopId) => {
    setObjectStopId(stopId);
  };

  const startLight = () => {
    setLightOn(true);
    setPlaying(true);
    setAnimationKey((current) => current + 1);
  };

  const playAnimation = () => {
    if (!lightOn) {
      startLight();
      return;
    }

    setPlaying(true);
  };

  const pauseAnimation = () => {
    setPlaying(false);
  };

  const replayAnimation = () => {
    setLightOn(true);
    setPlaying(true);
    setAnimationKey((current) => current + 1);
  };

  const resetSimulator = () => {
    setLensType("convex");
    setObjectStopId(defaultObjectStop.id);
    setLightOn(false);
    setPlaying(false);
    setAnimationKey(0);
    setAnimationSpeed(1.1);
    setDisplayOptions(defaultDisplayOptions);
    setHelpOpen(false);
  };

  const toggleDisplayOption = (key: DisplayOptionKey) => {
    setDisplayOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <main className="opticsPage">
      <section className="opticsTopbar">
        <div className="opticsBrand">
          <span className="opticsBrandIcon" aria-hidden="true">
            <span />
          </span>
          <div>
            <span>Sains Tingkatan 5 - Bab 7 Cahaya dan Optik</span>
            <h1>Pembentukan Imej oleh Kanta</h1>
          </div>
        </div>

        <LensSelector lensType={lensType} onLensChange={handleLensChange} />

        <div className="opticsTopActions">
          <button
            type="button"
            className="opticsGhostButton"
            onClick={() => setHelpOpen((current) => !current)}
          >
            <span className="opticsQuestionIcon" aria-hidden="true" />
            Bantuan
          </button>
          <button type="button" className="opticsGhostButton" onClick={resetSimulator}>
            <span className="opticsResetIcon" aria-hidden="true" />
            Reset
          </button>
          <a className="opticsGhostButton" href="/simulator">
            <span className="opticsMenuIcon" aria-hidden="true" />
            Menu
          </a>
        </div>
      </section>

      {helpOpen && (
        <section className="opticsHelpPanel" role="dialog" aria-label="Bantuan simulator">
          <strong>Langkah ringkas</strong>
          <p>
            Pilih jenis kanta, laraskan kedudukan objek, kemudian hidupkan cahaya
            untuk melihat sinar dan imej dikemas kini secara automatik.
          </p>
        </section>
      )}

      <section className="opticsNotice">
        <span aria-hidden="true">i</span>
        <p>
          Laraskan kedudukan objek pada paksi utama. Kemudian, hidupkan sumber
          cahaya. Pemerhatian imej akan dikemas kini secara automatik.
        </p>
      </section>

      <section className="opticsWorkspace" aria-label="Simulator pembentukan imej">
        <div className="opticsMainColumn">
          <section className="opticsDiagramCard">
            <div className="opticsStageToolbar">
              <div
                className={`opticsLightStatus${
                  lightOn ? " opticsLightStatus--on" : ""
                }`}
              >
                <strong>Cahaya</strong>
                <span>{lightOn ? "HIDUP" : "MATI"}</span>
              </div>
              <div className="opticsBulbHint">
                <span className={lightOn ? "opticsBulbHint__icon opticsBulbHint__icon--on" : "opticsBulbHint__icon"} />
                <p>
                  {lightOn
                    ? `Cahaya aktif untuk ${selectedLens?.label ?? "kanta"}.`
                    : "Klik butang untuk hidupkan cahaya."}
                </p>
              </div>
            </div>

            <RayDiagram
              lensType={lensType}
              objectStop={objectStop}
              opticsData={opticsData}
              displayOptions={displayOptions}
              lightOn={lightOn}
              playing={playing}
              animationKey={animationKey}
              animationSpeed={animationSpeed}
              onObjectStopChange={handleObjectStopChange}
            />

            <ObjectSlider
              objectStop={objectStop}
              onObjectStopChange={handleObjectStopChange}
            />
          </section>

          <div className="opticsBottomDeck">
            <AnimationControls
              lightOn={lightOn}
              playing={playing}
              animationSpeed={animationSpeed}
              onStartLight={startLight}
              onPlay={playAnimation}
              onPause={pauseAnimation}
              onReplay={replayAnimation}
              onSpeedChange={setAnimationSpeed}
            />
            <InfoCard lensType={lensType} />
          </div>
        </div>

        <div className="opticsSideStack">
          <ImageInfoPanel
            lightOn={lightOn}
            lensType={lensType}
            objectStop={objectStop}
            opticsData={opticsData}
          />
          <DisplayOptionsPanel
            displayOptions={displayOptions}
            onToggle={toggleDisplayOption}
          />
        </div>
      </section>

      {reviewPanel}
    </main>
  );
}
