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
  const safeId = `arrow-${id}-${isActive ? "on" : "off"}-${uniqueId}`.replace(
    /:/g,
    "-",
  );
  const markerId = safeId;
  const gradientId = `${safeId}-grad`;
  const filterId = `${safeId}-glow`;

  const path = customPath
    ? customPath
    : curved
      ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - curveOffset} ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x2} ${y2}`;

  const inactiveColor = "#64748b";

  return (
    <g>
      <defs>
        {/* Arrowhead marker */}
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="8"
          refX="10"
          refY="4"
          orient="auto"
        >
          <polygon
            points="0 0, 12 4, 0 8"
            fill={isActive ? "#4ade80" : inactiveColor}
          />
        </marker>

        {/* Gradient stroke for active arrows */}
        {isActive && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        )}

        {/* Soft glow filter for active arrows */}
        {isActive && (
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Main arrow path */}
      <path
        d={path}
        fill="none"
        stroke={isActive ? `url(#${gradientId})` : inactiveColor}
        strokeWidth={isActive ? 2.5 : 1.5}
        markerEnd={`url(#${markerId})`}
        strokeDasharray={isActive ? "6 3" : "none"}
        className={isActive ? "animate-dash-flow animate-glow-breathe" : ""}
        filter={isActive ? `url(#${filterId})` : undefined}
        style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
      />

      {/* Packet with bloom/trail effect */}
      {showPacket && isActive && (
        <g>
          {/* Outer glow bloom circle */}
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
          {/* Mid glow ring */}
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
          {/* Core packet circle */}
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
