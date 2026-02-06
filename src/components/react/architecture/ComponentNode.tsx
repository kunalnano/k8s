import { componentDetails } from "../../../data/components";

interface ComponentNodeProps {
  id: string;
  label: string;
  x: number;
  y: number;
  type?: "control" | "worker";
  onClick: (id: string) => void;
  isActive?: boolean;
  isFailed?: boolean;
  showScale?: boolean;
  isYamlHighlight?: boolean;
  isDimmed?: boolean;
  scaleNote?: string;
}

export default function ComponentNode({
  id,
  label,
  x,
  y,
  type = "control",
  onClick,
  isActive = false,
  isFailed = false,
  showScale = false,
  isYamlHighlight = false,
  isDimmed = false,
}: ComponentNodeProps) {
  const fill = isFailed
    ? "#991b1b"
    : isYamlHighlight
      ? "#7c3aed"
      : isActive
        ? type === "control"
          ? "#3b82f6"
          : "#34d399"
        : type === "control"
          ? "#1e3a5f"
          : "#15573f";

  const stroke = isFailed
    ? "#ef4444"
    : isYamlHighlight
      ? "#a78bfa"
      : isActive
        ? "#fff"
        : type === "control"
          ? "#3b82f6"
          : "#34d399";

  const strokeWidth = isFailed || isYamlHighlight ? 3 : isActive ? 2.5 : 1.5;

  const glowColor = isFailed
    ? "#ef4444"
    : isYamlHighlight
      ? "#a78bfa"
      : type === "control"
        ? "#3b82f6"
        : "#34d399";

  const filterId = `glow-${id}`;

  const scaleNoteText = componentDetails[id]?.scaleNote;

  return (
    <g
      className={`component-node-group${isDimmed ? " component-node-dim" : ""}`}
      onClick={() => onClick(id)}
      style={{ cursor: "pointer", transformOrigin: `${x + 60}px ${y + 25}px` }}
      role="button"
      tabIndex={0}
      aria-label={`${label} component${isActive ? ", selected" : ""}${isFailed ? ", failed" : ""}${isYamlHighlight ? ", highlighted" : ""}`}
      aria-pressed={isActive || isYamlHighlight}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
    >
      {/* Filter definition for hover glow */}
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id={`${filterId}-shadow`}
          x="-10%"
          y="-10%"
          width="130%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2.5"
            floodColor="#000"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      {/* Glow rect behind main rect - visible on hover via CSS */}
      <rect
        className="node-glow-rect"
        x={x - 4}
        y={y - 4}
        width={128}
        height={58}
        rx={10}
        fill={glowColor}
        filter={`url(#${filterId})`}
      />

      {/* Main component rect */}
      <rect
        x={x}
        y={y}
        width={120}
        height={50}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        filter={`url(#${filterId}-shadow)`}
        className="transition-all duration-300"
      />

      {/* Label */}
      <text
        x={x + 60}
        y={y + 25}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={11}
        fontWeight={600}
      >
        {label}
      </text>

      {/* Ring-pulse status indicator when active */}
      {isActive && !isFailed && !isYamlHighlight && (
        <g>
          {/* Expanding ring */}
          <circle
            cx={x + 110}
            cy={y + 10}
            r={5}
            fill="none"
            stroke="#22c55e"
            strokeWidth={1.5}
            opacity={0}
          >
            <animate
              attributeName="r"
              from="5"
              to="12"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.7"
              to="0"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Solid inner dot */}
          <circle cx={x + 110} cy={y + 10} r={4} fill="#22c55e" />
        </g>
      )}

      {/* Ring-pulse status indicator when yaml highlighted */}
      {isYamlHighlight && (
        <g>
          {/* Expanding ring */}
          <circle
            cx={x + 110}
            cy={y + 10}
            r={5}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={1.5}
            opacity={0}
          >
            <animate
              attributeName="r"
              from="5"
              to="12"
              dur="1.8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.7"
              to="0"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Solid inner dot */}
          <circle cx={x + 110} cy={y + 10} r={4} fill="#a78bfa" />
        </g>
      )}

      {/* Red X when failed - with fade pulse animation */}
      {isFailed && (
        <text
          x={x + 110}
          y={y + 15}
          fill="#ef4444"
          fontSize={14}
          fontWeight="bold"
        >
          &#x2715;
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </text>
      )}

      {/* Scale note above component */}
      {showScale && scaleNoteText && (
        <g>
          <rect
            x={x - 5}
            y={y - 20}
            width={130}
            height={16}
            rx={3}
            fill="#0f172a"
            stroke="#475569"
            strokeWidth={1}
          />
          <text
            x={x + 60}
            y={y - 8}
            textAnchor="middle"
            fill="#fbbf24"
            fontSize={7}
          >
            {scaleNoteText.substring(0, 35)}
          </text>
        </g>
      )}
    </g>
  );
}
