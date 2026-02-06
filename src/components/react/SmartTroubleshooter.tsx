import { useState } from "react";

const GEMINI_API_KEY = import.meta.env.PUBLIC_GEMINI_API_KEY;

async function callGemini(query: string, attempt = 0): Promise<string> {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000];

  const prompt = `You are a Kubernetes troubleshooting expert. A user reports: ${query}. Provide: 1. Most Likely Cause (one sentence) 2. Diagnostic Commands (2-3 kubectl commands) 3. Quick Fix (max 4 steps) 4. Prevention Tip. Be concise, use markdown.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`API returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (err) {
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
      return callGemini(query, attempt + 1);
    }
    throw err;
  }
}

function formatResponse(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Headings (## or bold **)
    if (line.startsWith("## ") || line.startsWith("### ")) {
      const content = line.replace(/^#{2,3}\s*/, "");
      return (
        <h4 key={i} className="text-sm font-bold text-blue-400 mt-3 mb-1">
          {content}
        </h4>
      );
    }
    // Bold lines like **Something**
    if (/^\*\*(.+)\*\*$/.test(line.trim())) {
      const match = line.trim().match(/^\*\*(.+)\*\*$/);
      return (
        <h4 key={i} className="text-sm font-bold text-blue-400 mt-3 mb-1">
          {match?.[1]}
        </h4>
      );
    }
    // Inline code blocks
    if (line.trim().startsWith("```")) {
      return null; // skip fence markers
    }
    // Code lines (indented or within block)
    if (line.trim().startsWith("kubectl") || line.trim().startsWith("$ ")) {
      return (
        <code
          key={i}
          className="block bg-slate-900 text-emerald-400 px-3 py-1.5 rounded font-mono text-xs my-1"
        >
          {line.trim().replace(/^[$]\s*/, "")}
        </code>
      );
    }
    // Numbered list items
    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <p key={i} className="text-slate-300 text-xs ml-2 my-0.5">
          {line.trim()}
        </p>
      );
    }
    // Bullet list items
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <p key={i} className="text-slate-300 text-xs ml-2 my-0.5">
          {line.trim()}
        </p>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} className="h-1" />;
    // Regular text - handle inline code and bold
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-slate-300 text-xs my-0.5">
        {parts.map((part, j) => {
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={j}
                className="bg-slate-900 text-emerald-400 px-1 rounded font-mono text-xs"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-white font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function SmartTroubleshooter() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDiagnose = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const result = await callGemini(query.trim());
      setResponse(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get AI diagnosis",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResponse("");
    setError("");
  };

  if (!GEMINI_API_KEY) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#x1F916;</span>
          <h3 className="text-sm font-bold text-purple-300">
            Smart Troubleshooter (AI)
          </h3>
        </div>
        <p className="text-amber-400 text-sm bg-amber-900/20 border border-amber-700/50 rounded-lg px-4 py-3">
          Add PUBLIC_GEMINI_API_KEY to enable AI diagnosis
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">&#x1F916;</span>
        <h3 className="text-sm font-bold text-purple-300">
          Smart Troubleshooter (AI)
        </h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleDiagnose()}
          placeholder="Describe your Kubernetes issue..."
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Describe your Kubernetes issue"
        />
        <button
          onClick={handleDiagnose}
          disabled={isLoading || !query.trim()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Diagnose"
          )}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-3 text-slate-400 text-sm">
          <svg
            className="animate-spin h-5 w-5 text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Diagnosing your issue...
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-red-400">Error</span>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white text-xs"
              aria-label="Close error"
            >
              Close
            </button>
          </div>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Response display */}
      {response && (
        <div className="mt-4 p-4 bg-slate-900/80 border border-purple-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-400">
              AI Diagnosis
            </span>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white text-sm px-2 py-0.5 rounded hover:bg-slate-700 transition-colors"
              aria-label="Close response"
            >
              Close
            </button>
          </div>
          <div className="leading-relaxed">{formatResponse(response)}</div>
        </div>
      )}
    </div>
  );
}
