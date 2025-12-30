// ============================================================================
// AI FEATURES PATCH - Add to K8sDeepDive.jsx
// This file contains all AI-related code to merge into the main component
// ============================================================================

// =============================================
// STEP 1: Add these STATE VARIABLES after other state declarations
// =============================================

// AI Integration State
const [aiResponse, setAiResponse] = useState(null);
const [isAiLoading, setIsAiLoading] = useState(false);
const [aiError, setAiError] = useState(null);
const [troubleshootQuery, setTroubleshootQuery] = useState("");

// API Key - configure via environment variable or secrets manager
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// =============================================
// STEP 2: Add this FUNCTION after state declarations
// =============================================

/**
 * Call Gemini API with exponential backoff retry
 * @param {string} prompt - The prompt to send to Gemini
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<string>} - The AI response text
 */
const callGemini = async (prompt, maxRetries = 3) => {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};


// =============================================
// STEP 3: Add this HANDLER for AI component explanation
// =============================================

const handleAiExplain = async (componentId) => {
  const component = componentDetails[componentId];
  if (!component) return;

  setIsAiLoading(true);
  setAiError(null);
  setAiResponse(null);

  const prompt = `You are a Kubernetes expert teacher. Explain the ${component.name} component.
Context: Role: ${component.role}, Analogy: ${component.analogy}
Please provide: 1. A beginner-friendly explanation (2-3 sentences)
2. One real-world production insight 3. A common gotcha to avoid. Keep it concise.`;

  try {
    const response = await callGemini(prompt);
    setAiResponse(response);
  } catch (error) {
    setAiError(error.message);
  } finally {
    setIsAiLoading(false);
  }
};

// =============================================
// STEP 4: Add this HANDLER for Smart Troubleshooter
// =============================================

const handleSmartTroubleshoot = async (query) => {
  if (!query.trim()) return;
  setIsAiLoading(true);
  setAiError(null);
  setAiResponse(null);

  const prompt = `You are a Kubernetes troubleshooting expert. Issue: "${query}"
Provide: 1. **Most Likely Cause** 2. **Diagnostic Commands** (2-3 kubectl commands)
3. **Quick Fix** (steps) 4. **Prevention Tip**. Be concise, use markdown.`;

  try {
    const response = await callGemini(prompt);
    setAiResponse(response);
  } catch (error) {
    setAiError(error.message);
  } finally {
    setIsAiLoading(false);
  }
};


// =============================================
// STEP 5: UI COMPONENTS
// =============================================

const AiExplainButton = ({ componentId }) => (
  <button
    onClick={() => handleAiExplain(componentId)}
    disabled={isAiLoading || !GEMINI_API_KEY}
    className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-xs rounded-lg flex items-center gap-2"
  >
    {isAiLoading ? 'Thinking...' : '⚡ AI Explain'}
  </button>
);

const AiResponsePanel = () => {
  if (!aiResponse && !aiError) return null;
  return (
    <div className={`mt-3 p-3 rounded-lg border ${aiError ? 'bg-red-900/30 border-red-700' : 'bg-purple-900/30 border-purple-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${aiError ? 'text-red-400' : 'text-purple-400'}`}>
          {aiError ? '❌ AI Error' : '💡 AI Insight'}
        </span>
        <button onClick={() => { setAiResponse(null); setAiError(null); }} className="text-slate-400 hover:text-white text-xs">✕</button>
      </div>
      <div className={`text-xs ${aiError ? 'text-red-300' : 'text-slate-300'} whitespace-pre-wrap`}>
        {aiError || aiResponse}
      </div>
    </div>
  );
};


const SmartTroubleshooter = () => (
  <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-700/50 p-4 mb-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-purple-400">💡</span>
      <h3 className="text-sm font-bold text-purple-300">Smart Troubleshooter (AI)</h3>
      {!GEMINI_API_KEY && <span className="text-[10px] text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">API key required</span>}
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        value={troubleshootQuery}
        onChange={(e) => setTroubleshootQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSmartTroubleshoot(troubleshootQuery)}
        placeholder="Describe your Kubernetes issue..."
        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        disabled={!GEMINI_API_KEY}
      />
      <button
        onClick={() => handleSmartTroubleshoot(troubleshootQuery)}
        disabled={isAiLoading || !troubleshootQuery.trim() || !GEMINI_API_KEY}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg"
      >
        {isAiLoading ? 'Analyzing...' : 'Diagnose'}
      </button>
    </div>
    <AiResponsePanel />
  </div>
);


// =============================================
// NODE GRID VISUALIZER - Add to Scheduler view
// =============================================

const NodeGridVisualizer = ({ schedulerStep }) => {
  const nodes = [
    { id: 1, name: 'node-1', cpu: 85, memory: 70, taints: ['dedicated=ml'] },
    { id: 2, name: 'node-2', cpu: 45, memory: 60, taints: [] },
    { id: 3, name: 'node-3', cpu: 30, memory: 40, taints: [] },
    { id: 4, name: 'node-4', cpu: 95, memory: 90, taints: [] },
    { id: 5, name: 'node-5', cpu: 55, memory: 50, taints: [] },
    { id: 6, name: 'node-6', cpu: 20, memory: 30, taints: [] },
    { id: 7, name: 'node-7', cpu: 15, memory: 25, taints: [] },
    { id: 8, name: 'node-8', cpu: 75, memory: 80, taints: ['zone=us-west'] },
  ];

  const getNodeStatus = (node, step) => {
    if (step <= 2) return 'candidate';
    if (step === 3 && node.taints.length > 0) return 'filtered';
    if (step === 4 && (node.cpu > 80 || node.memory > 80)) return 'filtered';
    if (step >= 5 && (node.taints.length > 0 || node.cpu > 80 || node.memory > 80)) return 'filtered';
    if (step === 6 && node.id === 7) return 'selected';
    return 'candidate';
  };

  const colors = {
    candidate: 'bg-slate-700 border-slate-600',
    filtered: 'bg-red-900/30 border-red-800/50 opacity-50',
    selected: 'bg-green-600 border-green-500 ring-2 ring-green-400',
  };


  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mt-4">
      <h3 className="text-sm font-bold mb-3">🖥️ Node Grid (Live Filter/Score)</h3>
      <div className="grid grid-cols-4 gap-2">
        {nodes.map(node => {
          const status = getNodeStatus(node, schedulerStep);
          return (
            <div key={node.id} className={`p-2 rounded-lg border transition-all duration-300 ${colors[status]}`}>
              <div className="text-[10px] font-mono text-slate-300">{node.name}</div>
              <div className="flex gap-2 mt-1">
                <div className="text-[9px] text-blue-400">CPU: {node.cpu}%</div>
                <div className="text-[9px] text-purple-400">Mem: {node.memory}%</div>
              </div>
              {node.taints.length > 0 && <div className="text-[8px] text-amber-400 mt-1">⚠ {node.taints[0]}</div>}
              {status === 'selected' && <div className="text-[9px] text-green-300 font-bold mt-1">✓ SELECTED</div>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
        <span>⬜ Candidate</span>
        <span>🟥 Filtered</span>
        <span>🟩 Selected</span>
      </div>
    </div>
  );
};

// =============================================
// SETUP: Create .env file with:
// VITE_GEMINI_API_KEY=your_api_key_here
// Get key from: https://makersuite.google.com/app/apikey
// =============================================
