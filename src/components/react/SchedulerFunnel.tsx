import { useState, useEffect, useCallback } from "react";
import { schedulerSteps } from "../../data/scheduler-steps";

export default function SchedulerFunnel() {
  const [schedulerStep, setSchedulerStep] = useState(0);

  // Smooth description transitions
  const [displayedStep, setDisplayedStep] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const maxStep = schedulerSteps.length - 1;

  const nextStep = useCallback(
    () => setSchedulerStep((s) => Math.min(maxStep, s + 1)),
    [maxStep],
  );
  const prevStep = useCallback(
    () => setSchedulerStep((s) => Math.max(0, s - 1)),
    [],
  );
  const reset = useCallback(() => setSchedulerStep(0), []);

  // Description crossfade
  useEffect(() => {
    if (schedulerStep !== displayedStep) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedStep(schedulerStep);
        setTransitioning(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [schedulerStep, displayedStep]);

  // Keyboard handling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextStep();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        prevStep();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextStep, prevStep]);

  const step = schedulerSteps[schedulerStep];
  const displayStep = schedulerSteps[displayedStep];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
      {/* Left Panel - Step List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Scheduler Funnel
          </h2>
          <button
            onClick={reset}
            className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs bg-slate-800 hover:bg-slate-700 rounded text-white"
            aria-label="Reset scheduler funnel"
          >
            Reset
          </button>
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs mb-3 sm:mb-4">
          filter &rarr; score &rarr; bind
        </p>

        <div
          className="space-y-1.5"
          role="list"
          aria-label="Scheduler filtering steps"
        >
          {schedulerSteps.map((s, i) => (
            <button
              key={i}
              onClick={() => setSchedulerStep(i)}
              className={`w-full text-left p-2 sm:p-2.5 rounded-lg border transition-all duration-200 ${
                schedulerStep === i
                  ? "bg-blue-600/20 border-blue-500 border-l-2 border-l-blue-400 translate-x-1"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
              role="listitem"
              aria-label={`${s.label}, ${s.count} nodes remaining`}
              aria-current={schedulerStep === i ? "step" : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[10px] sm:text-xs text-white">
                  {s.label}
                </span>
                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono text-white ${
                    s.count === 1 ? "bg-emerald-600" : "bg-slate-700"
                  }`}
                  aria-label={`${s.count} nodes`}
                >
                  {s.count}
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[9px] sm:text-[10px] text-slate-600 mt-3 text-center">
          &uarr; &darr; to navigate
        </p>
      </div>

      {/* Right Panel - Grid + Info */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
        {/* Step description - smooth crossfade */}
        <div
          className="mb-3 sm:mb-4 min-h-[52px]"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(4px)" : "translateY(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
        >
          <h3 className="text-xs sm:text-sm font-bold mb-1 text-white">
            {displayStep.label}
          </h3>
          <p className="text-slate-400 text-[10px] sm:text-xs">
            {displayStep.description}
          </p>
          <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5">
            {displayStep.detail}
          </p>
        </div>

        {/* Node Grid - 10x10 */}
        <div className="mb-3 sm:mb-4">
          <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
            Node Pool (100)
          </div>
          <div className="grid grid-cols-10 gap-0.5 sm:gap-1 p-1.5 sm:p-2 bg-slate-800/50 rounded-lg">
            {Array.from({ length: 100 }).map((_, i) => {
              const isEligible = i < step.count;
              const isWinner = schedulerStep === maxStep && i === 0;
              const row = Math.floor(i / 10);
              const col = i % 10;
              const staggerDelay = (row * 10 + col) * 8;
              return (
                <div
                  key={i}
                  className={`w-full pt-[100%] rounded-sm transition-all duration-300 ${
                    isWinner
                      ? "animate-scale-pop bg-emerald-500 z-10 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      : isEligible
                        ? "bg-blue-500/70"
                        : "bg-red-900/20"
                  }`}
                  style={{ transitionDelay: `${staggerDelay}ms` }}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-[9px] sm:text-[10px] text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500/70 rounded-sm" /> Eligible
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-900/20 rounded-sm" /> Eliminated
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-sm" /> Winner
            </span>
          </div>
        </div>

        {/* Insight - smooth crossfade */}
        <div
          className="p-2.5 sm:p-3 bg-slate-800 rounded-lg min-h-[48px]"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(4px)" : "translateY(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
        >
          <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Insight
          </div>
          <p className="text-slate-300 text-[10px] sm:text-xs">
            {displayedStep < 5
              ? "Filtering is elimination. Every predicate must pass."
              : displayedStep === 5
                ? "Anti-affinity prevents co-location with matching pods."
                : "Scoring ranks survivors. Weighted plugins sum to final score."}
          </p>
        </div>
      </div>
    </div>
  );
}
