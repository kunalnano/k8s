import { useId } from "react";

interface ArrowProps {
  id: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  isActive?: boolean;
  curved?: boolean;
  curveOffset?: number;
  showPacket?: boolean;
  customPath?: string;
}

export default function Arrow({
  id,
  x1 = 0,
  y1 = 0,
  x2 = 0,
  y2 = 0,
  isActive = false,
  curved = false,
  curveOffset = 40,
  showPacket = false,
  customPath,
}: ArrowProps) {
  const uniqueId = useId();
  // Stable ID - doesn't change with active state, preventing remount flicker
  const safeId = `arrow-${id}-${uniqueId}`.replace(/:/g, "-");

  const path = customPath
    ? customPath
    : curved
      ? (() => {
          const midX = (x1 + x2) / 2;
          const cpY = Math.min(y1, y2) - curveOffset;
          return `M ${x1} ${y1} C ${x1 + (midX - x1) * 0.4} ${cpY}, ${x2 - (x2 - midX) * 0.4} ${cpY}, ${x2} ${y2}`;
        })()
      : `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <g>
      <defs>
        <marker
          id={`${safeId}-marker`}
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
        >
          <polygon
            points="0 0, 12 4, 0 8"
            fill={isActive ? "#4ade80" : "#64748b"}
          />
        </marker>

        {/* Always render glow filter so it's available for CSS transitions */}
        <filter
          id={`${safeId}-glow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Solid colors only - CSS can interpolate between them smoothly */}
      <path
        d={path}
        fill="none"
        stroke={isActive ? "#4ade80" : "#64748b"}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${safeId}-marker)`}
        strokeDasharray={isActive ? "6 3" : "none"}
        className={isActive ? "animate-dash-flow" : ""}
        filter={isActive ? `url(#${safeId}-glow)` : undefined}
        style={{ transition: "stroke 0.4s ease, stroke-width 0.3s ease" }}
      />

      {showPacket && isActive && (
        <g>
          <circle r={14} fill="#22c55e" opacity="0.15">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={path}
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          </circle>
          <circle r={10} fill="#4ade80" opacity="0.25">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={path}
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          </circle>
          <circle r={5} fill="#4ade80" opacity="0.95">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={path}
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
          </circle>
        </g>
      )}
    </g>
  );
}
