export const simSteps = [
  {
    arrow: "api-kubelet",
    label: "REST request received",
    desc: "kubectl sends a REST request to the API Server",
  },
  {
    arrow: "api-etcd",
    label: "Persist desired state",
    desc: "API Server validates and stores the object in etcd",
  },
  {
    arrow: "api-sched",
    label: "Watch: unscheduled pod",
    desc: "Scheduler watches for pods with no node assignment",
  },
  {
    arrow: "api-sched",
    label: "Bind pod to node",
    desc: "Scheduler scores nodes and writes binding back to API Server",
  },
  {
    arrow: "api-kubelet",
    label: "Watch: pod assigned",
    desc: "kubelet watches for pods assigned to its node",
  },
  {
    arrow: "kubelet-runtime",
    label: "CRI: create container",
    desc: "kubelet instructs containerd to pull image and start container",
  },
  {
    arrow: "runtime-pods",
    label: "Container running",
    desc: "Container starts, readiness probe passes, pod becomes Ready",
  },
];

interface TrafficSimulatorProps {
  simStep: number;
  isSimulating: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}

export default function TrafficSimulator({
  simStep,
  isSimulating,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
}: TrafficSimulatorProps) {
  const isActive = simStep >= 0;
  const currentStep = isActive ? simSteps[simStep] : null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 mt-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-emerald-400">
          Traffic Simulator
        </h3>
        {isActive && (
          <span className="text-xs text-slate-400 font-mono">
            Step {simStep + 1} / {simSteps.length}
          </span>
        )}
      </div>

      {/* Step description */}
      {currentStep && (
        <div
          key={simStep}
          className="animate-fade-in mb-3 p-2 bg-slate-800/60 rounded border border-slate-700"
        >
          <p className="text-xs font-semibold text-emerald-300">
            {currentStep.label}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {currentStep.desc}
          </p>
        </div>
      )}

      {!isActive && (
        <p className="text-[11px] text-slate-500 mb-3">
          Trace a pod creation request through every component step-by-step.
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isActive ? (
          <button
            onClick={onPlay}
            className="animate-scale-pop px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded transition-colors"
          >
            Start Simulation
          </button>
        ) : (
          <>
            <button
              onClick={onPrev}
              disabled={simStep <= 0}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium rounded transition-colors"
              aria-label="Previous step"
            >
              Prev
            </button>

            {isSimulating ? (
              <button
                onClick={onPause}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs font-medium rounded transition-colors"
                aria-label="Pause simulation"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium rounded transition-colors"
                aria-label="Play simulation"
              >
                Play
              </button>
            )}

            <button
              onClick={onNext}
              disabled={simStep >= simSteps.length - 1}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium rounded transition-colors"
              aria-label="Next step"
            >
              Next
            </button>

            <button
              onClick={onReset}
              className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 text-xs font-medium rounded transition-colors ml-auto"
              aria-label="Reset simulation"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
