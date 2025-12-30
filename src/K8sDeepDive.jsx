import React, { useState, useEffect } from 'react';

// Get API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function K8sDeepDive() {
  const [activeView, setActiveView] = useState('architecture');
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  // Flow Animation State
  const [flowStep, setFlowStep] = useState(0);
  const [isFlowPlaying, setIsFlowPlaying] = useState(false);
  
  // Scheduler State
  const [schedulerStep, setSchedulerStep] = useState(0);
  
  // Settings & Modes
  const [showScaleNotes, setShowScaleNotes] = useState(false);
  const [failureMode, setFailureMode] = useState(false);
  const [failedComponent, setFailedComponent] = useState(null);
  const [trafficSimulation, setTrafficSimulation] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");

  // AI Integration State
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [troubleshootQuery, setTroubleshootQuery] = useState("");

  // Quiz State
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Set page title
  useEffect(() => {
    document.title = "Kubernetes Internals — Interactive Deep Dive";
  }, []);

  // Clear AI response when component changes
  useEffect(() => {
    setAiResponse(null);
    setAiError(null);
  }, [selectedComponent]);

  // Gemini API Caller
  const callGemini = async (prompt) => {
    if (!GEMINI_API_KEY) {
      setAiError("Add VITE_GEMINI_API_KEY to your .env file");
      return;
    }
    
    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    let retries = 0;
    let success = false;

    while (retries <= 3 && !success) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            throw new Error(`Retryable error: ${response.status}`);
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.");
        success = true;
      } catch (e) {
        retries++;
        if (retries > 3) {
          setAiError(e.message || "Failed to connect to AI. Please try again.");
        } else {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
      }
    }
    setIsAiLoading(false);
  };

  const handleAiComponentQuery = () => {
    if (!selectedComponent) return;
    const comp = componentDetails[selectedComponent];
    const prompt = `You are a Kubernetes Senior Engineer. Explain the internal workings of the "${comp.name}" component (${comp.role}). 
    Focus on its relationship with the API Server and how it handles failure. 
    Explain it simply but technically for a DevOps engineer. Keep it under 100 words.`;
    callGemini(prompt);
  };

  const handleAiTroubleshoot = () => {
    if (!troubleshootQuery) return;
    const prompt = `You are a Kubernetes Expert. A user is reporting this issue: "${troubleshootQuery}".
    Provide a concise technical diagnosis and a list of 3 specific 'kubectl' commands to investigate or fix it. 
    Format the output with Markdown, putting commands in code blocks.`;
    callGemini(prompt);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (activeView === 'flow') {
        if (e.key === 'ArrowRight') setFlowStep(s => Math.min(7, s + 1));
        if (e.key === 'ArrowLeft') setFlowStep(s => Math.max(0, s - 1));
        if (e.key === ' ') { e.preventDefault(); setIsFlowPlaying(p => !p); }
      }
      if (activeView === 'scheduler') {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSchedulerStep(s => Math.min(6, s + 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSchedulerStep(s => Math.max(0, s - 1)); }
      }
      if (e.key === 'Escape') {
        setSelectedComponent(null);
        setFailedComponent(null);
        setTrafficSimulation(false);
        setSimulationStatus("");
      }
      if (e.key === '1') { setActiveView('architecture'); resetAll(); }
      if (e.key === '2') { setActiveView('flow'); resetAll(); }
      if (e.key === '3') { setActiveView('scheduler'); resetAll(); }
      if (e.key === '4') { setActiveView('networking'); resetAll(); }
      if (e.key === '5') { setActiveView('troubleshooting'); resetAll(); }
      if (e.key === '6') { setActiveView('quiz'); resetAll(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeView]);

  // Auto-advance flow animation
  useEffect(() => {
    if (isFlowPlaying && flowStep < 7) {
      const timer = setTimeout(() => setFlowStep(f => f + 1), 2000);
      return () => clearTimeout(timer);
    } else if (flowStep >= 7) {
      setIsFlowPlaying(false);
    }
  }, [isFlowPlaying, flowStep]);

  // Traffic Simulation Logic
  useEffect(() => {
    if (trafficSimulation) {
      const stages = [
        { t: 0, text: "1. User submits Request (kubectl apply)" },
        { t: 800, text: "2. API Server Validates & Persists to Etcd" },
        { t: 1600, text: "3. Scheduler detects new Pod & Assigns Node" },
        { t: 2400, text: "4. Kubelet receives assignment" },
        { t: 3200, text: "5. Container Runtime pulls image & starts container" },
        { t: 4000, text: "Deployment Complete: Pod Running" }
      ];

      stages.forEach(stage => {
        setTimeout(() => setSimulationStatus(stage.text), stage.t);
      });

      const timer = setTimeout(() => {
        setTrafficSimulation(false);
        setSimulationStatus("");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [trafficSimulation]);

  const resetAll = () => {
    setFlowStep(0);
    setIsFlowPlaying(false);
    setSchedulerStep(0);
    setSelectedComponent(null);
    setFailedComponent(null);
    setTrafficSimulation(false);
    setSimulationStatus("");
    setAiResponse(null);
    setTroubleshootQuery("");
  };

  const componentDetails = {
    apiserver: {
      name: 'kube-apiserver',
      role: 'The Front Door & Traffic Cop',
      analogy: 'The hospital receptionist. Checks ID, validates requests, and updates the database. The ONLY component that talks to Etcd.',
      internals: [
        'Stateless - scales horizontally',
        'Authentication -> Authorization -> Admission Control',
        'Validating & Mutating Webhooks',
        'Serves the REST API'
      ],
      flow: 'User -> Load Balancer -> API Server -> Etcd',
      scaleNote: '⚠️ CPU intensive. Scale horizontally behind a Load Balancer.',
      failure: {
        symptom: 'kubectl commands timeout. Cluster is unmanageable.',
        impact: 'Existing pods run fine, but no updates or new pods possible.',
        check: 'curl -k https://localhost:6443/livez',
        recovery: 'Check system logs, ensure etcd connectivity.'
      }
    },
    etcd: {
      name: 'etcd',
      role: 'The Source of Truth',
      analogy: 'The hospital records room. Highly secure, consistent storage. If this burns down, the cluster has amnesia.',
      internals: [
        'Distributed Key-Value Store',
        'Uses Raft Consensus Algorithm',
        'Stores ALL cluster state',
        'Strong Consistency'
      ],
      flow: 'API Server <-> Etcd (gRPC)',
      scaleNote: '🔴 Disk I/O sensitive. Use SSDs. Max 5 nodes recommended.',
      failure: {
        symptom: 'API Server refuses requests. Cluster frozen.',
        impact: 'CATASTROPHIC. Potential data loss if no backups.',
        check: 'etcdctl endpoint health',
        recovery: 'Restore from snapshot immediately.'
      }
    },
    scheduler: {
      name: 'kube-scheduler',
      role: 'The Assignment Engine',
      analogy: 'The room assigner. Checks which rooms (nodes) have space and meet requirements (constraints) for new patients (pods).',
      internals: [
        'Watches for Pods with empty nodeName',
        'Filtering (Hard Constraints)',
        'Scoring (Soft Constraints)',
        'Binding (API Update)'
      ],
      flow: 'API Server -> Scheduler -> API Server',
      scaleNote: '⚡ Can be a bottleneck for massive pod churn. Tune intervals.',
      failure: {
        symptom: 'Pods remain in "Pending" state forever.',
        impact: 'New workloads do not start.',
        check: 'kubectl get componentstatuses',
        recovery: 'Restart scheduler pod/service.'
      }
    },
    controller: {
      name: 'kube-controller-manager',
      role: 'The Reconciliation Army',
      analogy: 'The maintenance team. Thermostat checks temp (actual) vs setting (desired) and turns on heat. Controller checks pods vs replicas.',
      internals: [
        'Run loop: Observe -> Diff -> Act',
        'ReplicaSet, Node, Endpoint Controllers',
        'Single binary, many loops',
        'Leader Election'
      ],
      flow: 'API Server -> Controller -> API Server',
      scaleNote: '⚙️ Single active leader. Vertical scaling only.',
      failure: {
        symptom: 'Deployments dont scale. Dead nodes not detected.',
        impact: 'Cluster state drifts from desired state.',
        check: 'Check leader election logs.',
        recovery: 'Restart controller manager.'
      }
    },
    kubelet: {
      name: 'kubelet',
      role: 'The Node Captain',
      analogy: 'The floor nurse. Receives orders for patients (pods), ensures they are alive (probes), and reports status back to HQ.',
      internals: [
        'Runs on EVERY node',
        'Registers node with API Server',
        'Pod Lifecycle Manager',
        'Executes Liveness/Readiness Probes'
      ],
      flow: 'API Server -> Kubelet -> Runtime',
      scaleNote: '📊 Heartbeat intervals affect API load. Limit ~110 pods/node.',
      failure: {
        symptom: 'Node status "NotReady". Pods unknown.',
        impact: 'Scheduler stops sending pods to this node.',
        check: 'systemctl status kubelet',
        recovery: 'Check node resources (Disk/RAM), restart service.'
      }
    },
    kubeproxy: {
      name: 'kube-proxy',
      role: 'The Network Plumber',
      analogy: 'The switchboard operator. Ensures network rules exist so traffic to a "Department" (Service) gets to a specific "Phone" (Pod).',
      internals: [
        'Runs on EVERY node',
        'Watches Services & Endpoints',
        'Manages iptables or IPVS rules',
        'Does NOT usually proxy data (in IPVS mode)'
      ],
      flow: 'API Server -> Kube-proxy -> Kernel Network Stack',
      scaleNote: '🚨 Use IPVS mode for clusters with >1000 services.',
      failure: {
        symptom: 'Service IPs unreachable. DNS works, connection fails.',
        impact: 'Internal communication breaks.',
        check: 'iptables -L -n -t nat',
        recovery: 'Restart kube-proxy, flush iptables.'
      }
    },
    runtime: {
      name: 'Container Runtime',
      role: 'The Execution Engine',
      analogy: 'The actual bed/equipment. containerd or CRI-O. It does the heavy lifting of pulling images and running the process.',
      internals: [
        'Implements CRI (Container Runtime Interface)',
        'Pulls OCI Images',
        'Creates Namespaces & Cgroups',
        'Sandboxing'
      ],
      flow: 'Kubelet -> CRI (gRPC) -> Runtime',
      scaleNote: '💾 Image pull speeds depend on disk/network.',
      failure: {
        symptom: 'ContainerCreating errors. ImagePullBackOff.',
        impact: 'Pods fail to start.',
        check: 'crictl ps',
        recovery: 'Prune unused images, restart daemon.'
      }
    }
  };

  const flowSteps = [
    { id: 0, label: 'kubectl apply deployment.yaml', active: ['user'], description: 'You submit a Deployment manifest. kubectl serializes to JSON and sends to API server.' },
    { id: 1, label: 'API Server processes request', active: ['apiserver'], description: 'AuthN (who are you?) → AuthZ (can you do this?) → Admission (modify/validate) → Persist to etcd.' },
    { id: 2, label: 'Deployment Controller reacts', active: ['controller', 'apiserver'], description: 'Deployment controller watches for new Deployments. Sees yours, creates a ReplicaSet.' },
    { id: 3, label: 'ReplicaSet Controller reacts', active: ['controller', 'apiserver'], description: 'ReplicaSet controller sees RS with 0 pods but wants 3. Creates 3 Pod objects (still unscheduled).' },
    { id: 4, label: 'Scheduler assigns nodes', active: ['scheduler', 'apiserver'], description: 'Scheduler finds Pods with no nodeName. Runs filter/score, binds each Pod to a Node.' },
    { id: 5, label: 'Kubelet sees its work', active: ['kubelet', 'apiserver'], description: 'Kubelet on each assigned Node watches for Pods with its nodeName. Sees new work.' },
    { id: 6, label: 'Runtime creates containers', active: ['kubelet', 'runtime'], description: 'Kubelet calls containerd via CRI. Image pulled, container started, probes begin.' },
    { id: 7, label: 'Pod becomes Ready', active: ['kubelet', 'kubeproxy'], description: 'Container passes readiness probe. Kubelet updates status. kube-proxy adds Pod to Service endpoints.' }
  ];

  const schedulerSteps = [
    { label: 'All Nodes', count: 100, description: 'Starting pool of all nodes in cluster', detail: 'Every registered node that is Ready' },
    { label: 'NodeSelector', count: 45, description: 'Filter: node.kubernetes.io/type=compute', detail: 'Hard requirement - must have this label' },
    { label: 'Resources', count: 32, description: 'Filter: Need 2 CPU, 4Gi RAM available', detail: 'Compares requests against allocatable - limits' },
    { label: 'Taints', count: 28, description: 'Filter: Tolerate only monitoring taints', detail: 'NoSchedule taints block without matching tolerations' },
    { label: 'Affinity', count: 12, description: 'Filter: requiredDuringScheduling zone=us-east-1a', detail: 'Required = hard constraint, Preferred = soft' },
    { label: 'Anti-Affinity', count: 8, description: 'Filter: Don\'t colocate with other DB pods', detail: 'podAntiAffinity prevents same-node placement' },
    { label: 'Scoring', count: 1, description: 'Score remaining 8: LeastRequestedPriority wins node-7', detail: 'Multiple scoring plugins weighted and summed' }
  ];

  const quizQuestions = [
    {
      q: "Which component is the only one that communicates directly with etcd?",
      options: ["kube-scheduler", "kube-apiserver", "kubelet", "kube-controller-manager"],
      correct: 1
    },
    {
      q: "If you have 1000 Services, which kube-proxy mode should you use to avoid performance issues?",
      options: ["userspace", "iptables", "IPVS", "ebpf-lite"],
      correct: 2
    },
    {
      q: "Which of the following is NOT a phase in the Pod lifecycle?",
      options: ["Pending", "ContainerCreating", "Running", "Compiling"],
      correct: 3
    },
    {
      q: "What happens if a node has a 'Taint' but a Pod does not have a matching 'Toleration'?",
      options: ["Pod is scheduled but warns", "Pod is rejected from scheduling on that node", "Pod crashes", "Node deletes the Pod"],
      correct: 1
    },
    {
      q: "Which component runs on every worker node and talks to the container runtime?",
      options: ["kube-proxy", "etcd", "kubelet", "Cloud Controller Manager"],
      correct: 2
    }
  ];

  const troubleshootingScenarios = [
    {
      id: 'pending',
      title: 'Pod Stuck in Pending',
      symptom: 'kubectl get pods shows Pending for minutes',
      causes: [
        { cause: 'Insufficient resources', check: 'kubectl describe pod - look for "Insufficient cpu/memory"', fix: 'Scale cluster or reduce requests' },
        { cause: 'Node taints blocking', check: 'kubectl describe pod - look for "node(s) had taints"', fix: 'Add tolerations or untaint nodes' },
        { cause: 'PVC not bound', check: 'kubectl get pvc - check for Pending status', fix: 'Ensure StorageClass exists and provisioner works' },
        { cause: 'Node affinity mismatch', check: 'kubectl describe pod - look for affinity/nodeSelector', fix: 'Label nodes or adjust affinity rules' }
      ]
    },
    {
      id: 'crashloop',
      title: 'CrashLoopBackOff',
      symptom: 'Container starts then immediately dies',
      causes: [
        { cause: 'Application crash', check: 'kubectl logs <pod> --previous', fix: 'Fix application code, check environment variables' },
        { cause: 'Liveness probe too aggressive', check: 'kubectl describe pod - check probe config', fix: 'Increase initialDelaySeconds, timeoutSeconds' },
        { cause: 'Missing config/secrets', check: 'kubectl logs - look for config errors', fix: 'Ensure ConfigMaps/Secrets exist and are mounted' },
        { cause: 'OOMKilled', check: 'kubectl describe pod - look for OOMKilled', fix: 'Increase memory limits or fix memory leak' }
      ]
    },
    {
      id: 'service',
      title: 'Service Unreachable',
      symptom: 'curl to ClusterIP times out',
      causes: [
        { cause: 'No endpoints', check: 'kubectl get endpoints <svc> - empty?', fix: 'Check pod labels match service selector' },
        { cause: 'Pods not ready', check: 'kubectl get pods - all Running but not Ready?', fix: 'Fix readiness probe failures' },
        { cause: 'NetworkPolicy blocking', check: 'kubectl get networkpolicy -A', fix: 'Add ingress rule to allow traffic' },
        { cause: 'kube-proxy not running', check: 'kubectl get pods -n kube-system | grep proxy', fix: 'Restart kube-proxy DaemonSet' }
      ]
    },
    {
      id: 'dns',
      title: 'DNS Resolution Failing',
      symptom: 'nslookup kubernetes.default fails from pod',
      causes: [
        { cause: 'CoreDNS down', check: 'kubectl get pods -n kube-system -l k8s-app=kube-dns', fix: 'Restart CoreDNS, check logs' },
        { cause: 'resolv.conf wrong', check: 'kubectl exec <pod> -- cat /etc/resolv.conf', fix: 'Check kubelet DNS config, dnsPolicy' },
        { cause: 'NetworkPolicy blocking UDP 53', check: 'Check egress NetworkPolicy', fix: 'Allow egress to kube-dns on UDP 53' },
        { cause: 'CoreDNS ConfigMap corrupt', check: 'kubectl get cm coredns -n kube-system -o yaml', fix: 'Restore default Corefile' }
      ]
    }
  ];

  const handleQuizAnswer = (index) => {
    setSelectedAnswer(index);
    if (index === quizQuestions[currentQuestion].correct) {
      setQuizScore(s => s + 1);
    }
    
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(q => q + 1);
      } else {
        setShowQuizResult(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setQuizScore(0);
    setCurrentQuestion(0);
    setShowQuizResult(false);
    setSelectedAnswer(null);
  };

  const Component = ({ id, label, x, y, type = 'control', onClick, isActive, isFailed, showScale }) => (
    <g 
      onClick={() => onClick(id)} 
      style={{ cursor: 'pointer' }}
      className="transition-all duration-300"
      role="button"
      aria-label={`${label} component`}
    >
      <rect
        x={x}
        y={y}
        width={120}
        height={50}
        rx={6}
        fill={isFailed ? '#991b1b' : isActive ? (type === 'control' ? '#3b82f6' : '#10b981') : (type === 'control' ? '#1e3a5f' : '#134e3a')}
        stroke={isFailed ? '#ef4444' : isActive ? '#fff' : (type === 'control' ? '#3b82f6' : '#10b981')}
        strokeWidth={isFailed ? 4 : isActive ? 3 : 2}
        className="transition-all duration-300"
      />
      <text
        x={x + 60}
        y={y + 30}
        textAnchor="middle"
        fill="#fff"
        fontSize={11}
        fontWeight={600}
      >
        {label}
      </text>
      {isActive && !isFailed && (
        <circle cx={x + 110} cy={y + 10} r={6} fill="#22c55e" className="animate-pulse" />
      )}
      {isFailed && (
        <text x={x + 110} y={y + 15} fill="#ef4444" fontSize={16} fontWeight="bold">✕</text>
      )}
      {showScale && componentDetails[id]?.scaleNote && (
        <g>
          <rect x={x - 5} y={y - 22} width={130} height={18} rx={4} fill="#0f172a" stroke="#475569" />
          <text x={x + 60} y={y - 9} textAnchor="middle" fill="#fbbf24" fontSize={7}>
            {componentDetails[id].scaleNote.substring(0, 35)}
          </text>
        </g>
      )}
    </g>
  );

  const Arrow = ({ x1, y1, x2, y2, isActive, isVisited, curved = false, showPacket = false }) => {
    let path;
    if (curved) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
         path = `M ${x1} ${y1} Q ${midX} ${y1 - 40} ${x2} ${y2}`;
      } else {
         path = `M ${x1} ${y1} Q ${x1 - 40} ${midY} ${x2} ${y2}`;
      }
    } else {
      path = `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    const strokeColor = isActive ? '#22c55e' : (isVisited ? '#10b981' : '#475569');
    
    return (
      <g>
        <defs>
          <marker id={`arrowhead-${isActive ? 'active' : (isVisited ? 'visited' : 'inactive')}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isActive ? 3 : 2}
          markerEnd={`url(#arrowhead-${isActive ? 'active' : (isVisited ? 'visited' : 'inactive')})`}
          strokeDasharray={isActive || isVisited ? 'none' : '8 4'}
          className={isActive ? 'animate-pulse' : ''}
        />
        {showPacket && (
          <circle r={7} fill="#22c55e" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  // Traffic Simulation Packet
  const TrafficPacket = () => (
    <circle r={8} fill="#f43f5e" stroke="#fff" strokeWidth={2}>
      <animateMotion 
        dur="4s" 
        repeatCount="1" 
        path="M 70 155 L 110 120 L 280 70 L 440 70 L 110 120 L 110 280 L 280 305 Q 527 200 775 305"
      />
    </circle>
  );

  const views = [
    { id: 'architecture', label: 'Architecture', key: '1' },
    { id: 'flow', label: 'Flow', key: '2' },
    { id: 'scheduler', label: 'Scheduler', key: '3' },
    { id: 'networking', label: 'Networking', key: '4' },
    { id: 'troubleshooting', label: 'Troubleshoot', key: '5' },
    { id: 'quiz', label: 'Knowledge Check', key: '6' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
      `}</style>
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Kubernetes Internals
              </h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Interactive Architecture Deep Dive</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => {setActiveView(view.id); resetAll();}}
                  className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    activeView === view.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Press ${view.key}`}
                >
                  {view.label}
                  <span className="ml-1 text-slate-500 text-xs">{view.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Architecture View */}
        {activeView === 'architecture' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-6 overflow-x-auto relative">
                
                {/* Controls and Legend Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-sm md:text-base font-semibold text-slate-300">Click any component →</h2>
                    <p className="text-xs text-slate-500 mt-1">Explore the internals of the Control Plane & Workers</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:bg-slate-800 p-1.5 rounded transition-colors bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={showScaleNotes} 
                        onChange={e => setShowScaleNotes(e.target.checked)}
                        className="rounded bg-slate-700 border-slate-600 text-blue-500"
                      />
                      <span className="text-slate-400">Scale notes</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none hover:bg-slate-800 p-1.5 rounded transition-colors bg-slate-800/50">
                      <input 
                        type="checkbox" 
                        checked={failureMode} 
                        onChange={e => {setFailureMode(e.target.checked); setFailedComponent(null); setSelectedComponent(null);}}
                        className="rounded bg-slate-700 border-slate-600 text-red-500"
                      />
                      <span className="text-red-400">Failure mode</span>
                    </label>
                    <button
                      onClick={() => setTrafficSimulation(true)}
                      disabled={trafficSimulation}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-xs font-bold rounded shadow-lg transition-all flex items-center gap-2"
                      title="Visualizes a deployment request flow"
                    >
                      {trafficSimulation ? 'Tracing...' : '🚀 Trace Deployment'}
                    </button>
                  </div>
                </div>

                {/* Simulation Status Banner */}
                {trafficSimulation && (
                  <div className="absolute top-20 right-6 bg-rose-900/90 border border-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl animate-pulse z-20">
                    {simulationStatus}
                  </div>
                )}

                {/* Inline Legend */}
                <div className="flex items-center gap-4 text-xs mb-4 justify-end">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded border border-blue-400"></div> Control Plane</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-600 rounded border border-emerald-400"></div> Worker Node</div>
                </div>

                {failureMode && (
                  <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
                    💀 Click a component to see what breaks when it fails
                  </div>
                )}

                <div className="min-w-[900px]">
                  <svg viewBox="0 0 900 460" className="w-full h-auto">
                    {/* Control Plane Box */}
                    <rect x={20} y={20} width={860} height={170} rx={12} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" />
                    <text x={40} y={50} fill="#3b82f6" fontSize={14} fontWeight={700}>CONTROL PLANE (The Brain)</text>
                    
                    {/* CP Components: WIDER SPREAD */}
                    <Component 
                      id="apiserver" label="API Server" x={50} y={70} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'apiserver'} 
                      isFailed={failedComponent === 'apiserver'}
                      showScale={showScaleNotes}
                    />
                    <Component 
                      id="etcd" label="etcd" x={250} y={70} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'etcd'}
                      isFailed={failedComponent === 'etcd'}
                      showScale={showScaleNotes}
                    />
                    <Component 
                      id="scheduler" label="Scheduler" x={450} y={70} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'scheduler'}
                      isFailed={failedComponent === 'scheduler'}
                      showScale={showScaleNotes}
                    />
                    <Component 
                      id="controller" label="Controllers" x={650} y={70} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'controller'}
                      isFailed={failedComponent === 'controller'}
                      showScale={showScaleNotes}
                    />
                    
                    {/* Worker Node Box */}
                    <rect x={20} y={230} width={860} height={170} rx={12} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="8 4" />
                    <text x={40} y={260} fill="#10b981" fontSize={14} fontWeight={700}>WORKER NODE (The Muscle)</text>
                    
                    {/* Worker Components: Kubelet -> Runtime -> Proxy */}
                    <Component 
                      id="kubelet" label="kubelet" x={50} y={280} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'kubelet'}
                      isFailed={failedComponent === 'kubelet'}
                      showScale={showScaleNotes}
                    />
                    <Component 
                      id="runtime" label="containerd" x={250} y={280} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'runtime'}
                      isFailed={failedComponent === 'runtime'}
                      showScale={showScaleNotes}
                    />
                    <Component 
                      id="kubeproxy" label="kube-proxy" x={450} y={280} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'kubeproxy'}
                      isFailed={failedComponent === 'kubeproxy'}
                      showScale={showScaleNotes}
                    />
                    
                    {/* Pods Representation (Far Right) */}
                    <rect x={700} y={270} width={150} height={80} rx={8} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                    <text x={775} y={295} textAnchor="middle" fill="#94a3b8" fontSize={10}>PODS</text>
                    <rect x={715} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                    <rect x={757} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                    <rect x={799} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                    
                    {/* ARROWS: Updated for WIDER positions */}
                    
                    {/* API(110,95) <-> Etcd(250,95) */}
                    <Arrow x1={170} y1={95} x2={250} y2={95} /> 
                    
                    {/* API(110,120) <-> Scheduler(510,120) - Bus style line across bottom of CP */}
                    <path d="M 110 120 L 110 150 L 510 150 L 510 120" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                    
                    {/* API(110,120) <-> Controller(710,120) */}
                    <path d="M 110 120 L 110 160 L 710 160 L 710 120" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />

                    {/* API(110,120) <-> Kubelet(110,280) - Vertical Spine */}
                    <Arrow x1={110} y1={120} x2={110} y2={280} />
                    
                    {/* API(110,120) <-> Proxy(510,280) - Diagonal/Curved */}
                    <path d="M 110 200 L 510 200 L 510 280" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />

                    {/* Kubelet(170,305) -> Runtime(250,305) - Direct */}
                    <Arrow x1={170} y1={305} x2={250} y2={305} />
                    
                    {/* Runtime(370,305) -> Pods(700,305) - Jump over Proxy */}
                    <path d="M 370 305 Q 535 180 700 305" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead-inactive)" />

                    {/* Simulation Packet */}
                    {trafficSimulation && <TrafficPacket />}
                  </svg>
                </div>
                <p className="text-xs text-slate-600 mt-4 text-center">Press Esc to clear selection</p>
              </div>
            </div>
            
            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {failedComponent && failureMode ? (
                <div className="bg-red-950/30 rounded-xl border border-red-800 p-5 sticky top-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-red-400">{componentDetails[failedComponent].name} FAILURE</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-red-400 uppercase tracking-wider mb-1">Symptom</div>
                      <p className="text-white text-sm font-semibold">{componentDetails[failedComponent].failure.symptom}</p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-orange-400 uppercase tracking-wider mb-1">Impact</div>
                      <p className="text-slate-300 text-sm">{componentDetails[failedComponent].failure.impact}</p>
                    </div>
                    
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-blue-400 uppercase tracking-wider mb-1">Diagnostic</div>
                      <code className="text-xs text-emerald-400 block bg-slate-800 p-2 rounded font-mono break-all">
                        {componentDetails[failedComponent].failure.check}
                      </code>
                    </div>
                    
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Recovery</div>
                      <p className="text-slate-300 text-sm">{componentDetails[failedComponent].failure.recovery}</p>
                    </div>
                  </div>
                </div>
              ) : selectedComponent ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 sticky top-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-lg font-bold text-white">{componentDetails[selectedComponent].name}</h3>
                  </div>
                  <div className="text-emerald-400 text-sm font-semibold mb-3">{componentDetails[selectedComponent].role}</div>
                  
                  <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Analogy</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{componentDetails[selectedComponent].analogy}</p>
                  </div>

                  {/* AI Button */}
                  <button 
                    onClick={handleAiComponentQuery}
                    disabled={isAiLoading}
                    className="w-full mb-4 py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-lg font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? 'Thinking...' : '✨ Explain Internals (AI)'}
                  </button>

                  {/* AI Response Area */}
                  {aiResponse && !aiError && (
                    <div className="mb-4 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                      <div className="text-xs text-indigo-400 font-bold mb-1">AI ARCHITECT</div>
                      <p className="text-slate-300 text-xs leading-relaxed">{aiResponse}</p>
                    </div>
                  )}
                  {aiError && (
                    <div className="mb-4 p-2 bg-red-950/30 border border-red-500/30 rounded text-xs text-red-300">
                      {aiError}
                    </div>
                  )}

                  {showScaleNotes && (
                    <div className="bg-amber-950/30 border border-amber-700 rounded-lg p-3 mb-4">
                      <p className="text-amber-400 text-xs">{componentDetails[selectedComponent].scaleNote}</p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Internals</div>
                    <ul className="space-y-2">
                      {componentDetails[selectedComponent].internals.map((item, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">▸</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Data Flow</div>
                    <p className="text-xs text-emerald-400 font-mono">{componentDetails[selectedComponent].flow}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 p-8 text-center">
                  <div className="text-slate-500 text-lg mb-2">← Select a component</div>
                  <p className="text-slate-600 text-sm">Click on any box to see detailed internals, analogies, and AI explanations.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flow View - Deployment Lifecycle */}
        {activeView === 'flow' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-bold">Deployment Lifecycle: From YAML to Running Pods</h2>
                <p className="text-slate-500 text-xs md:text-sm">Watch how a single `kubectl apply` cascades through the system</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setFlowStep(0); setIsFlowPlaying(true); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
                >
                  ▶ Play
                </button>
                <button
                  onClick={() => setFlowStep(s => Math.max(0, s - 1))}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                >
                  ←
                </button>
                <button
                  onClick={() => setFlowStep(s => Math.min(7, s + 1))}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                >
                  →
                </button>
                <button
                  onClick={resetAll}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-6 overflow-x-auto">
              <div className="min-w-[700px]">
                <svg viewBox="0 0 800 300" className="w-full h-auto">
                  {/* User */}
                  <rect x={30} y={130} width={80} height={40} rx={6} fill={flowSteps[flowStep].active.includes('user') ? '#f59e0b' : '#1e293b'} stroke="#f59e0b" strokeWidth={2} />
                  <text x={70} y={155} textAnchor="middle" fill="#fff" fontSize={11}>You</text>
                  
                  {/* API Server */}
                  <rect x={160} y={60} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('apiserver') ? '#3b82f6' : '#1e3a5f'} stroke="#3b82f6" strokeWidth={2} />
                  <text x={210} y={85} textAnchor="middle" fill="#fff" fontSize={10}>API Server</text>
                  
                  {/* Controller */}
                  <rect x={310} y={60} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('controller') ? '#8b5cf6' : '#3b2970'} stroke="#8b5cf6" strokeWidth={2} />
                  <text x={360} y={85} textAnchor="middle" fill="#fff" fontSize={10}>Controllers</text>
                  
                  {/* Scheduler */}
                  <rect x={460} y={60} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('scheduler') ? '#ec4899' : '#6b214f'} stroke="#ec4899" strokeWidth={2} />
                  <text x={510} y={85} textAnchor="middle" fill="#fff" fontSize={10}>Scheduler</text>
                  
                  {/* Kubelet */}
                  <rect x={460} y={180} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('kubelet') ? '#10b981' : '#134e3a'} stroke="#10b981" strokeWidth={2} />
                  <text x={510} y={205} textAnchor="middle" fill="#fff" fontSize={10}>Kubelet</text>
                  
                  {/* Runtime */}
                  <rect x={610} y={180} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('runtime') ? '#06b6d4' : '#164e63'} stroke="#06b6d4" strokeWidth={2} />
                  <text x={660} y={205} textAnchor="middle" fill="#fff" fontSize={10}>containerd</text>
                  
                  {/* etcd (Below API) */}
                  <rect x={160} y={180} width={100} height={40} rx={6} fill="#1e293b" stroke="#64748b" strokeWidth={2} />
                  <text x={210} y={205} textAnchor="middle" fill="#94a3b8" fontSize={10}>etcd</text>

                  {/* Final Pod (Appears at end) */}
                  <g className={`transition-opacity duration-1000 ${flowStep >= 6 ? 'opacity-100' : 'opacity-0'}`}>
                    <rect x={610} y={250} width={100} height={40} rx={6} fill="#22c55e" stroke="#fff" strokeWidth={2} />
                    <text x={660} y={275} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">Running Pod</text>
                  </g>
                  
                  {/* Arrows */}
                  <Arrow x1={110} y1={150} x2={155} y2={90} isActive={flowStep === 0} isVisited={flowStep > 0} showPacket={flowStep === 0} />
                  <Arrow x1={210} y1={105} x2={210} y2={175} isActive={flowStep === 1} isVisited={flowStep > 1} showPacket={flowStep === 1} />
                  <Arrow x1={265} y1={80} x2={305} y2={80} isActive={flowStep === 2} isVisited={flowStep > 2} showPacket={flowStep === 2} />
                  {flowStep === 3 && (
                    <path d="M 360 55 C 360 30, 400 30, 400 55" fill="none" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead-active)" className="animate-pulse" />
                  )}
                  <Arrow x1={415} y1={80} x2={455} y2={80} isActive={flowStep === 4} isVisited={flowStep > 4} showPacket={flowStep === 4} />
                  <Arrow x1={510} y1={105} x2={510} y2={175} isActive={flowStep === 5} isVisited={flowStep > 5} showPacket={flowStep === 5} />
                  <Arrow x1={565} y1={200} x2={605} y2={200} isActive={flowStep === 6} isVisited={flowStep > 6} showPacket={flowStep === 6} />
                  <Arrow x1={660} y1={225} x2={660} y2={245} isActive={flowStep === 7} isVisited={flowStep > 7} showPacket={flowStep === 7} />
                </svg>
              </div>
            </div>

            {/* Current Step Description */}
            <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-emerald-500">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">Step {flowStep + 1}/8</span>
                <h3 className="text-base md:text-lg font-semibold">{flowSteps[flowStep].label}</h3>
              </div>
              <p className="text-slate-400 text-sm">{flowSteps[flowStep].description}</p>
            </div>

            {/* Timeline */}
            <div className="flex gap-1">
              {flowSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setFlowStep(i)}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    i === flowStep ? 'bg-emerald-500' : i < flowStep ? 'bg-emerald-800' : 'bg-slate-700'
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>
            
            <p className="text-xs text-slate-600 text-center">← → to navigate • Space to play/pause</p>
          </div>
        )}

        {/* Scheduler View */}
        {activeView === 'scheduler' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg md:text-xl font-bold">Scheduler Funnel</h2>
                <button onClick={resetAll} className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded">Reset</button>
              </div>
              <p className="text-slate-500 text-xs md:text-sm mb-6">Not magic. Just filter → score → bind.</p>
              
              <div className="space-y-2">
                {schedulerSteps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setSchedulerStep(i)}
                    className={`w-full text-left p-3 md:p-4 rounded-lg border transition-all ${
                      schedulerStep === i 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{step.label}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-mono ${
                        step.count === 1 ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}>
                        {step.count} nodes
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-4 text-center">↑ ↓ to navigate</p>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">Step: {schedulerSteps[schedulerStep].label}</h3>
                <p className="text-slate-400 text-sm">{schedulerSteps[schedulerStep].description}</p>
                <p className="text-slate-500 text-xs mt-1">{schedulerSteps[schedulerStep].detail}</p>
              </div>
              
              {/* Node Grid Visualizer */}
              <div className="mb-6">
                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">Candidate Node Pool (100 Nodes)</h4>
                <div className="grid grid-cols-10 gap-1.5 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const isActive = i < schedulerSteps[schedulerStep].count;
                    const isWinner = schedulerStep === 6 && i === 0;

                    return (
                      <div 
                        key={i} 
                        className={`
                          w-full pt-[100%] rounded-sm relative transition-all duration-500
                          ${isWinner ? 'bg-emerald-500 scale-125 z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                            isActive ? 'bg-blue-500/80 hover:bg-blue-400' : 'bg-red-900/20'}
                        `}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/80 rounded-sm"></div> Eligible</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/20 rounded-sm"></div> Eliminated</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Selected</span>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Core Insight</div>
                <p className="text-slate-300 text-sm">
                  {schedulerStep < 5 
                    ? "Filtering is elimination. Every predicate must pass or the node is OUT. No partial credit."
                    : schedulerStep === 5
                    ? "Anti-affinity prevents co-location. If another DB pod exists on that node, it's eliminated."
                    : "Scoring ranks survivors. Multiple plugins contribute weighted scores. Highest total wins."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Networking View */}
        {activeView === 'networking' && (
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2">The Four Networks + Service Types</h2>
              <p className="text-slate-500 text-xs md:text-sm">Kubernetes assumes a flat network. Every Pod gets a unique, routable IP.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Node Network', desc: 'Physical/virtual links between VMs', color: '#3b82f6' },
                { name: 'Pod Network', desc: 'Overlay (Calico/Cilium). IP-per-Pod', color: '#10b981' },
                { name: 'Service Network', desc: 'Virtual IPs. iptables/IPVS rules only', color: '#a78bfa' },
                { name: 'External', desc: 'Ingress traffic from outside cluster', color: '#f97316' }
              ].map((net, i) => (
                <div 
                  key={i}
                  className="p-3 md:p-4 rounded-xl border-2"
                  style={{ borderColor: net.color + '50', backgroundColor: net.color + '10' }}
                >
                  <div className="font-bold mb-1 text-sm" style={{ color: net.color }}>{net.name}</div>
                  <p className="text-slate-400 text-xs">{net.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'ClusterIP', internal: true, external: false, desc: 'Internal only. Virtual IP exists only as iptables rules.', useCase: 'Backend services, databases' },
                { type: 'NodePort', internal: true, external: true, desc: 'Opens port 30000-32767 on EVERY node.', useCase: 'Dev/test, on-prem without LB' },
                { type: 'LoadBalancer', internal: true, external: true, desc: 'Cloud provisions external LB (AWS NLB/ALB).', useCase: 'Production external traffic' }
              ].map((svc, i) => (
                <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold">{svc.type}</h3>
                    <div className="flex gap-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${svc.internal ? 'bg-emerald-600' : 'bg-slate-700'}`}>Int</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${svc.external ? 'bg-blue-600' : 'bg-slate-700'}`}>Ext</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{svc.desc}</p>
                  <div className="text-xs text-slate-500">Use: {svc.useCase}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-cyan-500">
              <h3 className="font-bold text-cyan-400 mb-3">kube-proxy Modes: Why IPVS Wins at Scale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="font-semibold text-slate-300 mb-2">iptables (Legacy)</div>
                  <p className="text-slate-400 text-sm">O(n) rules. Every service = more rules = more latency. Falls over at ~5000 services.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-cyan-500/30">
                  <div className="font-semibold text-cyan-400 mb-2">IPVS (Recommended)</div>
                  <p className="text-slate-400 text-sm">O(1) hash lookup. Handles 100k+ services. Supports real LB algos.</p>
                </div>
              </div>
            </div>
            
            {/* CNI Comparison */}
            <div>
              <h3 className="text-base font-bold mb-3">CNI Plugin Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: 'Flannel', tag: 'Simple', desc: 'L3 VXLAN overlay. No Network Policies. Good starter.', color: '#f59e0b' },
                  { name: 'Calico', tag: 'Enterprise', desc: 'BGP routing or overlay. Full NetworkPolicy support.', color: '#ef4444' },
                  { name: 'Cilium', tag: 'Advanced', desc: 'eBPF magic. L7 policies, observability, service mesh.', color: '#8b5cf6' }
                ].map((cni, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-sm">{cni.name}</h4>
                      <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: cni.color + '30', color: cni.color }}>{cni.tag}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{cni.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting View */}
        {activeView === 'troubleshooting' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2">Troubleshooting Decision Trees</h2>
              <p className="text-slate-500 text-xs md:text-sm">Common failure modes and how to diagnose them</p>
            </div>

            {/* AI Troubleshooter Section */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-indigo-700/50 p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-bold text-white">Smart Troubleshooter</h3>
              </div>
              <p className="text-indigo-200 text-sm mb-4">
                Describe your error message or symptom below (e.g., "Pod stuck in Pending state" or "504 Gateway Timeout"), and our AI will generate a diagnostic checklist.
              </p>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={troubleshootQuery}
                  onChange={(e) => setTroubleshootQuery(e.target.value)}
                  placeholder="E.g., CrashLoopBackOff on database pod..."
                  className="flex-1 bg-slate-800/50 border border-indigo-500/30 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiTroubleshoot()}
                />
                <button
                  onClick={handleAiTroubleshoot}
                  disabled={isAiLoading || !troubleshootQuery}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isAiLoading ? 'Analyzing...' : 'Diagnose'}
                </button>
              </div>

              {aiResponse && !aiError && (
                <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 bg-transparent p-0 m-0 border-0">{aiResponse}</pre>
                  </div>
                </div>
              )}
              
              {aiError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
                  {aiError}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {troubleshootingScenarios.map((scenario, i) => (
                <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-5">
                  <h3 className="text-base font-bold text-red-400 mb-2">{scenario.title}</h3>
                  <div className="bg-slate-800 rounded-lg p-3 mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Symptom</div>
                    <p className="text-slate-300 text-sm">{scenario.symptom}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {scenario.causes.map((cause, j) => (
                      <div key={j} className="border-l-2 border-slate-700 pl-3">
                        <div className="text-sm font-semibold text-white mb-1">{cause.cause}</div>
                        <div className="text-xs text-slate-400 mb-1">
                          <span className="text-blue-400">Check: </span>
                          <code className="bg-slate-800 px-1 rounded text-xs">{cause.check}</code>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500">Fix: </span>
                          <span className="text-emerald-400">{cause.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Reference */}
            <div className="bg-slate-800 rounded-xl p-4 md:p-5">
              <h3 className="font-bold mb-3">Quick Diagnostic Commands</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="space-y-2">
                  <div><span className="text-emerald-400">kubectl describe pod &lt;name&gt;</span> <span className="text-slate-500">- Events</span></div>
                  <div><span className="text-emerald-400">kubectl logs &lt;pod&gt; --previous</span> <span className="text-slate-500">- Crash logs</span></div>
                  <div><span className="text-emerald-400">kubectl get events --sort-by='.lastTimestamp'</span></div>
                </div>
                <div className="space-y-2">
                  <div><span className="text-emerald-400">kubectl get endpoints &lt;svc&gt;</span> <span className="text-slate-500">- Service targets</span></div>
                  <div><span className="text-emerald-400">kubectl exec -it &lt;pod&gt; -- nslookup kubernetes</span></div>
                  <div><span className="text-emerald-400">kubectl top nodes</span> <span className="text-slate-500">- Resource pressure</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quiz View */}
        {activeView === 'quiz' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Knowledge Check</h2>
              <p className="text-slate-400 text-sm">Test your understanding of Kubernetes internals.</p>
            </div>

            {!showQuizResult ? (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question {currentQuestion + 1}/{quizQuestions.length}</span>
                  <span className="text-xs font-bold text-emerald-500">Score: {quizScore}</span>
                </div>
                
                <h3 className="text-lg md:text-xl font-bold mb-8">{quizQuestions[currentQuestion].q}</h3>
                
                <div className="space-y-3">
                  {quizQuestions[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === quizQuestions[currentQuestion].correct;
                    const showCorrectness = selectedAnswer !== null;
                    
                    let bgClass = "bg-slate-800 hover:bg-slate-700";
                    if (showCorrectness) {
                      if (isCorrect) bgClass = "bg-emerald-600/20 border-emerald-500 text-emerald-200";
                      else if (isSelected && !isCorrect) bgClass = "bg-red-600/20 border-red-500 text-red-200";
                      else bgClass = "opacity-50 bg-slate-800";
                    } else if (isSelected) {
                      bgClass = "bg-blue-600 text-white";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => !showCorrectness && handleQuizAnswer(index)}
                        disabled={showCorrectness}
                        className={`w-full text-left p-4 rounded-lg border border-transparent transition-all ${bgClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showCorrectness && isCorrect && <span className="text-emerald-500">✓</span>}
                          {showCorrectness && isSelected && !isCorrect && <span className="text-red-500">✕</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center shadow-xl">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
                <p className="text-slate-400 mb-6">You scored <span className="text-emerald-400 font-bold">{quizScore}</span> out of {quizQuestions.length}</p>
                
                <div className="w-full bg-slate-800 rounded-full h-4 mb-8 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-1000"
                    style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }}
                  />
                </div>

                <button
                  onClick={restartQuiz}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/20"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50 py-3 mt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-xs text-slate-600">
          Keyboard: 1-6 switch views • ← → navigate • Space play/pause • Esc clear
        </div>
      </div>
    </div>
  );
}
