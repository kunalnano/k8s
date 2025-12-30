import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Get API key from environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function K8sDeepDive() {
  // ==================== CORE STATE ====================
  const [activeView, setActiveView] = useState('architecture');
  const [selectedComponent, setSelectedComponent] = useState(null);
  
  // Flow Animation State
  const [flowStep, setFlowStep] = useState(0);
  const [isFlowPlaying, setIsFlowPlaying] = useState(false);
  
  // Ingress Flow State
  const [ingressStep, setIngressStep] = useState(0);
  const [isIngressPlaying, setIsIngressPlaying] = useState(false);
  
  // Pod Lifecycle State
  const [lifecyclePhase, setLifecyclePhase] = useState(0);
  const [isLifecyclePlaying, setIsLifecyclePlaying] = useState(false);
  
  // Scheduler State
  const [schedulerStep, setSchedulerStep] = useState(0);
  
  // RBAC State
  const [rbacStep, setRbacStep] = useState(0);
  const [selectedRbacScenario, setSelectedRbacScenario] = useState(0);
  
  // Storage State
  const [storageStep, setStorageStep] = useState(0);
  const [selectedStorageClass, setSelectedStorageClass] = useState('gp3');
  
  // HPA State
  const [hpaMetric, setHpaMetric] = useState(30);
  const [hpaReplicas, setHpaReplicas] = useState(2);
  const [isHpaSimulating, setIsHpaSimulating] = useState(false);
  
  // Settings & Modes
  const [showScaleNotes, setShowScaleNotes] = useState(false);
  const [failureMode, setFailureMode] = useState(false);
  const [failedComponent, setFailedComponent] = useState(null);
  const [trafficSimulation, setTrafficSimulation] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");
  const [showYamlPanel, setShowYamlPanel] = useState(false);
  const [selectedYamlField, setSelectedYamlField] = useState(null);

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
  const [quizCategory, setQuizCategory] = useState('all');
  
  // CKA Prep State
  const [ckaTimer, setCkaTimer] = useState(0);
  const [isCkaActive, setIsCkaActive] = useState(false);
  const [ckaScenario, setCkaScenario] = useState(0);
  const [ckaAnswers, setCkaAnswers] = useState({});
  
  // UI State
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exploredComponents, setExploredComponents] = useState(new Set());

  // ==================== EFFECTS ====================
  
  // Set page title
  useEffect(() => {
    document.title = "Kubernetes Internals — Interactive Deep Dive";
  }, []);

  // Track explored components for progress
  useEffect(() => {
    if (selectedComponent) {
      setExploredComponents(prev => new Set([...prev, selectedComponent]));
    }
  }, [selectedComponent]);

  // Clear AI response when component changes
  useEffect(() => {
    setAiResponse(null);
    setAiError(null);
  }, [selectedComponent]);

  // Auto-advance flow animation
  useEffect(() => {
    if (isFlowPlaying && flowStep < 7) {
      const timer = setTimeout(() => setFlowStep(f => f + 1), 2000);
      return () => clearTimeout(timer);
    } else if (flowStep >= 7) {
      setIsFlowPlaying(false);
    }
  }, [isFlowPlaying, flowStep]);

  // Auto-advance ingress animation
  useEffect(() => {
    if (isIngressPlaying && ingressStep < 5) {
      const timer = setTimeout(() => setIngressStep(s => s + 1), 1500);
      return () => clearTimeout(timer);
    } else if (ingressStep >= 5) {
      setIsIngressPlaying(false);
    }
  }, [isIngressPlaying, ingressStep]);

  // Auto-advance lifecycle animation
  useEffect(() => {
    if (isLifecyclePlaying && lifecyclePhase < 5) {
      const timer = setTimeout(() => setLifecyclePhase(p => p + 1), 2000);
      return () => clearTimeout(timer);
    } else if (lifecyclePhase >= 5) {
      setIsLifecyclePlaying(false);
    }
  }, [isLifecyclePlaying, lifecyclePhase]);

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

  // HPA Simulation
  useEffect(() => {
    if (isHpaSimulating) {
      const interval = setInterval(() => {
        setHpaMetric(prev => {
          const change = Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 15;
          return Math.max(10, Math.min(95, prev + change));
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isHpaSimulating]);

  // HPA Replica calculation
  useEffect(() => {
    const targetReplicas = hpaMetric > 80 ? 5 : hpaMetric > 60 ? 4 : hpaMetric > 40 ? 3 : 2;
    if (targetReplicas !== hpaReplicas) {
      const timer = setTimeout(() => setHpaReplicas(targetReplicas), 500);
      return () => clearTimeout(timer);
    }
  }, [hpaMetric]);

  // CKA Timer
  useEffect(() => {
    if (isCkaActive && ckaTimer > 0) {
      const timer = setTimeout(() => setCkaTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (ckaTimer === 0 && isCkaActive) {
      setIsCkaActive(false);
    }
  }, [isCkaActive, ckaTimer]);

  // ==================== HANDLERS ====================
  
  const resetAll = useCallback(() => {
    setFlowStep(0);
    setIsFlowPlaying(false);
    setIngressStep(0);
    setIsIngressPlaying(false);
    setLifecyclePhase(0);
    setIsLifecyclePlaying(false);
    setSchedulerStep(0);
    setRbacStep(0);
    setStorageStep(0);
    setSelectedComponent(null);
    setFailedComponent(null);
    setTrafficSimulation(false);
    setSimulationStatus("");
    setSelectedYamlField(null);
    setAiResponse(null);
    setTroubleshootQuery("");
  }, []);

  // Gemini API Caller
  const callGemini = useCallback(async (prompt) => {
    if (!GEMINI_API_KEY) {
      setAiError("Add VITE_GEMINI_API_KEY to your .env file");
      return;
    }
    
    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    let retries = 0;
    while (retries <= 3) {
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
          if (response.status === 429) {
            setAiError("Rate limited - free tier quota exceeded. Try again later or add billing.");
            break;
          }
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.");
        break;
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
  }, []);

  const handleAiComponentQuery = useCallback(() => {
    if (!selectedComponent) return;
    const comp = componentDetails[selectedComponent];
    const prompt = `You are a Kubernetes Senior Engineer. Explain the internal workings of the "${comp.name}" component (${comp.role}). 
    Focus on its relationship with the API Server and how it handles failure. 
    Explain it simply but technically for a DevOps engineer. Keep it under 100 words.`;
    callGemini(prompt);
  }, [selectedComponent, callGemini]);

  const handleAiTroubleshoot = useCallback(() => {
    if (!troubleshootQuery) return;
    const prompt = `You are a Kubernetes Expert. A user is reporting this issue: "${troubleshootQuery}".
    Provide a concise technical diagnosis and a list of 3 specific 'kubectl' commands to investigate or fix it. 
    Format the output with Markdown, putting commands in code blocks.`;
    callGemini(prompt);
  }, [troubleshootQuery, callGemini]);

  // Search handler
  const handleSearch = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    const allItems = [
      ...Object.keys(componentDetails).map(k => ({ type: 'component', id: k, name: componentDetails[k].name })),
      ...views.map(v => ({ type: 'view', id: v.id, name: v.label }))
    ];
    return allItems.filter(item => item.name.toLowerCase().includes(lowerQuery));
  }, []);

  // Quiz handlers
  const handleQuizAnswer = useCallback((index) => {
    setSelectedAnswer(index);
    const questions = getFilteredQuizQuestions();
    if (index === questions[currentQuestion].correct) {
      setQuizScore(s => s + 1);
    }
    
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(q => q + 1);
      } else {
        setShowQuizResult(true);
      }
    }, 1500);
  }, [currentQuestion, quizCategory]);

  const restartQuiz = useCallback(() => {
    setQuizScore(0);
    setCurrentQuestion(0);
    setShowQuizResult(false);
    setSelectedAnswer(null);
  }, []);

  // CKA handlers
  const startCkaScenario = useCallback((scenarioIndex) => {
    setCkaScenario(scenarioIndex);
    setCkaTimer(ckaScenarios[scenarioIndex].timeLimit);
    setIsCkaActive(true);
    setCkaAnswers({});
  }, []);

  // ==================== KEYBOARD NAVIGATION ====================
  useEffect(() => {
    const handleKey = (e) => {
      // Don't capture if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Global shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(s => !s);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedComponent(null);
        setFailedComponent(null);
        setTrafficSimulation(false);
        setSimulationStatus("");
        setShowSearch(false);
        setShowShortcuts(false);
        setSelectedYamlField(null);
      }
      
      // View-specific navigation
      if (activeView === 'flow') {
        if (e.key === 'ArrowRight') setFlowStep(s => Math.min(7, s + 1));
        if (e.key === 'ArrowLeft') setFlowStep(s => Math.max(0, s - 1));
        if (e.key === ' ') { e.preventDefault(); setIsFlowPlaying(p => !p); }
      }
      if (activeView === 'ingress') {
        if (e.key === 'ArrowRight') setIngressStep(s => Math.min(5, s + 1));
        if (e.key === 'ArrowLeft') setIngressStep(s => Math.max(0, s - 1));
        if (e.key === ' ') { e.preventDefault(); setIsIngressPlaying(p => !p); }
      }
      if (activeView === 'lifecycle') {
        if (e.key === 'ArrowRight') setLifecyclePhase(s => Math.min(5, s + 1));
        if (e.key === 'ArrowLeft') setLifecyclePhase(s => Math.max(0, s - 1));
        if (e.key === ' ') { e.preventDefault(); setIsLifecyclePlaying(p => !p); }
      }
      if (activeView === 'scheduler') {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSchedulerStep(s => Math.min(6, s + 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSchedulerStep(s => Math.max(0, s - 1)); }
      }
      if (activeView === 'rbac') {
        if (e.key === 'ArrowRight') setRbacStep(s => Math.min(4, s + 1));
        if (e.key === 'ArrowLeft') setRbacStep(s => Math.max(0, s - 1));
      }
      if (activeView === 'storage') {
        if (e.key === 'ArrowRight') setStorageStep(s => Math.min(4, s + 1));
        if (e.key === 'ArrowLeft') setStorageStep(s => Math.max(0, s - 1));
      }
      
      // Number keys for view switching
      const viewKeys = { '1': 'architecture', '2': 'flow', '3': 'ingress', '4': 'lifecycle', '5': 'scheduler', '6': 'rbac', '7': 'storage', '8': 'hpa', '9': 'networking', '0': 'troubleshooting' };
      if (viewKeys[e.key]) { setActiveView(viewKeys[e.key]); resetAll(); }
      if (e.key === 'q') { setActiveView('quiz'); resetAll(); }
      if (e.key === 'c') { setActiveView('cka'); resetAll(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeView, resetAll]);

  // ==================== DATA ====================
  
  const componentDetails = {
    apiserver: {
      name: 'kube-apiserver',
      role: 'The Front Door & Traffic Cop',
      analogy: 'The hospital receptionist. Checks ID, validates requests, and updates the database. The ONLY component that talks to Etcd.',
      internals: ['Stateless - scales horizontally', 'Authentication -> Authorization -> Admission Control', 'Validating & Mutating Webhooks', 'Serves the REST API'],
      flow: 'User -> Load Balancer -> API Server -> Etcd',
      scaleNote: '⚠️ CPU intensive. Scale horizontally behind a Load Balancer.',
      failure: { symptom: 'kubectl commands timeout. Cluster is unmanageable.', impact: 'Existing pods run fine, but no updates or new pods possible.', check: 'curl -k https://localhost:6443/livez', recovery: 'Check system logs, ensure etcd connectivity.' },
      yamlFields: ['apiVersion', 'kind', 'metadata']
    },
    etcd: {
      name: 'etcd',
      role: 'The Source of Truth',
      analogy: 'The hospital records room. Highly secure, consistent storage. If this burns down, the cluster has amnesia.',
      internals: ['Distributed Key-Value Store', 'Uses Raft Consensus Algorithm', 'Stores ALL cluster state', 'Strong Consistency'],
      flow: 'API Server <-> Etcd (gRPC)',
      scaleNote: '🔴 Disk I/O sensitive. Use SSDs. Max 5 nodes recommended.',
      failure: { symptom: 'API Server refuses requests. Cluster frozen.', impact: 'CATASTROPHIC. Potential data loss if no backups.', check: 'etcdctl endpoint health', recovery: 'Restore from snapshot immediately.' },
      yamlFields: []
    },
    scheduler: {
      name: 'kube-scheduler',
      role: 'The Assignment Engine',
      analogy: 'The room assigner. Checks which rooms (nodes) have space and meet requirements (constraints) for new patients (pods).',
      internals: ['Watches for Pods with empty nodeName', 'Filtering (Hard Constraints)', 'Scoring (Soft Constraints)', 'Binding (API Update)'],
      flow: 'API Server -> Scheduler -> API Server',
      scaleNote: '⚡ Can be a bottleneck for massive pod churn. Tune intervals.',
      failure: { symptom: 'Pods remain in "Pending" state forever.', impact: 'New workloads do not start.', check: 'kubectl get componentstatuses', recovery: 'Restart scheduler pod/service.' },
      yamlFields: ['nodeSelector', 'affinity', 'tolerations', 'nodeName']
    },
    controller: {
      name: 'kube-controller-manager',
      role: 'The Reconciliation Army',
      analogy: 'The maintenance team. Thermostat checks temp (actual) vs setting (desired) and turns on heat. Controller checks pods vs replicas.',
      internals: ['Run loop: Observe -> Diff -> Act', 'ReplicaSet, Node, Endpoint Controllers', 'Single binary, many loops', 'Leader Election'],
      flow: 'API Server -> Controller -> API Server',
      scaleNote: '⚙️ Single active leader. Vertical scaling only.',
      failure: { symptom: 'Deployments dont scale. Dead nodes not detected.', impact: 'Cluster state drifts from desired state.', check: 'Check leader election logs.', recovery: 'Restart controller manager.' },
      yamlFields: ['replicas', 'strategy', 'minReadySeconds']
    },
    kubelet: {
      name: 'kubelet',
      role: 'The Node Captain',
      analogy: 'The floor nurse. Receives orders for patients (pods), ensures they are alive (probes), and reports status back to HQ.',
      internals: ['Runs on EVERY node', 'Registers node with API Server', 'Pod Lifecycle Manager', 'Executes Liveness/Readiness Probes'],
      flow: 'API Server -> Kubelet -> Runtime',
      scaleNote: '📊 Heartbeat intervals affect API load. Limit ~110 pods/node.',
      failure: { symptom: 'Node status "NotReady". Pods unknown.', impact: 'Scheduler stops sending pods to this node.', check: 'systemctl status kubelet', recovery: 'Check node resources (Disk/RAM), restart service.' },
      yamlFields: ['containers', 'volumes', 'livenessProbe', 'readinessProbe', 'resources']
    },
    kubeproxy: {
      name: 'kube-proxy',
      role: 'The Network Plumber',
      analogy: 'The switchboard operator. Ensures network rules exist so traffic to a "Department" (Service) gets to a specific "Phone" (Pod).',
      internals: ['Runs on EVERY node', 'Watches Services & Endpoints', 'Manages iptables or IPVS rules', 'Does NOT usually proxy data (in IPVS mode)'],
      flow: 'API Server -> Kube-proxy -> Kernel Network Stack',
      scaleNote: '🚨 Use IPVS mode for clusters with >1000 services.',
      failure: { symptom: 'Service IPs unreachable. DNS works, connection fails.', impact: 'Internal communication breaks.', check: 'iptables -L -n -t nat', recovery: 'Restart kube-proxy, flush iptables.' },
      yamlFields: ['ports', 'targetPort', 'protocol']
    },
    runtime: {
      name: 'Container Runtime',
      role: 'The Execution Engine',
      analogy: 'The actual bed/equipment. containerd or CRI-O. It does the heavy lifting of pulling images and running the process.',
      internals: ['Implements CRI (Container Runtime Interface)', 'Pulls OCI Images', 'Creates Namespaces & Cgroups', 'Sandboxing'],
      flow: 'Kubelet -> CRI (gRPC) -> Runtime',
      scaleNote: '💾 Image pull speeds depend on disk/network.',
      failure: { symptom: 'ContainerCreating errors. ImagePullBackOff.', impact: 'Pods fail to start.', check: 'crictl ps', recovery: 'Prune unused images, restart daemon.' },
      yamlFields: ['image', 'imagePullPolicy', 'command', 'args']
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

  const ingressSteps = [
    { id: 0, label: 'External Request', description: 'User makes HTTPS request to app.example.com', components: ['user', 'dns'] },
    { id: 1, label: 'Load Balancer', description: 'Cloud LB receives traffic on port 443, forwards to NodePort', components: ['loadbalancer'] },
    { id: 2, label: 'Ingress Controller', description: 'NGINX/Traefik pod receives request, matches Host/Path rules', components: ['ingress'] },
    { id: 3, label: 'Service Lookup', description: 'Controller finds backend Service, gets Endpoints (Pod IPs)', components: ['service'] },
    { id: 4, label: 'Pod Selection', description: 'Load balances across healthy Pod endpoints', components: ['endpoints'] },
    { id: 5, label: 'Response', description: 'Pod processes request, response flows back through the chain', components: ['pod'] }
  ];

  const lifecyclePhases = [
    { name: 'Pending', color: '#f59e0b', description: 'Pod accepted but containers not created. Waiting for scheduling or image pull.' },
    { name: 'ContainerCreating', color: '#3b82f6', description: 'Scheduled to node. Pulling images, creating containers.' },
    { name: 'Running', color: '#10b981', description: 'At least one container running. May not be Ready yet.' },
    { name: 'Ready', color: '#22c55e', description: 'All containers running AND passing readiness probes. Receives traffic.' },
    { name: 'Terminating', color: '#ef4444', description: 'Received delete. Running preStop hooks, SIGTERM sent.' },
    { name: 'Terminated', color: '#6b7280', description: 'All containers stopped. Pod object may persist for logs.' }
  ];

  const schedulerSteps = [
    { label: 'All Nodes', count: 100, description: 'Starting pool of all nodes in cluster', detail: 'Every registered node that is Ready' },
    { label: 'NodeSelector', count: 45, description: 'Filter: node.kubernetes.io/type=compute', detail: 'Hard requirement - must have this label' },
    { label: 'Resources', count: 32, description: 'Filter: Need 2 CPU, 4Gi RAM available', detail: 'Compares requests against allocatable - limits' },
    { label: 'Taints', count: 28, description: 'Filter: Tolerate only monitoring taints', detail: 'NoSchedule taints block without matching tolerations' },
    { label: 'Affinity', count: 12, description: 'Filter: requiredDuringScheduling zone=us-east-1a', detail: 'Required = hard constraint, Preferred = soft' },
    { label: 'Anti-Affinity', count: 8, description: "Filter: Don't colocate with other DB pods", detail: 'podAntiAffinity prevents same-node placement' },
    { label: 'Scoring', count: 1, description: 'Score remaining 8: LeastRequestedPriority wins node-7', detail: 'Multiple scoring plugins weighted and summed' }
  ];

  const rbacScenarios = [
    { name: 'Developer Read-Only', user: 'dev@company.com', verb: 'get', resource: 'pods', namespace: 'dev', allowed: true },
    { name: 'Developer Deploy', user: 'dev@company.com', verb: 'create', resource: 'deployments', namespace: 'dev', allowed: true },
    { name: 'Developer Secrets (Denied)', user: 'dev@company.com', verb: 'get', resource: 'secrets', namespace: 'dev', allowed: false },
    { name: 'Admin Full Access', user: 'admin@company.com', verb: '*', resource: '*', namespace: '*', allowed: true }
  ];

  const storageClasses = [
    { name: 'gp3', provisioner: 'ebs.csi.aws.com', type: 'SSD', iops: '3000', throughput: '125 MB/s', reclaimPolicy: 'Delete' },
    { name: 'io2', provisioner: 'ebs.csi.aws.com', type: 'SSD', iops: '64000', throughput: '1000 MB/s', reclaimPolicy: 'Retain' },
    { name: 'standard', provisioner: 'kubernetes.io/gce-pd', type: 'HDD', iops: '300', throughput: '40 MB/s', reclaimPolicy: 'Delete' }
  ];

  const ckaScenarios = [
    { 
      id: 'troubleshoot-pod',
      title: 'Troubleshoot: Pod Not Starting',
      timeLimit: 300,
      difficulty: 'Medium',
      description: 'A pod named "web-app" in namespace "production" is stuck in CrashLoopBackOff. Diagnose and fix.',
      tasks: ['Identify the root cause', 'Check container logs', 'Fix the configuration'],
      hints: ['kubectl describe pod', 'kubectl logs --previous', 'Check resource limits'],
      solution: 'The pod was OOMKilled due to insufficient memory limits. Increase memory limit to 512Mi.'
    },
    {
      id: 'create-deployment',
      title: 'Create: Deployment with Requirements',
      timeLimit: 480,
      difficulty: 'Medium',
      description: 'Create a deployment "nginx-secure" with 3 replicas, resource limits, and a readiness probe.',
      tasks: ['Create deployment YAML', 'Add resource requests/limits', 'Configure readiness probe', 'Apply to cluster'],
      hints: ['kubectl create deployment --dry-run=client -o yaml', 'httpGet probe on port 80'],
      solution: 'Deployment with cpu: 100m/200m, memory: 128Mi/256Mi, readinessProbe httpGet / port 80'
    },
    {
      id: 'network-policy',
      title: 'Secure: Network Policy',
      timeLimit: 420,
      difficulty: 'Hard',
      description: 'Create a NetworkPolicy that allows only pods with label "api=true" to access the "database" pod.',
      tasks: ['Identify pod selectors', 'Create ingress policy', 'Test connectivity'],
      hints: ['podSelector for target', 'ingress.from.podSelector for source', 'namespaceSelector if cross-namespace'],
      solution: 'NetworkPolicy with podSelector: app=database, ingress from podSelector: api=true'
    },
    {
      id: 'rbac-setup',
      title: 'Configure: RBAC for Developer',
      timeLimit: 360,
      difficulty: 'Medium',
      description: 'Create a Role and RoleBinding that allows user "developer" to view pods and logs in namespace "dev".',
      tasks: ['Create Role with permissions', 'Create RoleBinding', 'Verify with can-i'],
      hints: ['verbs: get, list, watch', 'resources: pods, pods/log', 'kubectl auth can-i'],
      solution: 'Role with pods [get,list,watch] and pods/log [get], RoleBinding to user developer'
    }
  ];

  // Extended Quiz Questions (20 total)
  const allQuizQuestions = [
    // Architecture (5)
    { q: "Which component is the only one that communicates directly with etcd?", options: ["kube-scheduler", "kube-apiserver", "kubelet", "kube-controller-manager"], correct: 1, category: 'architecture' },
    { q: "What happens if etcd loses all data and there are no backups?", options: ["Cluster auto-recovers", "Only new pods affected", "Complete cluster state lost", "API server recreates state"], correct: 2, category: 'architecture' },
    { q: "Which component runs the reconciliation loops?", options: ["kube-scheduler", "kube-proxy", "kube-controller-manager", "kubelet"], correct: 2, category: 'architecture' },
    { q: "Where does kubelet run?", options: ["Only on control plane", "Only on worker nodes", "On every node", "In etcd"], correct: 2, category: 'architecture' },
    { q: "What protocol does the API server use to communicate with etcd?", options: ["REST", "gRPC", "GraphQL", "SOAP"], correct: 1, category: 'architecture' },
    
    // Networking (5)
    { q: "If you have 1000 Services, which kube-proxy mode should you use?", options: ["userspace", "iptables", "IPVS", "ebpf"], correct: 2, category: 'networking' },
    { q: "What type of IP does a ClusterIP service have?", options: ["Public routable", "Virtual (iptables only)", "Node's IP", "Pod's IP"], correct: 1, category: 'networking' },
    { q: "Which CNI plugin uses eBPF for networking?", options: ["Flannel", "Calico", "Cilium", "Weave"], correct: 2, category: 'networking' },
    { q: "What port range do NodePort services use by default?", options: ["80-443", "1024-65535", "30000-32767", "8080-9090"], correct: 2, category: 'networking' },
    { q: "What component manages network policies enforcement?", options: ["kube-proxy", "CNI plugin", "kubelet", "API server"], correct: 1, category: 'networking' },
    
    // Scheduling (5)
    { q: "What happens if a node has a Taint but a Pod has no matching Toleration?", options: ["Pod scheduled with warning", "Pod rejected from that node", "Pod crashes", "Node removes taint"], correct: 1, category: 'scheduling' },
    { q: "Which is a soft scheduling constraint?", options: ["nodeSelector", "requiredDuringScheduling", "preferredDuringScheduling", "taints"], correct: 2, category: 'scheduling' },
    { q: "What does podAntiAffinity prevent?", options: ["Pods on tainted nodes", "Pods on same node", "Pods in different zones", "Pods without labels"], correct: 1, category: 'scheduling' },
    { q: "When does the scheduler score nodes?", options: ["Before filtering", "After filtering", "Instead of filtering", "Never"], correct: 1, category: 'scheduling' },
    { q: "Which field in Pod spec directly assigns a node?", options: ["nodeSelector", "affinity", "nodeName", "schedulerName"], correct: 2, category: 'scheduling' },
    
    // Storage (3)
    { q: "What is the relationship between PV and PVC?", options: ["PV contains PVC", "PVC claims a PV", "They are the same", "PVC creates PV"], correct: 1, category: 'storage' },
    { q: "What does 'Retain' reclaim policy do when PVC is deleted?", options: ["Delete PV", "Keep PV and data", "Archive to S3", "Create backup"], correct: 1, category: 'storage' },
    { q: "Which access mode allows multiple nodes to read/write?", options: ["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany", "ReadWriteSingle"], correct: 2, category: 'storage' },
    
    // RBAC (2)
    { q: "What's the difference between Role and ClusterRole?", options: ["No difference", "Role is namespaced, ClusterRole is cluster-wide", "ClusterRole is deprecated", "Role has more permissions"], correct: 1, category: 'rbac' },
    { q: "Which RBAC resource binds a Role to a user?", options: ["RoleAssignment", "RoleBinding", "UserRole", "PermissionGrant"], correct: 1, category: 'rbac' }
  ];

  const getFilteredQuizQuestions = () => {
    if (quizCategory === 'all') return allQuizQuestions;
    return allQuizQuestions.filter(q => q.category === quizCategory);
  };

  const troubleshootingScenarios = [
    { id: 'pending', title: 'Pod Stuck in Pending', symptom: 'kubectl get pods shows Pending for minutes',
      causes: [
        { cause: 'Insufficient resources', check: 'kubectl describe pod - look for "Insufficient cpu/memory"', fix: 'Scale cluster or reduce requests' },
        { cause: 'Node taints blocking', check: 'kubectl describe pod - look for "node(s) had taints"', fix: 'Add tolerations or untaint nodes' },
        { cause: 'PVC not bound', check: 'kubectl get pvc - check for Pending status', fix: 'Ensure StorageClass exists and provisioner works' },
        { cause: 'Node affinity mismatch', check: 'kubectl describe pod - look for affinity/nodeSelector', fix: 'Label nodes or adjust affinity rules' }
      ]
    },
    { id: 'crashloop', title: 'CrashLoopBackOff', symptom: 'Container starts then immediately dies',
      causes: [
        { cause: 'Application crash', check: 'kubectl logs <pod> --previous', fix: 'Fix application code, check environment variables' },
        { cause: 'Liveness probe too aggressive', check: 'kubectl describe pod - check probe config', fix: 'Increase initialDelaySeconds, timeoutSeconds' },
        { cause: 'Missing config/secrets', check: 'kubectl logs - look for config errors', fix: 'Ensure ConfigMaps/Secrets exist and are mounted' },
        { cause: 'OOMKilled', check: 'kubectl describe pod - look for OOMKilled', fix: 'Increase memory limits or fix memory leak' }
      ]
    },
    { id: 'service', title: 'Service Unreachable', symptom: 'curl to ClusterIP times out',
      causes: [
        { cause: 'No endpoints', check: 'kubectl get endpoints <svc> - empty?', fix: 'Check pod labels match service selector' },
        { cause: 'Pods not ready', check: 'kubectl get pods - all Running but not Ready?', fix: 'Fix readiness probe failures' },
        { cause: 'NetworkPolicy blocking', check: 'kubectl get networkpolicy -A', fix: 'Add ingress rule to allow traffic' },
        { cause: 'kube-proxy not running', check: 'kubectl get pods -n kube-system | grep proxy', fix: 'Restart kube-proxy DaemonSet' }
      ]
    },
    { id: 'dns', title: 'DNS Resolution Failing', symptom: 'nslookup kubernetes.default fails from pod',
      causes: [
        { cause: 'CoreDNS down', check: 'kubectl get pods -n kube-system -l k8s-app=kube-dns', fix: 'Restart CoreDNS, check logs' },
        { cause: 'resolv.conf wrong', check: 'kubectl exec <pod> -- cat /etc/resolv.conf', fix: 'Check kubelet DNS config, dnsPolicy' },
        { cause: 'NetworkPolicy blocking UDP 53', check: 'Check egress NetworkPolicy', fix: 'Allow egress to kube-dns on UDP 53' },
        { cause: 'CoreDNS ConfigMap corrupt', check: 'kubectl get cm coredns -n kube-system -o yaml', fix: 'Restore default Corefile' }
      ]
    }
  ];

  // YAML Mapping for Architecture view
  const sampleDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-app
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      nodeSelector:
        disk: ssd
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "200m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /
            port: 80
        readinessProbe:
          httpGet:
            path: /
            port: 80`;

  const yamlFieldMapping = {
    'apiVersion': { component: 'apiserver', description: 'API Server validates this matches a known API group' },
    'kind': { component: 'apiserver', description: 'API Server routes to correct controller based on kind' },
    'metadata': { component: 'apiserver', description: 'Stored in etcd, indexed for lookups' },
    'replicas': { component: 'controller', description: 'ReplicaSet controller ensures this many pods exist' },
    'selector': { component: 'controller', description: 'Controller uses this to find pods it owns' },
    'nodeSelector': { component: 'scheduler', description: 'Scheduler filters nodes by these labels' },
    'containers': { component: 'kubelet', description: 'Kubelet tells runtime to create these containers' },
    'image': { component: 'runtime', description: 'Container runtime pulls this image from registry' },
    'ports': { component: 'kubeproxy', description: 'kube-proxy sets up network rules for these ports' },
    'resources': { component: 'scheduler', description: 'Scheduler checks node capacity against requests' },
    'livenessProbe': { component: 'kubelet', description: 'Kubelet executes probe, restarts container if failing' },
    'readinessProbe': { component: 'kubelet', description: 'Kubelet executes probe, removes from endpoints if failing' }
  };

  const views = [
    { id: 'architecture', label: 'Architecture', key: '1', icon: '🏗️' },
    { id: 'flow', label: 'Deploy Flow', key: '2', icon: '🔄' },
    { id: 'ingress', label: 'Ingress', key: '3', icon: '🌐' },
    { id: 'lifecycle', label: 'Pod Lifecycle', key: '4', icon: '🔁' },
    { id: 'scheduler', label: 'Scheduler', key: '5', icon: '📋' },
    { id: 'rbac', label: 'RBAC', key: '6', icon: '🔐' },
    { id: 'storage', label: 'Storage', key: '7', icon: '💾' },
    { id: 'hpa', label: 'HPA', key: '8', icon: '📈' },
    { id: 'networking', label: 'Network', key: '9', icon: '🔌' },
    { id: 'troubleshooting', label: 'Troubleshoot', key: '0', icon: '🔧' },
    { id: 'quiz', label: 'Quiz', key: 'Q', icon: '❓' },
    { id: 'cka', label: 'CKA Prep', key: 'C', icon: '🎓' }
  ];


  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Kubernetes Deep Dive
            </h1>
            <p className="text-slate-400 mt-1">Interactive learning • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">?</kbd> for shortcuts</p>
          </div>
          
          {/* Progress Tracker */}
          <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-400">Progress:</span>
            <div className="flex gap-1">
              {Object.keys(componentDetails).map(comp => (
                <div 
                  key={comp}
                  className={`w-3 h-3 rounded-full transition-all ${exploredComponents.has(comp) ? 'bg-green-500' : 'bg-slate-600'}`}
                  title={componentDetails[comp].name}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-cyan-400">{exploredComponents.size}/7</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => { setActiveView(v.id); resetAll(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeView === v.id 
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{v.icon}</span>
              <span className="hidden sm:inline">{v.label}</span>
              <kbd className="hidden md:inline ml-1 px-1 py-0.5 bg-black/20 rounded text-[10px]">{v.key}</kbd>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        
        {/* ==================== ARCHITECTURE VIEW ==================== */}
        {activeView === 'architecture' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Diagram */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700 relative">
              {/* Controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setTrafficSimulation(true)} disabled={trafficSimulation}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                  ▶️ Simulate Deploy
                </button>
                <button onClick={() => setShowYamlPanel(p => !p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showYamlPanel ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  📄 YAML Mapping
                </button>
                <button onClick={() => setFailureMode(f => !f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${failureMode ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  💥 Failure Mode
                </button>
                <button onClick={() => setShowScaleNotes(s => !s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showScaleNotes ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                  📊 Scale Notes
                </button>
              </div>

              {/* Status Banner */}
              {trafficSimulation && (
                <div className="absolute top-16 right-4 bg-rose-900/90 border border-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl animate-pulse z-20">
                  {simulationStatus}
                </div>
              )}

              {/* Architecture SVG */}
              <svg viewBox="0 0 900 500" className="w-full h-auto">
                <defs>
                  <linearGradient id="cpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0891b2" />
                    <stop offset="100%" stopColor="#0e7490" />
                  </linearGradient>
                  <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* Control Plane Box */}
                <rect x="30" y="30" width="840" height="180" rx="12" fill="url(#cpGrad)" opacity="0.15" stroke="#0891b2" strokeWidth="2"/>
                <text x="50" y="55" fill="#22d3ee" fontSize="14" fontWeight="bold">CONTROL PLANE</text>

                {/* Worker Node Box */}
                <rect x="30" y="240" width="840" height="230" rx="12" fill="url(#nodeGrad)" opacity="0.15" stroke="#10b981" strokeWidth="2"/>
                <text x="50" y="265" fill="#34d399" fontSize="14" fontWeight="bold">WORKER NODE</text>

                {/* Control Plane Components */}
                {[
                  { id: 'apiserver', x: 80, y: 80, label: 'API Server' },
                  { id: 'etcd', x: 280, y: 80, label: 'etcd' },
                  { id: 'scheduler', x: 480, y: 80, label: 'Scheduler' },
                  { id: 'controller', x: 680, y: 80, label: 'Controller Mgr' }
                ].map(comp => (
                  <g key={comp.id} onClick={() => { setSelectedComponent(comp.id); if(failureMode) setFailedComponent(comp.id); }}
                     className="cursor-pointer" filter={selectedComponent === comp.id ? "url(#glow)" : ""}>
                    <rect x={comp.x} y={comp.y} width="160" height="70" rx="8"
                      fill={failedComponent === comp.id ? "#dc2626" : selectedComponent === comp.id ? "#0ea5e9" : "#1e3a5f"}
                      stroke={selectedComponent === comp.id ? "#38bdf8" : "#0ea5e9"} strokeWidth="2"
                      className="transition-all duration-300 hover:fill-cyan-900"/>
                    <text x={comp.x + 80} y={comp.y + 40} textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{comp.label}</text>
                    {showScaleNotes && <text x={comp.x + 80} y={comp.y + 58} textAnchor="middle" fill="#fbbf24" fontSize="9">
                      {comp.id === 'apiserver' ? '⚖️ Horizontal' : comp.id === 'etcd' ? '🔴 Max 5' : '👑 Leader'}
                    </text>}
                  </g>
                ))}

                {/* Worker Node Components */}
                {[
                  { id: 'kubelet', x: 80, y: 290, label: 'Kubelet' },
                  { id: 'kubeproxy', x: 280, y: 290, label: 'kube-proxy' },
                  { id: 'runtime', x: 480, y: 290, label: 'Container Runtime' }
                ].map(comp => (
                  <g key={comp.id} onClick={() => { setSelectedComponent(comp.id); if(failureMode) setFailedComponent(comp.id); }}
                     className="cursor-pointer" filter={selectedComponent === comp.id ? "url(#glow)" : ""}>
                    <rect x={comp.x} y={comp.y} width="160" height="70" rx="8"
                      fill={failedComponent === comp.id ? "#dc2626" : selectedComponent === comp.id ? "#059669" : "#14532d"}
                      stroke={selectedComponent === comp.id ? "#34d399" : "#10b981"} strokeWidth="2"
                      className="transition-all duration-300 hover:fill-emerald-900"/>
                    <text x={comp.x + 80} y={comp.y + 40} textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{comp.label}</text>
                  </g>
                ))}

                {/* Pods */}
                <g>
                  <rect x="680" y="280" width="160" height="100" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2"/>
                  <text x="760" y="305" textAnchor="middle" fill="#a5b4fc" fontSize="12" fontWeight="bold">PODS</text>
                  {[0, 1, 2].map(i => (
                    <rect key={i} x={700 + i * 45} y="315" width="35" height="50" rx="4" fill="#312e81" stroke="#818cf8" strokeWidth="1"/>
                  ))}
                </g>

                {/* Connection Lines */}
                <g stroke="#64748b" strokeWidth="1.5" strokeDasharray="4" fill="none">
                  {/* API Server connections */}
                  <path d="M 240 115 L 280 115"/> {/* API -> etcd */}
                  <path d="M 440 115 L 480 115"/> {/* Scheduler -> API */}
                  <path d="M 640 115 L 680 115"/> {/* Controller -> API */}
                  <path d="M 160 150 L 160 290"/> {/* API -> Kubelet */}
                  <path d="M 360 150 L 360 290"/> {/* API -> kube-proxy */}
                  <path d="M 560 360 L 680 360"/> {/* Runtime -> Pods */}
                </g>
              </svg>
            </div>

            {/* Detail Panel / YAML Panel */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 max-h-[600px] overflow-y-auto">
              {showYamlPanel ? (
                <div>
                  <h3 className="text-lg font-bold text-purple-400 mb-3">📄 YAML → Component Mapping</h3>
                  <p className="text-sm text-slate-400 mb-4">Click a highlighted field to see which component processes it</p>
                  <pre className="text-xs bg-slate-900 p-3 rounded-lg overflow-x-auto font-mono">
                    {sampleDeploymentYaml.split('\n').map((line, i) => {
                      const field = Object.keys(yamlFieldMapping).find(f => line.trim().startsWith(f + ':') || line.trim().startsWith(f));
                      return (
                        <div key={i} 
                          onClick={() => field && setSelectedYamlField(field)}
                          className={`${field ? 'cursor-pointer hover:bg-slate-700 ' + (selectedYamlField === field ? 'bg-purple-900/50 text-purple-300' : 'text-cyan-400') : 'text-slate-300'}`}>
                          {line || ' '}
                        </div>
                      );
                    })}
                  </pre>
                  {selectedYamlField && yamlFieldMapping[selectedYamlField] && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-purple-500/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-purple-400 font-bold">{selectedYamlField}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-cyan-400 font-medium">{componentDetails[yamlFieldMapping[selectedYamlField].component]?.name}</span>
                      </div>
                      <p className="text-sm text-slate-300">{yamlFieldMapping[selectedYamlField].description}</p>
                    </div>
                  )}
                </div>
              ) : selectedComponent ? (
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-1">{componentDetails[selectedComponent].name}</h3>
                  <p className="text-emerald-400 text-sm mb-3">{componentDetails[selectedComponent].role}</p>
                  
                  <div className="mb-4 p-3 bg-slate-900 rounded-lg border-l-4 border-amber-500">
                    <p className="text-sm text-slate-300">💡 {componentDetails[selectedComponent].analogy}</p>
                  </div>

                  <h4 className="font-semibold text-slate-300 mb-2">Internals</h4>
                  <ul className="text-sm text-slate-400 space-y-1 mb-4">
                    {componentDetails[selectedComponent].internals.map((item, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-cyan-500">▸</span>{item}</li>
                    ))}
                  </ul>

                  {failureMode && componentDetails[selectedComponent].failure && (
                    <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-500/50">
                      <h4 className="font-semibold text-red-400 mb-2">💥 Failure Impact</h4>
                      <p className="text-sm text-slate-300 mb-1"><strong>Symptom:</strong> {componentDetails[selectedComponent].failure.symptom}</p>
                      <p className="text-sm text-slate-300 mb-1"><strong>Impact:</strong> {componentDetails[selectedComponent].failure.impact}</p>
                      <code className="text-xs bg-slate-900 px-2 py-1 rounded block mt-2">{componentDetails[selectedComponent].failure.check}</code>
                    </div>
                  )}

                  {/* AI Explain Button */}
                  <button onClick={handleAiComponentQuery} disabled={isAiLoading}
                    className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all">
                    {isAiLoading ? '🔄 Thinking...' : '✨ Explain Internals (AI)'}
                  </button>

                  {aiError && <p className="mt-2 text-red-400 text-sm">{aiError}</p>}
                  {aiResponse && (
                    <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-purple-500/30 text-sm text-slate-300 whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <p className="text-4xl mb-3">👆</p>
                  <p>Click a component to explore</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* ==================== DEPLOY FLOW VIEW ==================== */}
        {activeView === 'flow' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">🔄 Deployment Flow</h2>
              <div className="flex gap-2">
                <button onClick={() => setFlowStep(s => Math.max(0, s - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">← Prev</button>
                <button onClick={() => { setFlowStep(0); setIsFlowPlaying(true); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg">▶️ Play</button>
                <button onClick={() => setFlowStep(s => Math.min(7, s + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">Next →</button>
              </div>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-1 mb-6">
              {flowSteps.map((step, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i === flowStep ? 'bg-cyan-500 text-white scale-110' : i < flowStep ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>{i + 1}</div>
                  {i < flowSteps.length - 1 && <div className={`flex-1 h-1 mx-1 ${i < flowStep ? 'bg-emerald-600' : 'bg-slate-700'}`}/>}
                </div>
              ))}
            </div>

            {/* Current Step Info */}
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-2">{flowSteps[flowStep].label}</h3>
              <p className="text-slate-300">{flowSteps[flowStep].description}</p>
            </div>

            {/* Visual Flow */}
            <svg viewBox="0 0 900 300" className="w-full">
              {/* Components */}
              {[
                { id: 'user', x: 50, y: 130, label: 'User/kubectl', color: '#6366f1' },
                { id: 'apiserver', x: 200, y: 130, label: 'API Server', color: '#0ea5e9' },
                { id: 'etcd', x: 200, y: 230, label: 'etcd', color: '#f59e0b' },
                { id: 'controller', x: 400, y: 130, label: 'Controllers', color: '#8b5cf6' },
                { id: 'scheduler', x: 550, y: 130, label: 'Scheduler', color: '#ec4899' },
                { id: 'kubelet', x: 700, y: 130, label: 'Kubelet', color: '#10b981' },
                { id: 'runtime', x: 700, y: 230, label: 'Runtime', color: '#14b8a6' },
                { id: 'kubeproxy', x: 850, y: 130, label: 'kube-proxy', color: '#f97316' }
              ].map(comp => (
                <g key={comp.id}>
                  <rect x={comp.x - 50} y={comp.y - 25} width="100" height="50" rx="8"
                    fill={flowSteps[flowStep].active?.includes(comp.id) ? comp.color : '#1e293b'}
                    stroke={comp.color} strokeWidth="2"
                    className="transition-all duration-500"/>
                  <text x={comp.x} y={comp.y + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{comp.label}</text>
                </g>
              ))}
              {/* Arrows */}
              <g stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
                <defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/></marker></defs>
                <path d="M 100 130 L 140 130"/>
                <path d="M 250 155 L 250 205"/>
                <path d="M 250 130 L 340 130"/>
                <path d="M 450 130 L 490 130"/>
                <path d="M 600 130 L 640 130"/>
                <path d="M 750 155 L 750 205"/>
                <path d="M 750 130 L 790 130"/>
              </g>
            </svg>
          </div>
        )}

        {/* ==================== INGRESS VIEW ==================== */}
        {activeView === 'ingress' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">🌐 Ingress Traffic Flow</h2>
              <div className="flex gap-2">
                <button onClick={() => setIngressStep(s => Math.max(0, s - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">← Prev</button>
                <button onClick={() => { setIngressStep(0); setIsIngressPlaying(true); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg">▶️ Play</button>
                <button onClick={() => setIngressStep(s => Math.min(5, s + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">Next →</button>
              </div>
            </div>

            {/* Step Info */}
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-2">Step {ingressStep + 1}: {ingressSteps[ingressStep].label}</h3>
              <p className="text-slate-300">{ingressSteps[ingressStep].description}</p>
            </div>

            {/* Visual Flow */}
            <svg viewBox="0 0 900 250" className="w-full">
              {[
                { id: 'user', x: 80, y: 100, label: '🌍 Internet', active: ingressStep >= 0 },
                { id: 'loadbalancer', x: 220, y: 100, label: '⚖️ Load Balancer', active: ingressStep >= 1 },
                { id: 'ingress', x: 380, y: 100, label: '🚪 Ingress Controller', active: ingressStep >= 2 },
                { id: 'service', x: 540, y: 100, label: '🔗 Service', active: ingressStep >= 3 },
                { id: 'endpoints', x: 700, y: 100, label: '📍 Endpoints', active: ingressStep >= 4 },
                { id: 'pod', x: 840, y: 100, label: '📦 Pod', active: ingressStep >= 5 }
              ].map((comp, i) => (
                <g key={comp.id}>
                  <rect x={comp.x - 60} y={comp.y - 30} width="120" height="60" rx="8"
                    fill={comp.active ? '#0ea5e9' : '#1e293b'}
                    stroke={comp.active ? '#38bdf8' : '#475569'} strokeWidth="2"
                    className="transition-all duration-500"/>
                  <text x={comp.x} y={comp.y + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{comp.label}</text>
                  {i < 5 && <path d={`M ${comp.x + 60} ${comp.y} L ${comp.x + 80} ${comp.y}`} stroke={ingressStep > i ? '#38bdf8' : '#475569'} strokeWidth="2" markerEnd="url(#arrow)" className="transition-all"/>}
                </g>
              ))}
              
              {/* Example Request */}
              <text x="450" y="200" textAnchor="middle" fill="#94a3b8" fontSize="12">
                GET https://app.example.com/api/users → 10.0.1.5:8080
              </text>
            </svg>

            {/* Ingress YAML Example */}
            <div className="mt-6 bg-slate-900 rounded-lg p-4">
              <h4 className="text-sm font-bold text-purple-400 mb-2">Example Ingress Resource</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto">{`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80`}</pre>
            </div>
          </div>
        )}

        {/* ==================== POD LIFECYCLE VIEW ==================== */}
        {activeView === 'lifecycle' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">🔁 Pod Lifecycle</h2>
              <div className="flex gap-2">
                <button onClick={() => setLifecyclePhase(s => Math.max(0, s - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">← Prev</button>
                <button onClick={() => { setLifecyclePhase(0); setIsLifecyclePlaying(true); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg">▶️ Play</button>
                <button onClick={() => setLifecyclePhase(s => Math.min(5, s + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">Next →</button>
              </div>
            </div>

            {/* Phase Visualization */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {lifecyclePhases.map((phase, i) => (
                <div key={phase.name} className="flex items-center">
                  <div className={`px-4 py-3 rounded-lg text-center transition-all duration-500 ${
                    i === lifecyclePhase ? 'scale-110 shadow-lg' : i < lifecyclePhase ? 'opacity-50' : 'opacity-30'
                  }`} style={{ backgroundColor: i <= lifecyclePhase ? phase.color : '#1e293b', minWidth: '120px' }}>
                    <div className="font-bold text-white text-sm">{phase.name}</div>
                  </div>
                  {i < lifecyclePhases.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${i < lifecyclePhase ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
                  )}
                </div>
              ))}
            </div>

            {/* Current Phase Detail */}
            <div className="bg-slate-900 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2" style={{ color: lifecyclePhases[lifecyclePhase].color }}>
                {lifecyclePhases[lifecyclePhase].name}
              </h3>
              <p className="text-slate-300 mb-4">{lifecyclePhases[lifecyclePhase].description}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <h4 className="text-sm font-bold text-cyan-400 mb-2">Check Status</h4>
                  <code className="text-xs text-slate-300">kubectl get pod &lt;name&gt; -o wide</code>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <h4 className="text-sm font-bold text-cyan-400 mb-2">Watch Events</h4>
                  <code className="text-xs text-slate-300">kubectl describe pod &lt;name&gt;</code>
                </div>
              </div>
            </div>

            {/* Lifecycle Hooks */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-400 mb-2">🚀 postStart Hook</h4>
                <p className="text-sm text-slate-400">Runs immediately after container created. Blocks until complete.</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-red-500/30">
                <h4 className="font-bold text-red-400 mb-2">🛑 preStop Hook</h4>
                <p className="text-sm text-slate-400">Runs before SIGTERM. Use for graceful shutdown (drain connections).</p>
              </div>
            </div>
          </div>
        )}


        {/* ==================== SCHEDULER VIEW ==================== */}
        {activeView === 'scheduler' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">📋 Scheduler Deep Dive</h2>
              <div className="flex gap-2">
                <button onClick={() => setSchedulerStep(0)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">Reset</button>
              </div>
            </div>

            <p className="text-slate-400 mb-6">Click each step to see how the scheduler narrows down node selection through filtering and scoring.</p>

            {/* Funnel Visualization */}
            <div className="space-y-3">
              {schedulerSteps.map((step, i) => (
                <div key={i} 
                  onClick={() => setSchedulerStep(i)}
                  className={`cursor-pointer transition-all ${i <= schedulerStep ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <span className={`text-2xl font-bold ${i === schedulerStep ? 'text-cyan-400' : 'text-slate-500'}`}>{step.count}</span>
                      <span className="text-slate-500 text-sm ml-1">nodes</span>
                    </div>
                    <div className="flex-1 relative">
                      <div className="h-12 rounded-lg flex items-center px-4 transition-all"
                        style={{ 
                          width: `${Math.max(20, step.count)}%`,
                          backgroundColor: i === schedulerStep ? '#0ea5e9' : i < schedulerStep ? '#059669' : '#1e293b'
                        }}>
                        <span className="font-medium text-white text-sm">{step.label}</span>
                      </div>
                    </div>
                  </div>
                  {i === schedulerStep && (
                    <div className="ml-28 mt-2 p-3 bg-slate-900 rounded-lg border-l-4 border-cyan-500">
                      <p className="text-sm text-slate-300">{step.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{step.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Scheduler Config Example */}
            <div className="mt-6 bg-slate-900 rounded-lg p-4">
              <h4 className="text-sm font-bold text-purple-400 mb-2">Pod Scheduling Constraints Example</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto">{`spec:
  nodeSelector:
    disk: ssd
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: zone
            operator: In
            values: [us-east-1a, us-east-1b]
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: database
        topologyKey: kubernetes.io/hostname
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "monitoring"
    effect: "NoSchedule"`}</pre>
            </div>
          </div>
        )}

        {/* ==================== RBAC VIEW ==================== */}
        {activeView === 'rbac' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">🔐 RBAC Visualizer</h2>
              <select 
                value={selectedRbacScenario}
                onChange={(e) => { setSelectedRbacScenario(Number(e.target.value)); setRbacStep(0); }}
                className="px-3 py-1.5 bg-slate-700 rounded-lg text-white">
                {rbacScenarios.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
              </select>
            </div>

            {/* RBAC Flow */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {['User/SA', 'RoleBinding', 'Role', 'Verbs', 'Resources'].map((step, i) => (
                <React.Fragment key={step}>
                  <div 
                    onClick={() => setRbacStep(i)}
                    className={`px-4 py-3 rounded-lg cursor-pointer transition-all ${
                      i <= rbacStep ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
                    } ${i === rbacStep ? 'ring-2 ring-purple-400 scale-105' : ''}`}>
                    <div className="text-xs opacity-70">Step {i + 1}</div>
                    <div className="font-bold">{step}</div>
                  </div>
                  {i < 4 && <div className={`w-8 h-0.5 ${i < rbacStep ? 'bg-purple-500' : 'bg-slate-600'}`}/>}
                </React.Fragment>
              ))}
            </div>

            {/* Current Scenario */}
            <div className={`bg-slate-900 rounded-lg p-6 border-2 ${rbacScenarios[selectedRbacScenario].allowed ? 'border-emerald-500' : 'border-red-500'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{rbacScenarios[selectedRbacScenario].name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${rbacScenarios[selectedRbacScenario].allowed ? 'bg-emerald-600' : 'bg-red-600'}`}>
                  {rbacScenarios[selectedRbacScenario].allowed ? '✓ ALLOWED' : '✗ DENIED'}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-xs text-slate-400">User</div>
                  <div className="font-mono text-cyan-400">{rbacScenarios[selectedRbacScenario].user}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-xs text-slate-400">Verb</div>
                  <div className="font-mono text-purple-400">{rbacScenarios[selectedRbacScenario].verb}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-xs text-slate-400">Resource</div>
                  <div className="font-mono text-emerald-400">{rbacScenarios[selectedRbacScenario].resource}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-xs text-slate-400">Namespace</div>
                  <div className="font-mono text-amber-400">{rbacScenarios[selectedRbacScenario].namespace}</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-800 rounded">
                <code className="text-sm text-slate-300">
                  kubectl auth can-i {rbacScenarios[selectedRbacScenario].verb} {rbacScenarios[selectedRbacScenario].resource} -n {rbacScenarios[selectedRbacScenario].namespace} --as={rbacScenarios[selectedRbacScenario].user}
                </code>
              </div>
            </div>

            {/* RBAC Resources */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="font-bold text-amber-400 mb-2">Role (Namespaced)</h4>
                <pre className="text-xs text-slate-300">{`apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]`}</pre>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="font-bold text-purple-400 mb-2">RoleBinding</h4>
                <pre className="text-xs text-slate-300">{`apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: dev
subjects:
- kind: User
  name: dev@company.com
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STORAGE VIEW ==================== */}
        {activeView === 'storage' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">💾 Storage Architecture</h2>
              <select 
                value={selectedStorageClass}
                onChange={(e) => setSelectedStorageClass(e.target.value)}
                className="px-3 py-1.5 bg-slate-700 rounded-lg text-white">
                {storageClasses.map(sc => <option key={sc.name} value={sc.name}>{sc.name}</option>)}
              </select>
            </div>

            {/* Storage Flow */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {['StorageClass', 'PV', 'PVC', 'Pod'].map((step, i) => (
                <React.Fragment key={step}>
                  <div 
                    onClick={() => setStorageStep(i)}
                    className={`w-32 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                      i <= storageStep ? 'bg-indigo-600' : 'bg-slate-700'
                    } ${i === storageStep ? 'ring-2 ring-indigo-400 scale-105' : ''}`}>
                    <div className="text-2xl">{['📁', '💿', '📋', '📦'][i]}</div>
                    <div className="font-bold text-white mt-1">{step}</div>
                  </div>
                  {i < 3 && (
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-0.5 ${i < storageStep ? 'bg-indigo-500' : 'bg-slate-600'}`}/>
                      <div className="text-xs text-slate-500 mt-1">{['provisions', 'binds', 'mounts'][i]}</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Storage Class Details */}
            {(() => {
              const sc = storageClasses.find(s => s.name === selectedStorageClass);
              return (
                <div className="bg-slate-900 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-indigo-400 mb-3">StorageClass: {sc.name}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-3 rounded"><span className="text-slate-400 text-sm">Provisioner</span><div className="font-mono text-cyan-400">{sc.provisioner}</div></div>
                    <div className="bg-slate-800 p-3 rounded"><span className="text-slate-400 text-sm">Type</span><div className="font-mono text-emerald-400">{sc.type}</div></div>
                    <div className="bg-slate-800 p-3 rounded"><span className="text-slate-400 text-sm">IOPS</span><div className="font-mono text-amber-400">{sc.iops}</div></div>
                    <div className="bg-slate-800 p-3 rounded"><span className="text-slate-400 text-sm">Throughput</span><div className="font-mono text-purple-400">{sc.throughput}</div></div>
                    <div className="bg-slate-800 p-3 rounded"><span className="text-slate-400 text-sm">Reclaim Policy</span><div className="font-mono text-red-400">{sc.reclaimPolicy}</div></div>
                  </div>
                </div>
              );
            })()}

            {/* PVC Example */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="font-bold text-purple-400 mb-2">PersistentVolumeClaim</h4>
                <pre className="text-xs text-slate-300">{`apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ${selectedStorageClass}
  resources:
    requests:
      storage: 10Gi`}</pre>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <h4 className="font-bold text-emerald-400 mb-2">Pod Volume Mount</h4>
                <pre className="text-xs text-slate-300">{`spec:
  containers:
  - name: app
    volumeMounts:
    - name: data
      mountPath: /var/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: data-pvc`}</pre>
              </div>
            </div>
          </div>
        )}


        {/* ==================== HPA VIEW ==================== */}
        {activeView === 'hpa' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">📈 HPA Simulator</h2>
              <button 
                onClick={() => setIsHpaSimulating(s => !s)}
                className={`px-4 py-2 rounded-lg font-medium ${isHpaSimulating ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                {isHpaSimulating ? '⏹ Stop Simulation' : '▶️ Start Simulation'}
              </button>
            </div>

            {/* Metric Visualization */}
            <div className="bg-slate-900 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">CPU Utilization</h3>
                <span className="text-2xl font-bold" style={{ color: hpaMetric > 80 ? '#ef4444' : hpaMetric > 60 ? '#f59e0b' : '#10b981' }}>
                  {Math.round(hpaMetric)}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-8 bg-slate-700 rounded-lg overflow-hidden mb-4 relative">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${hpaMetric}%`,
                    backgroundColor: hpaMetric > 80 ? '#ef4444' : hpaMetric > 60 ? '#f59e0b' : '#10b981'
                  }}
                />
                {/* Target Line */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: '50%' }}/>
                <span className="absolute text-xs text-white" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>Target: 50%</span>
              </div>

              {/* Manual Control */}
              <input 
                type="range" min="10" max="95" value={hpaMetric}
                onChange={(e) => setHpaMetric(Number(e.target.value))}
                className="w-full"
                disabled={isHpaSimulating}
              />
            </div>

            {/* Replica Visualization */}
            <div className="bg-slate-900 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Replicas</h3>
                <span className="text-2xl font-bold text-cyan-400">{hpaReplicas} / 5</span>
              </div>
              
              <div className="flex gap-3 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <div 
                    key={i}
                    className={`w-16 h-20 rounded-lg flex items-center justify-center text-3xl transition-all duration-500 ${
                      i <= hpaReplicas ? 'bg-emerald-600 scale-100' : 'bg-slate-700 scale-90 opacity-40'
                    }`}>
                    📦
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-sm text-slate-400">
                {hpaMetric > 80 ? '🔥 High load - scaling up!' : 
                 hpaMetric > 60 ? '⚠️ Moderate load - considering scale up' :
                 hpaMetric < 30 ? '💤 Low load - could scale down' : '✅ Optimal utilization'}
              </div>
            </div>

            {/* HPA YAML */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h4 className="font-bold text-purple-400 mb-2">HorizontalPodAutoscaler</h4>
              <pre className="text-xs text-slate-300">{`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50`}</pre>
            </div>
          </div>
        )}

        {/* ==================== NETWORKING VIEW ==================== */}
        {activeView === 'networking' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">🔌 Kubernetes Networking</h2>

            {/* Service Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { type: 'ClusterIP', desc: 'Internal only. Default. Virtual IP via iptables.', icon: '🔒', color: 'cyan' },
                { type: 'NodePort', desc: 'Exposes on each node IP:30000-32767', icon: '🚪', color: 'emerald' },
                { type: 'LoadBalancer', desc: 'Cloud LB + NodePort + ClusterIP', icon: '⚖️', color: 'purple' }
              ].map(svc => (
                <div key={svc.type} className={`bg-slate-900 rounded-lg p-4 border-l-4 border-${svc.color}-500`}>
                  <div className="text-2xl mb-2">{svc.icon}</div>
                  <h3 className={`font-bold text-${svc.color}-400`}>{svc.type}</h3>
                  <p className="text-sm text-slate-400 mt-1">{svc.desc}</p>
                </div>
              ))}
            </div>

            {/* Network Policy */}
            <div className="bg-slate-900 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-amber-400 mb-4">🛡️ Network Policy</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Default: Allow All</h4>
                  <p className="text-sm text-slate-400 mb-3">Without NetworkPolicy, all pods can talk to all pods.</p>
                  <h4 className="font-medium text-white mb-2">With Policy: Deny by Default</h4>
                  <p className="text-sm text-slate-400">Empty ingress/egress = deny all. Then whitelist.</p>
                </div>
                <pre className="text-xs text-slate-300 bg-slate-800 p-3 rounded">{`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - port: 8080`}</pre>
              </div>
            </div>

            {/* CNI Comparison */}
            <div className="bg-slate-900 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-400 mb-4">🔌 CNI Plugins Comparison</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-700">
                    <th className="pb-2">Plugin</th>
                    <th className="pb-2">Network Policy</th>
                    <th className="pb-2">Encryption</th>
                    <th className="pb-2">Best For</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800"><td className="py-2 text-cyan-400">Flannel</td><td>❌</td><td>❌</td><td>Simple, small clusters</td></tr>
                  <tr className="border-b border-slate-800"><td className="py-2 text-emerald-400">Calico</td><td>✅</td><td>✅ WireGuard</td><td>Enterprise, policy-heavy</td></tr>
                  <tr className="border-b border-slate-800"><td className="py-2 text-purple-400">Cilium</td><td>✅ L7</td><td>✅ WireGuard</td><td>eBPF, observability</td></tr>
                  <tr><td className="py-2 text-amber-400">Weave</td><td>✅</td><td>✅ NaCl</td><td>Multi-cloud, mesh</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TROUBLESHOOTING VIEW ==================== */}
        {activeView === 'troubleshooting' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">🔧 Troubleshooting Guide</h2>

            {/* AI Troubleshooter */}
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg p-4 mb-6 border border-purple-500/30">
              <h3 className="font-bold text-purple-400 mb-3">⚡ Smart Troubleshooter (AI)</h3>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={troubleshootQuery}
                  onChange={(e) => setTroubleshootQuery(e.target.value)}
                  placeholder="Describe your issue: e.g., 'CrashLoopBackOff on my database pod'"
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button 
                  onClick={handleAiTroubleshoot}
                  disabled={isAiLoading || !troubleshootQuery}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg font-medium">
                  {isAiLoading ? '🔄' : '🔍'} Diagnose
                </button>
              </div>
              {aiError && <p className="mt-2 text-red-400 text-sm">{aiError}</p>}
              {aiResponse && (
                <div className="mt-3 p-4 bg-slate-900 rounded-lg text-sm text-slate-300 whitespace-pre-wrap border border-purple-500/20">
                  {aiResponse}
                </div>
              )}
            </div>

            {/* Decision Trees */}
            <div className="space-y-4">
              {troubleshootingScenarios.map(scenario => (
                <details key={scenario.id} className="bg-slate-900 rounded-lg overflow-hidden group">
                  <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-slate-800">
                    <div>
                      <h3 className="font-bold text-amber-400">{scenario.title}</h3>
                      <p className="text-sm text-slate-400">{scenario.symptom}</p>
                    </div>
                    <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-0 space-y-3">
                    {scenario.causes.map((cause, i) => (
                      <div key={i} className="bg-slate-800 rounded-lg p-3">
                        <div className="font-medium text-white mb-1">❓ {cause.cause}</div>
                        <div className="text-sm text-slate-400 mb-2">
                          <strong className="text-cyan-400">Check:</strong> {cause.check}
                        </div>
                        <div className="text-sm text-emerald-400">
                          <strong>Fix:</strong> {cause.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}


        {/* ==================== QUIZ VIEW ==================== */}
        {activeView === 'quiz' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">❓ Knowledge Quiz</h2>
              <div className="flex items-center gap-4">
                <select 
                  value={quizCategory}
                  onChange={(e) => { setQuizCategory(e.target.value); restartQuiz(); }}
                  className="px-3 py-1.5 bg-slate-700 rounded-lg text-white">
                  <option value="all">All Topics</option>
                  <option value="architecture">Architecture</option>
                  <option value="networking">Networking</option>
                  <option value="scheduling">Scheduling</option>
                  <option value="storage">Storage</option>
                  <option value="rbac">RBAC</option>
                </select>
                <div className="text-lg">
                  Score: <span className="font-bold text-emerald-400">{quizScore}</span>
                  <span className="text-slate-500">/{getFilteredQuizQuestions().length}</span>
                </div>
              </div>
            </div>

            {showQuizResult ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{quizScore >= getFilteredQuizQuestions().length * 0.8 ? '🎉' : quizScore >= getFilteredQuizQuestions().length * 0.5 ? '👍' : '📚'}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {quizScore >= getFilteredQuizQuestions().length * 0.8 ? 'Excellent!' : quizScore >= getFilteredQuizQuestions().length * 0.5 ? 'Good Job!' : 'Keep Learning!'}
                </h3>
                <p className="text-slate-400 mb-6">You scored {quizScore} out of {getFilteredQuizQuestions().length}</p>
                <button onClick={restartQuiz} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium">
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {/* Progress */}
                <div className="flex gap-1 mb-6">
                  {getFilteredQuizQuestions().map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded ${i === currentQuestion ? 'bg-cyan-500' : i < currentQuestion ? 'bg-emerald-500' : 'bg-slate-700'}`}/>
                  ))}
                </div>

                {/* Question */}
                <div className="bg-slate-900 rounded-lg p-6 mb-6">
                  <div className="text-sm text-slate-400 mb-2">Question {currentQuestion + 1} of {getFilteredQuizQuestions().length}</div>
                  <h3 className="text-xl font-bold text-white">{getFilteredQuizQuestions()[currentQuestion]?.q}</h3>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getFilteredQuizQuestions()[currentQuestion]?.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuizAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 rounded-lg text-left font-medium transition-all ${
                        selectedAnswer === null 
                          ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                          : i === getFilteredQuizQuestions()[currentQuestion].correct
                            ? 'bg-emerald-600 text-white'
                            : selectedAnswer === i
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-700 text-slate-400'
                      }`}>
                      <span className="mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== CKA PREP VIEW ==================== */}
        {activeView === 'cka' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">🎓 CKA/CKAD Prep</h2>
              {isCkaActive && (
                <div className={`text-2xl font-mono font-bold ${ckaTimer < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  ⏱️ {Math.floor(ckaTimer / 60)}:{(ckaTimer % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>

            {!isCkaActive ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ckaScenarios.map((scenario, i) => (
                  <div key={scenario.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-cyan-500 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{scenario.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        scenario.difficulty === 'Hard' ? 'bg-red-600' : scenario.difficulty === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}>{scenario.difficulty}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{scenario.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">⏱️ {Math.floor(scenario.timeLimit / 60)} min</span>
                      <button 
                        onClick={() => startCkaScenario(i)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium">
                        Start Challenge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Active Scenario */}
                <div className="bg-slate-900 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-amber-400 mb-2">{ckaScenarios[ckaScenario].title}</h3>
                  <p className="text-slate-300 mb-4">{ckaScenarios[ckaScenario].description}</p>
                  
                  <h4 className="font-bold text-white mb-2">Tasks:</h4>
                  <ul className="space-y-2 mb-4">
                    {ckaScenarios[ckaScenario].tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          checked={ckaAnswers[i] || false}
                          onChange={(e) => setCkaAnswers(prev => ({ ...prev, [i]: e.target.checked }))}
                          className="w-5 h-5 rounded"
                        />
                        <span className={ckaAnswers[i] ? 'text-emerald-400 line-through' : 'text-slate-300'}>{task}</span>
                      </li>
                    ))}
                  </ul>

                  <details className="bg-slate-800 rounded p-3">
                    <summary className="cursor-pointer text-purple-400 font-medium">💡 Hints</summary>
                    <ul className="mt-2 space-y-1 text-sm text-slate-400">
                      {ckaScenarios[ckaScenario].hints.map((hint, i) => <li key={i}>• {hint}</li>)}
                    </ul>
                  </details>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCkaActive(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
                    ← Back to Scenarios
                  </button>
                  <button 
                    onClick={() => alert(`Solution: ${ckaScenarios[ckaScenario].solution}`)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg">
                    Show Solution
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ==================== MODALS ==================== */}
      
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-slate-600" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-cyan-400 mb-4">⌨️ Keyboard Shortcuts</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['1-9, 0', 'Switch views'],
                ['Q', 'Quiz'],
                ['C', 'CKA Prep'],
                ['?', 'Toggle shortcuts'],
                ['⌘/Ctrl + K', 'Search'],
                ['←/→', 'Navigate steps'],
                ['↑/↓', 'Scheduler steps'],
                ['Space', 'Play/Pause animation'],
                ['Escape', 'Close panels']
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">{key}</kbd>
                  <span className="text-slate-300">{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Close</button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center pt-20 z-50" onClick={() => setShowSearch(false)}>
          <div className="bg-slate-800 rounded-xl p-4 w-full max-w-xl mx-4 border border-slate-600" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-slate-400">🔍</span>
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components, views..."
                className="flex-1 bg-transparent text-white text-lg focus:outline-none"
              />
              <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">ESC</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {handleSearch(searchQuery).map(item => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    if (item.type === 'view') setActiveView(item.id);
                    else { setActiveView('architecture'); setSelectedComponent(item.id); }
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 flex items-center gap-2">
                  <span className="text-slate-400">{item.type === 'view' ? '📑' : '🔧'}</span>
                  <span className="text-white">{item.name}</span>
                  <span className="text-xs text-slate-500 ml-auto">{item.type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-8 text-center text-slate-500 text-sm">
        Built for K8s learners • Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">?</kbd> for shortcuts • 
        <span className="ml-2">{exploredComponents.size}/7 components explored</span>
      </footer>
    </div>
  );
}
