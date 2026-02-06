import { componentDetails } from "../../../data/components";

interface ComponentDetailPanelProps {
  componentId: string;
  failureMode: boolean;
  onClose: () => void;
  onAiExplain: (componentName: string) => void;
  aiResponse: string | null;
  isAiLoading: boolean;
  aiError: string | null;
  onClearAi: () => void;
}

export default function ComponentDetailPanel({
  componentId,
  failureMode,
  onClose,
  onAiExplain,
  aiResponse,
  isAiLoading,
  aiError,
  onClearAi,
}: ComponentDetailPanelProps) {
  const detail = componentDetails[componentId];
  if (!detail) return null;

  return (
    <div className="animate-slide-in-right bg-slate-900 rounded-xl border border-slate-800 p-4 relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors text-lg leading-none"
        aria-label="Close detail panel"
      >
        &#x2715;
      </button>

      {/* Header */}
      <h3 className="text-sm sm:text-base font-bold text-blue-400 pr-6">
        {detail.name}
      </h3>
      <p className="text-xs text-emerald-400 mt-0.5 font-medium">
        {detail.role}
      </p>

      {/* Analogy */}
      <div className="mt-3 p-2 bg-slate-800/60 rounded border border-slate-700">
        <p className="text-[11px] text-slate-300 italic">{detail.analogy}</p>
      </div>

      {/* Internals */}
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-1.5">
          Internals
        </h4>
        <ul className="space-y-1">
          {detail.internals.map((item, i) => (
            <li key={i} className="text-[11px] text-slate-300 flex gap-1.5">
              <span className="text-blue-400 shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Data Flow */}
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-1">Data Flow</h4>
        <p className="text-[11px] text-slate-300 font-mono bg-slate-800/40 p-1.5 rounded">
          {detail.flow}
        </p>
      </div>

      {/* Failure Info (only in failure mode) */}
      {failureMode && detail.failure && (
        <div className="mt-3 p-2 bg-red-950/40 rounded border border-red-900/50">
          <h4 className="text-xs font-semibold text-red-400 mb-1.5">
            Failure Analysis
          </h4>
          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-red-400 font-medium">Symptom: </span>
              <span className="text-slate-300">{detail.failure.symptom}</span>
            </div>
            <div>
              <span className="text-red-400 font-medium">Impact: </span>
              <span className="text-slate-300">{detail.failure.impact}</span>
            </div>
            <div>
              <span className="text-red-400 font-medium">Check: </span>
              <span className="text-slate-300 font-mono text-[10px]">
                {detail.failure.check}
              </span>
            </div>
            <div>
              <span className="text-red-400 font-medium">Recovery: </span>
              <span className="text-slate-300">{detail.failure.recovery}</span>
            </div>
          </div>
        </div>
      )}

      {/* YAML Fields */}
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-slate-400 mb-1">
          YAML Fields
        </h4>
        <div className="flex flex-wrap gap-1">
          {detail.yamlFields.map((field) => (
            <span
              key={field}
              className="px-1.5 py-0.5 bg-purple-900/40 border border-purple-800/50 rounded text-[10px] text-purple-300 font-mono"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      {/* AI Explain */}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <button
          onClick={() => onAiExplain(detail.name)}
          disabled={isAiLoading}
          className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-wait text-xs font-medium rounded transition-colors"
        >
          {isAiLoading ? "Thinking..." : `Explain ${detail.name} with AI`}
        </button>

        {/* AI Loading Spinner */}
        {isAiLoading && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
            <span>Generating explanation...</span>
          </div>
        )}

        {/* AI Response */}
        {aiResponse && (
          <div className="animate-fade-in-up mt-2 p-2 bg-indigo-950/30 border border-indigo-900/50 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-indigo-400 font-medium">
                AI Explanation
              </span>
              <button
                onClick={onClearAi}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiResponse}
            </p>
          </div>
        )}

        {/* AI Error */}
        {aiError && (
          <div className="mt-2 p-2 bg-red-950/30 border border-red-900/50 rounded">
            <p className="text-[11px] text-red-400">{aiError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
