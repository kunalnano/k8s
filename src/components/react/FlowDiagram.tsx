import { useState, useEffect, useCallback } from "react";
import { flowSteps } from "../../data/flow-steps";
import Arrow from "./architecture/Arrow";

// All arrows defined upfront - always rendered, opacity controlled by step
const arrowConfigs = [
  {
    id: "f0",
    x1: 100,
    y1: 134,
    x2: 148,
    y2: 78,
    appearsAt: 0,
    activeSteps: [0],
    packetStep: 0,
  },
  {
    id: "f1",
    x1: 197,
    y1: 90,
    x2: 197,
    y2: 163,
    appearsAt: 1,
    activeSteps: [1],
    packetStep: 1,
  },
  {
    id: "f2",
    x1: 247,
    y1: 69,
    x2: 288,
    y2: 69,
    appearsAt: 2,
    activeSteps: [2],
    packetStep: 2,
  },
  {
    id: "f3",
    x1: 387,
    y1: 69,
    x2: 428,
    y2: 69,
    appearsAt: 3,
    activeSteps: [3, 4],
    packetStep: 4,
  },
  {
    id: "f5",
    x1: 477,
    y1: 90,
    x2: 477,
    y2: 163,
    appearsAt: 5,
    activeSteps: [5],
    packetStep: 5,
  },
  {
    id: "f6",
    x1: 527,
    y1: 184,
    x2: 568,
    y2: 184,
    appearsAt: 6,
    activeSteps: [6],
    packetStep: 6,
  },
  {
    id: "f7",
    x1: 527,
    y1: 205,
    x2: 568,
    y2: 240,
    appearsAt: 7,
    activeSteps: [7],
    packetStep: 7,
  },
];

// Component boxes for glow ring overlays
const boxes = [
  { id: "user", x: 25, y: 115, w: 75, h: 38, color: "#f59e0b" },
  { id: "apiserver", x: 150, y: 50, w: 95, h: 38, color: "#3b82f6" },
  { id: "controller", x: 290, y: 50, w: 95, h: 38, color: "#8b5cf6" },
  { id: "scheduler", x: 430, y: 50, w: 95, h: 38, color: "#ec4899" },
  { id: "kubelet", x: 430, y: 165, w: 95, h: 38, color: "#10b981" },
  { id: "runtime", x: 570, y: 165, w: 95, h: 38, color: "#06b6d4" },
  { id: "kubeproxy", x: 570, y: 230, w: 95, h: 38, color: "#f97316" },
];

export default function FlowDiagram() {
  const [flowStep, setFlowStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Smooth description transitions: fade out old, swap, fade in new
  const [displayedStep, setDisplayedStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const maxStep = flowSteps.length - 1;

  const next = useCallback(
    () => setFlowStep((s) => Math.min(maxStep, s + 1)),
    [maxStep],
  );
  const prev = useCallback(() => setFlowStep((s) => Math.max(0, s - 1)), []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFlowStep((s) => {
        if (s >= maxStep) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, maxStep]);

  // Description crossfade: brief fade-out, swap content, fade-in
  useEffect(() => {
    if (flowStep !== displayedStep) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedStep(flowStep);
        setTransitioning(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [flowStep, displayedStep]);

  // Keyboard handling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isPlaying) {
          setIsPlaying(false);
        } else {
          setFlowStep((s) => {
            if (s >= maxStep) return 0;
            return s;
          });
          setIsPlaying(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isPlaying, maxStep]);

  const step = flowSteps[flowStep];
  const displayStep = flowSteps[displayedStep];
  const isActive = (id: string) => step.active.includes(id);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5">
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Deployment Lifecycle
          </h2>
          <p className="text-slate-500 text-[10px] sm:text-xs">
            kubectl apply &rarr; Running Pods
          </p>
        </div>
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          role="toolbar"
          aria-label="Flow animation controls"
        >
          <button
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                if (flowStep >= maxStep) setFlowStep(0);
                setIsPlaying(true);
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] sm:text-xs font-medium text-white"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={prev}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs text-white disabled:opacity-40"
            aria-label="Previous step"
            disabled={flowStep === 0}
          >
            &larr;
          </button>
          <button
            onClick={next}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs text-white disabled:opacity-40"
            aria-label="Next step"
            disabled={flowStep === maxStep}
          >
            &rarr;
          </button>
          <button
            onClick={() => {
              setFlowStep(0);
              setIsPlaying(false);
            }}
            className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[9px] sm:text-[10px] text-white"
            aria-label="Reset flow animation"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto">
        <div className="min-w-[680px] lg:min-w-0">
          <svg
            viewBox="0 0 750 280"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Deployment lifecycle flow diagram showing steps from kubectl apply to running pods"
          >
            {/* Region backgrounds for context */}
            <rect
              x={138}
              y={36}
              width={400}
              height={60}
              rx={8}
              fill="none"
              stroke="#1e293b"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            <text
              x={143}
              y={47}
              fill="#334155"
              fontSize={7}
              fontWeight={600}
              letterSpacing="0.05em"
            >
              CONTROL PLANE
            </text>

            <rect
              x={420}
              y={152}
              width={255}
              height={128}
              rx={8}
              fill="none"
              stroke="#1e293b"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            <text
              x={425}
              y={163}
              fill="#334155"
              fontSize={7}
              fontWeight={600}
              letterSpacing="0.05em"
            >
              WORKER NODE
            </text>

            {/* Active glow rings - always in DOM, opacity-transitioned */}
            {boxes.map((box) => (
              <rect
                key={`glow-${box.id}`}
                x={box.x - 3}
                y={box.y - 3}
                width={box.w + 6}
                height={box.h + 6}
                rx={8}
                fill="none"
                stroke={box.color}
                strokeWidth={2}
                style={{
                  opacity: isActive(box.id) ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.2;0.6;0.2"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </rect>
            ))}

            {/* Component Boxes */}
            <rect
              x={25}
              y={115}
              width={75}
              height={38}
              rx={5}
              fill={isActive("user") ? "#f59e0b" : "#1e293b"}
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
            <text
              x={62}
              y={138}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
              fontWeight={600}
            >
              You
            </text>

            <rect
              x={150}
              y={50}
              width={95}
              height={38}
              rx={5}
              fill={isActive("apiserver") ? "#3b82f6" : "#1e3a5f"}
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <text x={197} y={73} textAnchor="middle" fill="#fff" fontSize={9}>
              API Server
            </text>

            <rect
              x={290}
              y={50}
              width={95}
              height={38}
              rx={5}
              fill={isActive("controller") ? "#8b5cf6" : "#3b2970"}
              stroke="#8b5cf6"
              strokeWidth={1.5}
            />
            <text x={337} y={73} textAnchor="middle" fill="#fff" fontSize={9}>
              Controllers
            </text>

            <rect
              x={430}
              y={50}
              width={95}
              height={38}
              rx={5}
              fill={isActive("scheduler") ? "#ec4899" : "#6b214f"}
              stroke="#ec4899"
              strokeWidth={1.5}
            />
            <text x={477} y={73} textAnchor="middle" fill="#fff" fontSize={9}>
              Scheduler
            </text>

            <rect
              x={430}
              y={165}
              width={95}
              height={38}
              rx={5}
              fill={isActive("kubelet") ? "#10b981" : "#134e3a"}
              stroke="#10b981"
              strokeWidth={1.5}
            />
            <text x={477} y={188} textAnchor="middle" fill="#fff" fontSize={9}>
              Kubelet
            </text>

            <rect
              x={570}
              y={165}
              width={95}
              height={38}
              rx={5}
              fill={isActive("runtime") ? "#06b6d4" : "#164e63"}
              stroke="#06b6d4"
              strokeWidth={1.5}
            />
            <text x={617} y={188} textAnchor="middle" fill="#fff" fontSize={9}>
              containerd
            </text>

            <rect
              x={570}
              y={230}
              width={95}
              height={38}
              rx={5}
              fill={isActive("kubeproxy") ? "#f97316" : "#6b3410"}
              stroke="#f97316"
              strokeWidth={1.5}
            />
            <text x={617} y={253} textAnchor="middle" fill="#fff" fontSize={9}>
              kube-proxy
            </text>

            <rect
              x={150}
              y={165}
              width={95}
              height={38}
              rx={5}
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth={1.5}
            />
            <text
              x={197}
              y={188}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={9}
            >
              etcd
            </text>

            {/* Arrows - always rendered, fade in/out with CSS transitions */}
            {arrowConfigs.map((a) => (
              <g
                key={a.id}
                style={{
                  opacity: flowStep >= a.appearsAt ? 1 : 0,
                  transition: "opacity 0.5s ease",
                }}
              >
                <Arrow
                  id={a.id}
                  x1={a.x1}
                  y1={a.y1}
                  x2={a.x2}
                  y2={a.y2}
                  isActive={a.activeSteps.includes(flowStep)}
                  showPacket={flowStep === a.packetStep}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Description Panel - smooth crossfade, no layout shift */}
      <div className="min-h-[76px]">
        <div
          className="bg-slate-800 rounded-xl p-3 sm:p-4 border-l-4 border-emerald-500"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(6px)" : "translateY(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
              Step {displayedStep + 1}/{flowSteps.length}
            </span>
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              {displayStep.label}
            </h3>
          </div>
          <p className="text-slate-400 text-[10px] sm:text-xs">
            {displayStep.description}
          </p>
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div
        className="flex gap-1"
        role="tablist"
        aria-label="Flow step navigation"
      >
        {flowSteps.map((_, i) => (
          <button
            key={i}
            onClick={() => setFlowStep(i)}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i === flowStep
                ? "h-2 bg-emerald-500"
                : i < flowStep
                  ? "h-1.5 bg-emerald-800"
                  : "h-1.5 bg-slate-700"
            }`}
            role="tab"
            aria-selected={i === flowStep}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-[9px] sm:text-[10px] text-slate-600 text-center">
        &larr; &rarr; navigate &bull; Space play/pause
      </p>
    </div>
  );
}
