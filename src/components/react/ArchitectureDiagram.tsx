import { useState, useEffect, useCallback } from "react";
import SvgCanvas from "./architecture/SvgCanvas";
import ComponentDetailPanel from "./architecture/ComponentDetailPanel";
import TrafficSimulator, { simSteps } from "./architecture/TrafficSimulator";
import { yamlFieldMapping, sampleDeploymentYaml } from "../../data/components";

export default function ArchitectureDiagram() {
  // Component selection state
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null,
  );
  const [failedComponent, setFailedComponent] = useState<string | null>(null);
  const [failureMode, setFailureMode] = useState(false);
  const [showScaleNotes, setShowScaleNotes] = useState(false);

  // Simulation state
  const [simStep, setSimStep] = useState(-1);
  const [isSimulating, setIsSimulating] = useState(false);

  // YAML panel state
  const [showYamlPanel, setShowYamlPanel] = useState(false);
  const [selectedYamlField, setSelectedYamlField] = useState<string | null>(
    null,
  );

  // AI state
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Derived: YAML-highlighted component
  const yamlHighlightedComponent = selectedYamlField
    ? (yamlFieldMapping[selectedYamlField]?.component ?? null)
    : null;

  // Component click handler
  const handleComponentClick = useCallback(
    (id: string) => {
      if (failureMode) {
        setFailedComponent((prev) => (prev === id ? null : id));
        setSelectedComponent(id);
      } else {
        setSelectedComponent((prev) => (prev === id ? null : id));
      }
      // Clear AI state on new selection
      setAiResponse(null);
      setAiError(null);
    },
    [failureMode],
  );

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedComponent(null);
    setFailedComponent(null);
    setAiResponse(null);
    setAiError(null);
  }, []);

  // Escape key handler via custom event
  useEffect(() => {
    const handleEscape = () => {
      setSelectedComponent(null);
      setFailedComponent(null);
      setSelectedYamlField(null);
      setAiResponse(null);
      setAiError(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleEscape();
      }
    };

    document.addEventListener("k8s:escape", handleEscape);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("k8s:escape", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Simulation auto-advance effect
  useEffect(() => {
    if (!isSimulating || simStep < 0) return;

    if (simStep >= simSteps.length - 1) {
      setIsSimulating(false);
      return;
    }

    const timer = setTimeout(() => {
      setSimStep((prev) => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSimulating, simStep]);

  // Simulation controls
  const handleSimPlay = () => {
    if (simStep < 0) {
      setSimStep(0);
    }
    setIsSimulating(true);
  };

  const handleSimPause = () => {
    setIsSimulating(false);
  };

  const handleSimNext = () => {
    setIsSimulating(false);
    setSimStep((prev) => Math.min(prev + 1, simSteps.length - 1));
  };

  const handleSimPrev = () => {
    setIsSimulating(false);
    setSimStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSimReset = () => {
    setIsSimulating(false);
    setSimStep(-1);
  };

  // AI explain function
  const handleAiExplain = async (componentName: string) => {
    const apiKey = import.meta.env.PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setAiError(
        "No API key configured. Set PUBLIC_GEMINI_API_KEY in your .env file.",
      );
      return;
    }

    setIsAiLoading(true);
    setAiResponse(null);
    setAiError(null);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Explain the Kubernetes component "${componentName}" in 3-4 concise sentences for someone learning Kubernetes. Focus on what it does, why it matters, and one practical tip. Keep it under 150 words.`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiResponse(text);
      } else {
        setAiError("No response generated. Try again.");
      }
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Failed to get AI response",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear AI state
  const handleClearAi = () => {
    setAiResponse(null);
    setAiError(null);
  };

  // YAML field click
  const handleYamlFieldClick = (field: string) => {
    setSelectedYamlField((prev) => (prev === field ? null : field));
  };

  // Parse YAML lines for clickable fields
  const yamlLines = sampleDeploymentYaml.split("\n");

  // Match a YAML line to a known field
  const getFieldForLine = (line: string): string | null => {
    const trimmed = line.trimStart();
    for (const field of Object.keys(yamlFieldMapping)) {
      const parts = field.split(".");
      const lastPart = parts[parts.length - 1].replace("[]", "");
      if (
        trimmed.startsWith(lastPart + ":") ||
        trimmed.startsWith("- " + lastPart + ":")
      ) {
        return field;
      }
    }
    return null;
  };

  return (
    <div>
      {/* Controls Row */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 mb-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-300">
            Click component for details
          </h2>
          <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={showScaleNotes}
              onChange={(e) => setShowScaleNotes(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-blue-500 w-3 h-3"
              aria-label="Show scale notes"
            />
            <span className="text-slate-400">Scale</span>
          </label>
          <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={failureMode}
              onChange={(e) => {
                setFailureMode(e.target.checked);
                setFailedComponent(null);
                setSelectedComponent(null);
              }}
              className="rounded bg-slate-700 border-slate-600 text-red-500 w-3 h-3"
              aria-label="Enable failure mode"
            />
            <span className="text-red-400">Failure</span>
          </label>
          <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={showYamlPanel}
              onChange={(e) => {
                setShowYamlPanel(e.target.checked);
                setSelectedYamlField(null);
              }}
              className="rounded bg-slate-700 border-slate-600 text-purple-500 w-3 h-3"
              aria-label="Show YAML mapping panel"
            />
            <span className="text-purple-400">YAML Map</span>
          </label>
        </div>

        {failureMode && (
          <div className="mt-2 p-2 bg-red-950/50 border border-red-900 rounded text-[10px] sm:text-xs text-red-300">
            Click a component to see failure impact
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* SVG Canvas + Simulator */}
        <div className={selectedComponent ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto">
            <SvgCanvas
              selectedComponent={selectedComponent}
              failedComponent={failedComponent}
              failureMode={failureMode}
              showScaleNotes={showScaleNotes}
              yamlHighlightedComponent={yamlHighlightedComponent}
              simStep={simStep}
              onComponentClick={handleComponentClick}
            />
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Esc to clear -- Click components for details
            </p>
          </div>

          {/* Traffic Simulator */}
          <TrafficSimulator
            simStep={simStep}
            isSimulating={isSimulating}
            onPlay={handleSimPlay}
            onPause={handleSimPause}
            onNext={handleSimNext}
            onPrev={handleSimPrev}
            onReset={handleSimReset}
          />
        </div>

        {/* Detail Panel */}
        {selectedComponent && (
          <div className="xl:col-span-1">
            <ComponentDetailPanel
              componentId={
                failureMode && failedComponent
                  ? failedComponent
                  : selectedComponent
              }
              failureMode={failureMode}
              onClose={handleCloseDetail}
              onAiExplain={handleAiExplain}
              aiResponse={aiResponse}
              isAiLoading={isAiLoading}
              aiError={aiError}
              onClearAi={handleClearAi}
            />
          </div>
        )}
      </div>

      {/* YAML Mapping Panel */}
      {showYamlPanel && (
        <div className="mt-3 sm:mt-4 bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-purple-400">
              YAML to Component Mapping
            </h3>
            <span className="text-[10px] sm:text-xs text-slate-500">
              Click a field to highlight which component handles it
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* YAML code */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-[11px] overflow-x-auto">
              {yamlLines.map((line, i) => {
                const field = getFieldForLine(line);
                const isHighlighted = field === selectedYamlField;
                return (
                  <div
                    key={i}
                    onClick={() => field && handleYamlFieldClick(field)}
                    className={`px-1 py-0.5 rounded-sm transition-colors ${
                      field ? "cursor-pointer hover:bg-purple-900/20" : ""
                    } ${isHighlighted ? "bg-purple-900/30 border-l-2 border-purple-500" : ""}`}
                  >
                    <span className="text-slate-600 select-none mr-2 inline-block w-4 text-right">
                      {i + 1}
                    </span>
                    <span
                      className={field ? "text-purple-300" : "text-slate-400"}
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Field explanation */}
            <div className="space-y-2">
              {selectedYamlField && yamlFieldMapping[selectedYamlField] ? (
                <div className="p-3 bg-purple-950/30 border border-purple-900/50 rounded-lg">
                  <h4 className="text-xs font-bold text-purple-300 mb-1">
                    {selectedYamlField}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {yamlFieldMapping[selectedYamlField].desc}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Handled by:{" "}
                    <span className="text-purple-400 font-medium">
                      {yamlFieldMapping[selectedYamlField].component}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <p className="text-[11px] text-slate-500">
                    Click a highlighted YAML field on the left to see which
                    Kubernetes component processes it and why.
                  </p>
                </div>
              )}

              {/* All field mappings */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {Object.entries(yamlFieldMapping).map(([field, mapping]) => (
                  <button
                    key={field}
                    onClick={() => handleYamlFieldClick(field)}
                    className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                      selectedYamlField === field
                        ? "bg-purple-900/40 border border-purple-700"
                        : "bg-slate-800/40 hover:bg-slate-800/70 border border-transparent"
                    }`}
                  >
                    <span className="text-purple-300 font-mono">{field}</span>
                    <span className="text-slate-500 ml-1.5">
                      ({mapping.component})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
