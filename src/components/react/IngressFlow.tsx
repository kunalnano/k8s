import { useState, useEffect, useCallback } from "react";
import { ingressSteps } from "../../data/ingress-steps";
import Arrow from "./architecture/Arrow";

export default function IngressFlow() {
  const [ingressStep, setIngressStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const maxStep = ingressSteps.length - 1;

  const next = useCallback(
    () => setIngressStep((s) => Math.min(maxStep, s + 1)),
    [maxStep],
  );
  const prev = useCallback(() => setIngressStep((s) => Math.max(0, s - 1)), []);
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const reset = useCallback(() => {
    setIngressStep(0);
    setIsPlaying(false);
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setIngressStep((s) => {
        if (s >= maxStep) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlaying, maxStep]);

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
        togglePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, togglePlay]);

  const step = ingressSteps[ingressStep];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5">
      {/* Header + Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Ingress Traffic Flow
          </h2>
          <p className="text-slate-500 text-[10px] sm:text-xs">
            How external HTTP(S) reaches your Pods
          </p>
        </div>
        <div
          className="flex gap-1.5 sm:gap-2"
          role="toolbar"
          aria-label="Ingress animation controls"
        >
          <button
            onClick={() => {
              setIngressStep(0);
              setIsPlaying(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-[10px] sm:text-xs font-medium text-white"
            aria-label="Play ingress animation"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={prev}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs text-white disabled:opacity-40"
            aria-label="Previous step"
            disabled={ingressStep === 0}
          >
            &larr;
          </button>
          <button
            onClick={next}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs text-white disabled:opacity-40"
            aria-label="Next step"
            disabled={ingressStep === maxStep}
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto">
        <div className="min-w-[700px] lg:min-w-0">
          <svg
            viewBox="0 0 750 260"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Ingress traffic flow diagram showing how external requests reach pods"
          >
            {/* Internet */}
            <rect
              x={20}
              y={100}
              width={80}
              height={50}
              rx={6}
              fill={ingressStep === 0 ? "#f97316" : "#3f3f46"}
              stroke="#f97316"
              strokeWidth={1.5}
            />
            <text x={60} y={130} textAnchor="middle" fill="#fff" fontSize={10}>
              Internet
            </text>

            {/* Load Balancer */}
            <rect
              x={140}
              y={100}
              width={90}
              height={50}
              rx={6}
              fill={ingressStep === 0 ? "#f97316" : "#1e293b"}
              stroke="#f97316"
              strokeWidth={1.5}
            />
            <text x={185} y={122} textAnchor="middle" fill="#fff" fontSize={9}>
              Cloud LB
            </text>
            <text
              x={185}
              y={136}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={7}
            >
              (or NodePort)
            </text>

            {/* Ingress Controller */}
            <rect
              x={270}
              y={100}
              width={100}
              height={50}
              rx={6}
              fill={
                ingressStep >= 1 && ingressStep <= 2 ? "#8b5cf6" : "#3b2970"
              }
              stroke="#8b5cf6"
              strokeWidth={1.5}
            />
            <text x={320} y={122} textAnchor="middle" fill="#fff" fontSize={9}>
              Ingress Controller
            </text>
            <text
              x={320}
              y={136}
              textAnchor="middle"
              fill="#c4b5fd"
              fontSize={7}
            >
              (nginx/traefik)
            </text>

            {/* Service */}
            <rect
              x={410}
              y={100}
              width={85}
              height={50}
              rx={6}
              fill={ingressStep >= 3 ? "#3b82f6" : "#1e3a5f"}
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <text x={452} y={130} textAnchor="middle" fill="#fff" fontSize={9}>
              Service
            </text>

            {/* Endpoints */}
            <rect
              x={535}
              y={85}
              width={75}
              height={35}
              rx={5}
              fill={ingressStep >= 4 ? "#10b981" : "#134e3a"}
              stroke="#10b981"
              strokeWidth={1.5}
            />
            <text x={572} y={107} textAnchor="middle" fill="#fff" fontSize={8}>
              Endpoints
            </text>

            {/* Pods */}
            <g>
              <rect
                x={640}
                y={55}
                width={60}
                height={35}
                rx={5}
                fill={ingressStep >= 5 ? "#10b981" : "#0f172a"}
                stroke="#10b981"
                strokeWidth={1.5}
              />
              <text x={670} y={77} textAnchor="middle" fill="#fff" fontSize={8}>
                Pod 1
              </text>
              <rect
                x={640}
                y={105}
                width={60}
                height={35}
                rx={5}
                fill="#0f172a"
                stroke="#10b981"
                strokeWidth={1.5}
              />
              <text
                x={670}
                y={127}
                textAnchor="middle"
                fill="#fff"
                fontSize={8}
              >
                Pod 2
              </text>
              <rect
                x={640}
                y={155}
                width={60}
                height={35}
                rx={5}
                fill="#0f172a"
                stroke="#10b981"
                strokeWidth={1.5}
              />
              <text
                x={670}
                y={177}
                textAnchor="middle"
                fill="#fff"
                fontSize={8}
              >
                Pod 3
              </text>
            </g>

            {/* Ingress Rules Box */}
            <rect
              x={270}
              y={170}
              width={100}
              height={60}
              rx={5}
              fill="#1e1b4b"
              stroke="#6366f1"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
            <text
              x={320}
              y={188}
              textAnchor="middle"
              fill="#a5b4fc"
              fontSize={8}
            >
              Ingress Rules
            </text>
            <text
              x={320}
              y={202}
              textAnchor="middle"
              fill="#64748b"
              fontSize={7}
            >
              host: api.example.com
            </text>
            <text
              x={320}
              y={214}
              textAnchor="middle"
              fill="#64748b"
              fontSize={7}
            >
              path: /v1/*
            </text>

            {/* API Server connection to Ingress Rules */}
            <Arrow
              id="ing-rules"
              x1={320}
              y1={168}
              x2={320}
              y2={152}
              isActive={ingressStep >= 1}
            />

            {/* Main flow arrows */}
            <Arrow
              id="ing0"
              x1={102}
              y1={125}
              x2={138}
              y2={125}
              isActive={ingressStep >= 0}
              showPacket={ingressStep === 0}
            />
            <Arrow
              id="ing1"
              x1={232}
              y1={125}
              x2={268}
              y2={125}
              isActive={ingressStep >= 1}
              showPacket={ingressStep === 1}
            />
            <Arrow
              id="ing2"
              x1={372}
              y1={125}
              x2={408}
              y2={125}
              isActive={ingressStep >= 3}
              showPacket={ingressStep === 3}
            />
            <Arrow
              id="ing3"
              x1={497}
              y1={110}
              x2={533}
              y2={102}
              isActive={ingressStep >= 4}
              showPacket={ingressStep === 4}
            />
            <Arrow
              id="ing4"
              x1={612}
              y1={102}
              x2={638}
              y2={75}
              isActive={ingressStep >= 5}
              showPacket={ingressStep === 5}
            />

            {/* Bypass label */}
            {ingressStep >= 5 && (
              <text
                x={580}
                y={55}
                textAnchor="middle"
                fill="#22c55e"
                fontSize={7}
              >
                Direct to Pod IP!
              </text>
            )}
          </svg>
        </div>
      </div>

      {/* Description Panel */}
      <div
        key={ingressStep}
        className="animate-fade-in-up bg-slate-800 rounded-xl p-3 sm:p-4 border-l-4 border-orange-500"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
          <span className="bg-orange-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
            Step {ingressStep + 1}/{ingressSteps.length}
          </span>
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            {step.label}
          </h3>
        </div>
        <p className="text-slate-400 text-[10px] sm:text-xs">
          {step.description}
        </p>
      </div>

      {/* Step Navigation Tabs */}
      <div
        className="flex gap-1"
        role="tablist"
        aria-label="Ingress step navigation"
      >
        {ingressSteps.map((_, i) => (
          <button
            key={i}
            onClick={() => setIngressStep(i)}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i === ingressStep
                ? "h-2 bg-orange-500"
                : i < ingressStep
                  ? "h-1.5 bg-orange-800"
                  : "h-1.5 bg-slate-700"
            }`}
            role="tab"
            aria-selected={i === ingressStep}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Key Insight */}
      <div className="bg-slate-900 rounded-lg p-3 sm:p-4 border border-slate-800">
        <h3 className="font-bold text-xs sm:text-sm mb-2 text-orange-400">
          Key Insight: Ingress Controller &ne; kube-proxy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
          <div className="bg-slate-800 p-2.5 sm:p-3 rounded">
            <div className="text-purple-400 font-semibold mb-1">
              Ingress Controller
            </div>
            <p className="text-slate-400">
              L7 proxy (HTTP). Reads Ingress resources from API server. Routes
              by Host/Path headers. Connects directly to Pod IPs.
            </p>
          </div>
          <div className="bg-slate-800 p-2.5 sm:p-3 rounded">
            <div className="text-blue-400 font-semibold mb-1">kube-proxy</div>
            <p className="text-slate-400">
              L4 (TCP/UDP). Programs iptables/IPVS on every node. Routes
              ClusterIP &rarr; Pod IPs. No HTTP awareness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
