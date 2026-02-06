import React, { useState, useEffect, useCallback, useId } from 'react';

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
  
  // YAML Mapping State
  const [selectedYamlField, setSelectedYamlField] = useState(null);
  const [showYamlPanel, setShowYamlPanel] = useState(false);

  // Ingress State
  const [ingressStep, setIngressStep] = useState(0);
  const [isIngressPlaying, setIsIngressPlaying] = useState(false);

  // Quiz State
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizDifficulty, setQuizDifficulty] = useState('beginner');
  const [quizHistory, setQuizHistory] = useState(() => {
    const saved = localStorage.getItem('k8s-quiz-history');
    return saved ? JSON.parse(saved) : [];
  });

  // Troubleshooting State
  const [troubleshootingSearch, setTroubleshootingSearch] = useState('');
  const [troubleshootingFilter, setTroubleshootingFilter] = useState('all');

  // AI Integration State
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [troubleshootQuery, setTroubleshootQuery] = useState('');
  
  // API Key from environment variable (create .env with VITE_GEMINI_API_KEY=your_key)
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Set page title
  useEffect(() => {
    document.title = "Kubernetes Internals — Interactive Deep Dive";
  }, []);

  const resetAll = useCallback(() => {
    setFlowStep(0);
    setIsFlowPlaying(false);
    setIngressStep(0);
    setIsIngressPlaying(false);
    setSchedulerStep(0);
    setSelectedComponent(null);
    setFailedComponent(null);
    setTrafficSimulation(false);
    setSelectedYamlField(null);
    setTroubleshootingSearch('');
    setTroubleshootingFilter('all');
    setAiResponse(null);
    setAiError(null);
  }, []);

  // ==================== AI INTEGRATION ====================
  
  /**
   * Call Gemini API with exponential backoff retry
   */
  const callGemini = useCallback(async (prompt, maxRetries = 3) => {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Create .env file with VITE_GEMINI_API_KEY=your_key');
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
        if (!text) throw new Error('Empty response from Gemini');
        return text;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    throw lastError;
  }, [GEMINI_API_KEY]);

  /**
   * Get AI explanation for a Kubernetes component
   */
  const handleAiExplain = useCallback(async (componentId, componentDetails) => {
    const component = componentDetails[componentId];
    if (!component) return;

    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    const prompt = `You are a Kubernetes expert teacher. Explain the ${component.name} component.

Context from our learning app:
- Role: ${component.role}
- Analogy: ${component.analogy}
- Key internals: ${component.internals?.slice(0, 3).join('; ')}

Please provide a concise response with:
1. **Beginner Explanation** (2-3 sentences for someone new to K8s)
2. **Production Insight** (one real-world tip from running K8s at scale)
3. **Common Gotcha** (one mistake to avoid)

Keep it practical and under 200 words.`;

    try {
      const response = await callGemini(prompt);
      setAiResponse(response);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setIsAiLoading(false);
    }
  }, [callGemini]);

  /**
   * Smart troubleshooting with AI
   */
  const handleSmartTroubleshoot = useCallback(async () => {
    if (!troubleshootQuery.trim()) return;

    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    const prompt = `You are a Kubernetes troubleshooting expert. A user reports this issue:

"${troubleshootQuery}"

Provide a structured diagnosis:

1. **Most Likely Cause** (one sentence)
2. **Diagnostic Commands** (2-3 kubectl commands to run, with brief explanation)
3. **Quick Fix** (step-by-step resolution, max 4 steps)
4. **Prevention Tip** (how to avoid this in future)

Be concise and actionable. Use markdown formatting.`;

    try {
      const response = await callGemini(prompt);
      setAiResponse(response);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setIsAiLoading(false);
    }
  }, [troubleshootQuery, callGemini]);

  /**
   * Clear AI response
   */
  const clearAiResponse = useCallback(() => {
    setAiResponse(null);
    setAiError(null);
  }, []);

  // Comprehensive keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      // Flow view navigation (left/right arrows and space)
      if (activeView === 'flow') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFlowStep(s => Math.min(7, s + 1));
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFlowStep(s => Math.max(0, s - 1));
        }
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          setIsFlowPlaying(p => !p);
        }
      }
      
      // Ingress view navigation (left/right arrows and space)
      if (activeView === 'ingress') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setIngressStep(s => Math.min(5, s + 1));
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setIngressStep(s => Math.max(0, s - 1));
        }
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          setIsIngressPlaying(p => !p);
        }
      }
      
      // Scheduler view navigation (up/down arrows)
      if (activeView === 'scheduler') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSchedulerStep(s => Math.min(6, s + 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSchedulerStep(s => Math.max(0, s - 1));
        }
      }
      
      // Escape key - clear selections
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        setSelectedComponent(null);
        setFailedComponent(null);
        setTrafficSimulation(false);
        setSelectedYamlField(null);
        if (activeView === 'flow') {
          setIsFlowPlaying(false);
        }
        if (activeView === 'ingress') {
          setIsIngressPlaying(false);
        }
      }
      
      // Number keys 1-7 for view switching
      if (e.key === '1') {
        e.preventDefault();
        setActiveView('architecture');
        resetAll();
      }
      if (e.key === '2') {
        e.preventDefault();
        setActiveView('flow');
        resetAll();
      }
      if (e.key === '3') {
        e.preventDefault();
        setActiveView('scheduler');
        resetAll();
      }
      if (e.key === '4') {
        e.preventDefault();
        setActiveView('networking');
        resetAll();
      }
      if (e.key === '5') {
        e.preventDefault();
        setActiveView('ingress');
        resetAll();
      }
      if (e.key === '6') {
        e.preventDefault();
        setActiveView('troubleshooting');
        resetAll();
      }
      if (e.key === '7') {
        e.preventDefault();
        setActiveView('quiz');
        resetAll();
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeView, resetAll]);

  // Auto-advance flow animation
  useEffect(() => {
    if (isFlowPlaying && flowStep < 7) {
      const timer = setTimeout(() => setFlowStep(f => f + 1), 1800);
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

  // Traffic Simulation Effect
  useEffect(() => {
    if (trafficSimulation) {
      const timer = setTimeout(() => setTrafficSimulation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trafficSimulation]);

  const componentDetails = {
    apiserver: {
      name: 'kube-apiserver',
      role: 'The Front Door & Traffic Cop',
      analogy: 'Think of it as the receptionist at a hospital - every request (patient) must check in here first. It validates identity, checks permissions, and routes to the right department.',
      internals: [
        'Stateless - scales horizontally behind a load balancer',
        'Only component that touches etcd directly',
        'Runs Admission Controllers (mutating → validating) before persisting',
        'All cluster communication flows through here - components never talk directly'
      ],
      flow: 'kubectl apply → AuthN → AuthZ (RBAC) → Admission → etcd write → Watch notification to controllers',
      scaleNote: '⚠️ Horizontal scaling required at ~500 nodes. Tune --max-requests-inflight.',
      failure: {
        symptom: 'All kubectl commands hang or timeout',
        impact: 'Complete cluster management blackout. Running pods continue but no changes possible.',
        check: 'kubectl cluster-info; curl -k https://<master>:6443/healthz',
        recovery: 'Check API server pod logs, verify etcd connectivity, check certificates'
      },
      yamlFields: ['apiVersion', 'kind', 'metadata']
    },
    etcd: {
      name: 'etcd',
      role: 'The Source of Truth',
      analogy: 'The hospital\'s medical records system. If this burns down, you lose who every patient is, what treatments they need, everything. Raft consensus = multiple copies in different buildings.',
      internals: [
        'Key-value store using Raft consensus (3 or 5 node quorum)',
        'Stores ENTIRE cluster state: nodes, pods, configmaps, secrets, everything',
        'Watches enable reactive updates - controllers subscribe to changes',
        'Performance bottleneck at scale - limit to ~100 pods/second creation'
      ],
      flow: 'Write → Leader receives → Replicates to quorum → Commit → ACK back',
      scaleNote: '🔴 CRITICAL: Never exceed 5 nodes. 3-node = survives 1 failure.',
      failure: {
        symptom: 'Cluster completely frozen. API server returns 500s.',
        impact: 'CATASTROPHIC. All state lost if no backup. Cluster unrecoverable without restore.',
        check: 'etcdctl endpoint health; etcdctl member list',
        recovery: 'Restore from snapshot: etcdctl snapshot restore. Prevent: automated backups to S3/GCS.'
      },
      yamlFields: ['metadata.name', 'metadata.namespace', 'metadata.labels']
    },
    scheduler: {
      name: 'kube-scheduler',
      role: 'The Assignment Engine',
      analogy: 'Like a hotel concierge assigning rooms. Guest (pod) arrives, concierge checks which rooms fit (filtering), then picks the best one based on preferences (scoring).',
      internals: [
        'Watches for Pods with spec.nodeName = empty',
        'Filter phase: hard constraints (taints, affinity, resources)',
        'Score phase: soft preferences (spread, bin-packing)',
        'Binding: writes decision back to API server'
      ],
      flow: 'New Pod detected → Filter nodes → Score remaining → Select winner → Bind to node',
      scaleNote: '⚡ Single scheduler handles ~5000 nodes. Use multiple for multi-tenancy.',
      failure: {
        symptom: 'All new pods stuck in Pending state forever',
        impact: 'No new workloads scheduled. Existing pods unaffected.',
        check: 'kubectl get pods -n kube-system | grep scheduler',
        recovery: 'Scheduler is stateless - just restart it. Check for resource exhaustion.'
      },
      yamlFields: ['spec.nodeSelector', 'spec.affinity', 'spec.tolerations']
    },
    controller: {
      name: 'kube-controller-manager',
      role: 'The Reconciliation Army',
      analogy: 'A team of janitors who each have one job: "Keep X clean." Deployment janitor ensures 3 replicas. Node janitor marks dead nodes. They work independently, reacting to etcd changes.',
      internals: [
        'Single binary running ~30+ controllers in goroutines',
        'Each controller watches specific resources via API server',
        'Node controller: 5-minute timeout → mark NotReady → evict pods',
        'ReplicaSet controller: diff current vs desired, create/delete pods'
      ],
      flow: 'Watch event → Read desired state → Read actual state → Diff → Act → Loop',
      scaleNote: '⚙️ Most controllers are leader-elected. Only one active at a time.',
      failure: {
        symptom: 'Deployments don\'t scale, dead nodes not detected, endpoints not updated',
        impact: 'Cluster drift. Desired state diverges from actual state.',
        check: 'kubectl get pods -n kube-system | grep controller',
        recovery: 'Restart controller-manager. State will reconcile automatically.'
      },
      yamlFields: ['spec.replicas', 'spec.selector', 'spec.strategy']
    },
    kubelet: {
      name: 'kubelet',
      role: 'The Node Captain',
      analogy: 'The site foreman on a construction site. HQ (control plane) sends blueprints (PodSpecs), foreman makes sure the actual building matches. Reports status back up.',
      internals: [
        'Runs on every node as a systemd service (not a pod!)',
        'Talks to Container Runtime via CRI (gRPC)',
        'Manages probes: Liveness (restart?), Readiness (route traffic?), Startup (delay probes?)',
        'Reports node status (capacity, conditions) every 10s'
      ],
      flow: 'Watch for PodSpecs → Pull images → Create sandbox → Start containers → Monitor → Report',
      scaleNote: '📊 Each kubelet handles ~110 pods max by default. Tune --max-pods.',
      failure: {
        symptom: 'Node shows NotReady. Pods on that node evicted after 5 minutes.',
        impact: 'Single node failure. Pods rescheduled elsewhere (if resources available).',
        check: 'systemctl status kubelet; journalctl -u kubelet -f',
        recovery: 'Check disk pressure, memory, kubelet certificates, container runtime health.'
      },
      yamlFields: ['spec.containers', 'spec.volumes', 'spec.restartPolicy']
    },
    kubeproxy: {
      name: 'kube-proxy',
      role: 'The Network Plumber',
      analogy: 'Like the building\'s HVAC routing system. When you call "billing department" (Service), it routes your call to one of the actual desks (Pod IPs) in that department.',
      internals: [
        'Implements Services by programming node network rules',
        'iptables mode: O(n) rules - each Service = more latency at scale',
        'IPVS mode: O(1) lookup via kernel hash table - use this at scale',
        'Does NOT proxy traffic - just sets up rules so kernel handles it'
      ],
      flow: 'Watch Services/Endpoints → Update iptables/IPVS → Traffic flows via kernel',
      scaleNote: '🚨 Switch to IPVS mode beyond 1000 Services. iptables = O(n) bottleneck.',
      failure: {
        symptom: 'Services unreachable. ClusterIP connections timeout.',
        impact: 'Service discovery broken on affected nodes. Pod-to-pod still works.',
        check: 'kubectl get pods -n kube-system | grep proxy; iptables -t nat -L | grep KUBE',
        recovery: 'Restart kube-proxy. Check for iptables rule corruption.'
      },
      yamlFields: ['spec.ports', 'spec.selector', 'spec.type']
    },
    runtime: {
      name: 'Container Runtime',
      role: 'The Execution Engine',
      analogy: 'The actual construction workers. Kubelet says "build this container," runtime actually pulls materials (images) and constructs it (namespaces, cgroups).',
      internals: [
        'containerd is the standard (Docker is now just a shim around it)',
        'Uses OCI images and runtimes (runc for Linux namespaces)',
        'Handles image pulling, layer caching, lifecycle management',
        'CRI-O is the lightweight alternative for pure Kubernetes'
      ],
      flow: 'CRI call → Pull image layers → Create namespaces → Apply cgroups → Start process',
      scaleNote: '💾 Image pull parallelism defaults to 5. Increase for large clusters.',
      failure: {
        symptom: 'Pods stuck in ContainerCreating. ImagePullBackOff errors.',
        impact: 'No new containers on affected node. Existing containers may continue.',
        check: 'crictl ps; crictl info; systemctl status containerd',
        recovery: 'Restart containerd. Check disk space, registry connectivity, image pull secrets.'
      },
      yamlFields: ['spec.containers[].image', 'spec.containers[].resources', 'spec.containers[].ports']
    }
  };

  // YAML field to component mapping
  const yamlFieldMapping = {
    'apiVersion': { component: 'apiserver', desc: 'API Server validates version and routes to correct API group' },
    'kind': { component: 'apiserver', desc: 'Determines which controller will handle this resource' },
    'metadata.name': { component: 'etcd', desc: 'Stored as key in etcd: /registry/{kind}/{namespace}/{name}' },
    'metadata.namespace': { component: 'etcd', desc: 'Partition key - isolates resources logically' },
    'metadata.labels': { component: 'etcd', desc: 'Indexed for fast label selector queries' },
    'spec.replicas': { component: 'controller', desc: 'ReplicaSet controller reconciles actual vs desired count' },
    'spec.selector': { component: 'controller', desc: 'Controller uses this to find pods it owns' },
    'spec.strategy': { component: 'controller', desc: 'Deployment controller uses for rolling update logic' },
    'spec.nodeSelector': { component: 'scheduler', desc: 'Hard constraint - filter phase eliminates non-matching nodes' },
    'spec.affinity': { component: 'scheduler', desc: 'Soft/hard constraints for node and pod placement' },
    'spec.tolerations': { component: 'scheduler', desc: 'Allows scheduling on tainted nodes' },
    'spec.containers': { component: 'kubelet', desc: 'Kubelet creates these via CRI calls to runtime' },
    'spec.containers[].image': { component: 'runtime', desc: 'Runtime pulls from registry, caches layers' },
    'spec.containers[].resources': { component: 'scheduler', desc: 'Scheduler uses for bin-packing; kubelet enforces via cgroups' },
    'spec.volumes': { component: 'kubelet', desc: 'Kubelet mounts volumes before starting containers' },
    'spec.restartPolicy': { component: 'kubelet', desc: 'Kubelet decides whether to restart failed containers' },
    'spec.ports': { component: 'kubeproxy', desc: 'kube-proxy creates iptables/IPVS rules for Service' },
    'spec.type': { component: 'kubeproxy', desc: 'Determines ClusterIP/NodePort/LoadBalancer behavior' }
  };

  const sampleDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-app
  namespace: production
  labels:
    app: nginx
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate
  template:
    spec:
      nodeSelector:
        disk: ssd
      tolerations:
        - key: "dedicated"
          value: "frontend"
      containers:
        - name: nginx
          image: nginx:1.21
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
          ports:
            - containerPort: 80
      volumes:
        - name: config
          configMap:
            name: nginx-config`;

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
    { id: 0, label: 'External Request Arrives', description: 'HTTP request hits cloud load balancer or node IP on port 80/443' },
    { id: 1, label: 'Ingress Controller Receives', description: 'NGINX/Traefik/etc pod receives traffic, reads Ingress rules from API server' },
    { id: 2, label: 'Host/Path Matching', description: 'Controller matches request Host header and URL path to Ingress rules' },
    { id: 3, label: 'Service Resolution', description: 'Ingress routes to backend Service. Controller looks up Endpoints.' },
    { id: 4, label: 'Pod Selection', description: 'Controller selects a ready Pod IP from Endpoints (load balancing)' },
    { id: 5, label: 'Direct Pod Connection', description: 'Traffic proxied directly to Pod IP:Port, bypassing kube-proxy' }
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

  const quizQuestions = {
    beginner: [
      { q: "Which component is the only one that communicates directly with etcd?", options: ["kube-scheduler", "kube-apiserver", "kubelet", "kube-controller-manager"], correct: 1 },
      { q: "If you have 1000 Services, which kube-proxy mode should you use?", options: ["userspace", "iptables", "IPVS", "ebpf-lite"], correct: 2 },
      { q: "Which is NOT a phase in the Pod lifecycle?", options: ["Pending", "ContainerCreating", "Running", "Compiling"], correct: 3 },
      { q: "What happens if a Pod lacks a Toleration for a node's Taint?", options: ["Pod warns but schedules", "Pod rejected from that node", "Pod crashes", "Node deletes Pod"], correct: 1 },
      { q: "Which component talks to the container runtime via CRI?", options: ["kube-proxy", "etcd", "kubelet", "Cloud Controller"], correct: 2 },
      { q: "Where does an Ingress Controller get its routing rules from?", options: ["ConfigMap only", "API Server (Ingress resources)", "CoreDNS", "kube-proxy"], correct: 1 },
      { q: "What key format does etcd use to store a Pod named 'web' in namespace 'prod'?", options: ["/pods/prod/web", "/registry/pods/prod/web", "/v1/pods/web", "/api/pods/prod-web"], correct: 1 }
    ],
    intermediate: [
      { q: "What is the primary difference between a DaemonSet and a Deployment?", options: ["DaemonSets use more memory", "DaemonSets run one pod per node", "DaemonSets can't be updated", "DaemonSets are stateful"], correct: 1 },
      { q: "In a StatefulSet, how are pod names assigned?", options: ["Random UUIDs", "Sequential ordinal indices (0,1,2...)", "By node name", "By creation timestamp"], correct: 1 },
      { q: "What happens to a StatefulSet's PersistentVolume when the pod is deleted?", options: ["Automatically deleted", "Retained (not deleted)", "Moved to another pod", "Backed up to etcd"], correct: 1 },
      { q: "Which RBAC resource binds a Role to a user/group within a namespace?", options: ["ClusterRoleBinding", "RoleBinding", "ServiceAccount", "RoleAttachment"], correct: 1 },
      { q: "What component watches for new Custom Resource Definition (CRD) instances?", options: ["API Server only", "Custom Controller/Operator", "Scheduler", "Kubelet"], correct: 1 },
      { q: "DaemonSets ignore which scheduler constraint by default?", options: ["Taints", "Node affinity", "Resource limits", "Unschedulable nodes"], correct: 3 },
      { q: "What field in StatefulSet spec controls the number of pods updated at once?", options: ["maxSurge", "partition", "maxUnavailable", "parallelism"], correct: 1 }
    ],
    advanced: [
      { q: "In RBAC, what is the difference between Role and ClusterRole?", options: ["Roles are deprecated", "Roles are namespaced, ClusterRoles are cluster-wide", "ClusterRoles can't modify resources", "No difference"], correct: 1 },
      { q: "When creating a CRD, which field defines the API group?", options: ["metadata.group", "spec.group", "apiVersion", "spec.names.group"], correct: 1 },
      { q: "What is the purpose of a StatefulSet's serviceName field?", options: ["For monitoring", "Creates headless Service for network identity", "Sets pod hostname", "Required but unused"], correct: 1 },
      { q: "How does a DaemonSet ensure pods run even on nodes with NoSchedule taints?", options: ["It doesn't", "Automatic tolerations for critical DaemonSets", "Bypasses scheduler entirely", "Removes taints temporarily"], correct: 1 },
      { q: "What does spec.updateStrategy.rollingUpdate.partition do in StatefulSets?", options: ["Limits replicas", "Updates pods with ordinal >= partition value", "Splits pods across zones", "Partitions storage"], correct: 1 },
      { q: "Which verb in RBAC allows reading secrets?", options: ["read", "get", "list", "watch"], correct: 1 },
      { q: "What is the purpose of CRD validation schemas (OpenAPI v3)?", options: ["Performance optimization", "Validate custom resource instances before persistence", "Generate documentation", "Enable caching"], correct: 1 },
      { q: "How do you make a CRD subresource like /status or /scale available?", options: ["They're automatic", "Define in spec.subresources", "Create separate CRD", "Use admission webhooks"], correct: 1 },
      { q: "What is the finalizer pattern in custom controllers?", options: ["Cleanup hook before resource deletion", "Final update after creation", "End-of-lifecycle logging", "Performance optimization"], correct: 0 },
      { q: "In StatefulSets, what is the pod management policy 'Parallel' vs 'OrderedReady'?", options: ["No difference", "Parallel creates/deletes pods simultaneously", "Parallel uses more CPU", "OrderedReady is deprecated"], correct: 1 }
    ]
  };

  const troubleshootingScenarios = [
    {
      id: 'pending', title: 'Pod Stuck in Pending', category: 'scheduling', symptom: 'kubectl get pods shows Pending for minutes',
      causes: [
        { cause: 'Insufficient resources', check: 'kubectl describe pod - look for "Insufficient cpu/memory"', fix: 'Scale cluster or reduce requests' },
        { cause: 'Node taints blocking', check: 'kubectl describe pod - look for "node(s) had taints"', fix: 'Add tolerations or untaint nodes' },
        { cause: 'PVC not bound', check: 'kubectl get pvc - check for Pending status', fix: 'Ensure StorageClass exists and provisioner works' },
        { cause: 'Node affinity mismatch', check: 'kubectl describe pod - look for affinity/nodeSelector', fix: 'Label nodes or adjust affinity rules' }
      ]
    },
    {
      id: 'crashloop', title: 'CrashLoopBackOff', category: 'runtime', symptom: 'Container starts then immediately dies',
      causes: [
        { cause: 'Application crash', check: 'kubectl logs <pod> --previous', fix: 'Fix application code, check environment variables' },
        { cause: 'Liveness probe too aggressive', check: 'kubectl describe pod - check probe config', fix: 'Increase initialDelaySeconds, timeoutSeconds' },
        { cause: 'Missing config/secrets', check: 'kubectl logs - look for config errors', fix: 'Ensure ConfigMaps/Secrets exist and are mounted' },
        { cause: 'OOMKilled', check: 'kubectl describe pod - look for OOMKilled', fix: 'Increase memory limits or fix memory leak' }
      ]
    },
    {
      id: 'imagepull', title: 'ImagePullBackOff', category: 'runtime', symptom: 'Pod stuck in ImagePullBackOff or ErrImagePull',
      causes: [
        { cause: 'Image does not exist', check: 'kubectl describe pod - check Events for "not found" or 404', fix: 'Verify image name and tag in registry' },
        { cause: 'Missing image pull secret', check: 'kubectl describe pod - look for "unauthorized" or 401', fix: 'Create imagePullSecrets and reference in pod spec' },
        { cause: 'Private registry authentication failed', check: 'kubectl get secret <secret> -o yaml | base64 -d', fix: 'Recreate secret with correct credentials' },
        { cause: 'Registry unreachable', check: 'kubectl exec -it <pod> -- curl <registry-url>', fix: 'Check network connectivity, firewall rules, DNS' },
        { cause: 'Rate limit exceeded', check: 'kubectl describe pod - look for "429 Too Many Requests"', fix: 'Use authenticated pulls or mirror to private registry' }
      ]
    },
    {
      id: 'pvc', title: 'Persistent Volume Issues', category: 'storage', symptom: 'PVC stuck in Pending or Pod cannot mount volume',
      causes: [
        { cause: 'No StorageClass available', check: 'kubectl get storageclass', fix: 'Create or configure default StorageClass' },
        { cause: 'Volume provisioner not running', check: 'kubectl get pods -n kube-system | grep <provisioner>', fix: 'Deploy or restart storage provisioner' },
        { cause: 'Insufficient storage capacity', check: 'kubectl describe pvc - check Events for capacity errors', fix: 'Increase storage quota or use smaller PVC' },
        { cause: 'Access mode mismatch', check: 'kubectl describe pv - compare accessModes with PVC', fix: 'Match ReadWriteOnce/ReadWriteMany between PV and PVC' },
        { cause: 'Volume already mounted elsewhere', check: 'kubectl get pods -A -o wide | grep <volume>', fix: 'Delete pod holding volume or use ReadWriteMany' },
        { cause: 'Node selector conflicts', check: 'kubectl describe pv - check nodeAffinity', fix: 'Ensure pod can schedule on nodes with PV affinity' }
      ]
    },
    {
      id: 'quota', title: 'Resource Quota Exceeded', category: 'resources', symptom: 'Pod creation fails with "exceeded quota" error',
      causes: [
        { cause: 'CPU quota exceeded', check: 'kubectl describe resourcequota -n <namespace>', fix: 'Reduce resource requests or increase quota limits' },
        { cause: 'Memory quota exceeded', check: 'kubectl get resourcequota -n <namespace> -o yaml', fix: 'Scale down deployments or request quota increase' },
        { cause: 'Pod count limit reached', check: 'kubectl describe quota - check pods used vs hard limit', fix: 'Delete unused pods or increase pod count quota' },
        { cause: 'Storage quota exceeded', check: 'kubectl describe resourcequota - check persistentvolumeclaims', fix: 'Delete unused PVCs or request storage increase' },
        { cause: 'Missing resource requests', check: 'kubectl describe pod - verify requests/limits defined', fix: 'Add resource requests to pod spec (required with quotas)' }
      ]
    },
    {
      id: 'service', title: 'Service Unreachable', category: 'networking', symptom: 'curl to ClusterIP times out',
      causes: [
        { cause: 'No endpoints', check: 'kubectl get endpoints <svc> - empty?', fix: 'Check pod labels match service selector' },
        { cause: 'Pods not ready', check: 'kubectl get pods - all Running but not Ready?', fix: 'Fix readiness probe failures' },
        { cause: 'NetworkPolicy blocking', check: 'kubectl get networkpolicy -A', fix: 'Add ingress rule to allow traffic' },
        { cause: 'kube-proxy not running', check: 'kubectl get pods -n kube-system | grep proxy', fix: 'Restart kube-proxy DaemonSet' }
      ]
    },
    {
      id: 'dns', title: 'DNS Resolution Failing', category: 'networking', symptom: 'nslookup kubernetes.default fails from pod',
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
    const questions = quizQuestions[quizDifficulty];
    if (index === questions[currentQuestion].correct) {
      setQuizScore(s => s + 1);
    }
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(q => q + 1);
      } else {
        setShowQuizResult(true);
        saveQuizResult();
      }
    }, 1500);
  };

  const saveQuizResult = () => {
    const questions = quizQuestions[quizDifficulty];
    const result = {
      date: new Date().toISOString(),
      difficulty: quizDifficulty,
      score: quizScore + (selectedAnswer === questions[currentQuestion].correct ? 1 : 0),
      total: questions.length,
      percentage: Math.round(((quizScore + (selectedAnswer === questions[currentQuestion].correct ? 1 : 0)) / questions.length) * 100)
    };
    const newHistory = [result, ...quizHistory].slice(0, 10);
    setQuizHistory(newHistory);
    localStorage.setItem('k8s-quiz-history', JSON.stringify(newHistory));
  };

  const restartQuiz = () => {
    setQuizScore(0);
    setCurrentQuestion(0);
    setShowQuizResult(false);
    setSelectedAnswer(null);
  };

  const changeDifficulty = (difficulty) => {
    setQuizDifficulty(difficulty);
    restartQuiz();
  };

  // Reusable SVG Arrow component with unique marker IDs
  const Arrow = ({ id, x1, y1, x2, y2, isActive, curved = false, curveOffset = 40, showPacket = false, customPath }) => {
    const uniqueId = useId();
    const markerId = `arrow-${id}-${isActive ? 'on' : 'off'}-${uniqueId}`.replace(/:/g, '-');
    const path = customPath
      ? customPath
      : curved
        ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - curveOffset} ${x2} ${y2}`
        : `M ${x1} ${y1} L ${x2} ${y2}`;
    const color = isActive ? '#22c55e' : '#64748b';
    
    return (
      <g>
        <defs>
          <marker id={markerId} markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0 0, 12 4, 0 8" fill={color} />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 2.5 : 2}
          markerEnd={`url(#${markerId})`}
          strokeDasharray={isActive ? '6 3' : 'none'}
          className={isActive ? 'animate-pulse' : ''}
        />
        {showPacket && isActive && (
          <circle r={6} fill="#22c55e" opacity="0.9">
            <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  // Architecture Component Box
  const Component = ({ id, label, x, y, type = 'control', onClick, isActive, isFailed, showScale, isYamlHighlight }) => (
    <g 
      onClick={() => onClick(id)} 
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label={`${label} component${isActive ? ', selected' : ''}${isFailed ? ', failed' : ''}${isYamlHighlight ? ', highlighted' : ''}`}
      aria-pressed={isActive || isYamlHighlight}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
    >
      <rect
        x={x}
        y={y}
        width={120}
        height={50}
        rx={6}
        fill={isFailed ? '#991b1b' : isYamlHighlight ? '#7c3aed' : isActive ? (type === 'control' ? '#3b82f6' : '#10b981') : (type === 'control' ? '#1e3a5f' : '#134e3a')}
        stroke={isFailed ? '#ef4444' : isYamlHighlight ? '#a78bfa' : isActive ? '#fff' : (type === 'control' ? '#3b82f6' : '#10b981')}
        strokeWidth={isFailed || isYamlHighlight ? 3 : isActive ? 2.5 : 1.5}
        className="transition-all duration-300"
      />
      <text x={x + 60} y={y + 30} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={600}>
        {label}
      </text>
      {isActive && !isFailed && !isYamlHighlight && (
        <circle cx={x + 110} cy={y + 10} r={5} fill="#22c55e" className="animate-pulse" />
      )}
      {isYamlHighlight && (
        <circle cx={x + 110} cy={y + 10} r={5} fill="#a78bfa" className="animate-pulse" />
      )}
      {isFailed && (
        <text x={x + 110} y={y + 15} fill="#ef4444" fontSize={14} fontWeight="bold">✕</text>
      )}
      {showScale && componentDetails[id]?.scaleNote && (
        <g>
          <rect x={x - 5} y={y - 20} width={130} height={16} rx={3} fill="#0f172a" stroke="#475569" strokeWidth={1} />
          <text x={x + 60} y={y - 8} textAnchor="middle" fill="#fbbf24" fontSize={7}>
            {componentDetails[id].scaleNote.substring(0, 35)}
          </text>
        </g>
      )}
    </g>
  );

  const views = [
    { id: 'architecture', label: 'Architecture', key: '1' },
    { id: 'flow', label: 'Flow', key: '2' },
    { id: 'scheduler', label: 'Scheduler', key: '3' },
    { id: 'networking', label: 'Networking', key: '4' },
    { id: 'ingress', label: 'Ingress', key: '5' },
    { id: 'troubleshooting', label: 'Troubleshoot', key: '6' },
    { id: 'quiz', label: 'Quiz', key: '7' }
  ];

  // Get highlighted component from YAML field selection
  const yamlHighlightedComponent = selectedYamlField ? yamlFieldMapping[selectedYamlField]?.component : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        .yaml-line:hover { background: rgba(124, 58, 237, 0.2); cursor: pointer; }
        .yaml-highlight { background: rgba(124, 58, 237, 0.3); border-left: 3px solid #a78bfa; }
      `}</style>
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Kubernetes Internals
              </h1>
              <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">Interactive Architecture Deep Dive</p>
            </div>
            <nav aria-label="Main navigation" className="flex flex-wrap gap-1 sm:gap-1.5">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => {setActiveView(view.id); resetAll();}}
                  className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
                    activeView === view.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  aria-label={`${view.label} view, press ${view.key}`}
                  aria-current={activeView === view.id ? 'page' : undefined}
                  title={`Press ${view.key}`}
                >
                  {view.label}
                  <span className="ml-0.5 sm:ml-1 text-slate-500 text-[9px] sm:text-[10px] hidden sm:inline" aria-hidden="true">{view.key}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
        
        {/* ==================== ARCHITECTURE VIEW ==================== */}
        {activeView === 'architecture' && (
          <main role="main" aria-label="Architecture view">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <div className="xl:col-span-2">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto relative">
                {/* Controls Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-300">Click component →</h2>
                  <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showScaleNotes} 
                      onChange={e => setShowScaleNotes(e.target.checked)} 
                      className="rounded bg-slate-700 border-slate-600 text-blue-500 w-3 h-3" 
                      aria-label="Show scale notes"
                    />
                    <span className="text-slate-400">Scale</span>
                  </label>
                  <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      checked={failureMode} 
                      onChange={e => {setFailureMode(e.target.checked); setFailedComponent(null); setSelectedComponent(null);}} 
                      className="rounded bg-slate-700 border-slate-600 text-red-500 w-3 h-3" 
                      aria-label="Enable failure mode"
                    />
                    <span className="text-red-400">Failure</span>
                  </label>
                  <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs cursor-pointer select-none hover:bg-slate-800 px-1.5 sm:px-2 py-1 rounded transition-colors">
                    <input 
                      type="checkbox" 
                      checked={showYamlPanel} 
                      onChange={e => {setShowYamlPanel(e.target.checked); setSelectedYamlField(null);}} 
                      className="rounded bg-slate-700 border-slate-600 text-purple-500 w-3 h-3" 
                      aria-label="Show YAML mapping panel"
                    />
                    <span className="text-purple-400">YAML Map</span>
                  </label>
                  <button
                    onClick={() => setTrafficSimulation(true)}
                    disabled={trafficSimulation}
                    className="ml-auto px-2 sm:px-2.5 py-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-[10px] sm:text-xs font-medium rounded transition-all"
                    aria-label="Simulate traffic flow"
                    aria-busy={trafficSimulation}
                  >
                    {trafficSimulation ? '...' : '🚀 Simulate'}
                  </button>
                </div>

                {failureMode && (
                  <div className="mb-3 p-2 bg-red-950/50 border border-red-900 rounded text-[10px] sm:text-xs text-red-300">
                    💀 Click a component to see failure impact
                  </div>
                )}

                {/* Architecture SVG - FIXED ARROW ALIGNMENT */}
                <div className="min-w-[640px] lg:min-w-0">
                  <svg viewBox="0 0 680 400" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kubernetes architecture diagram showing control plane and worker node components">
                    {/* Control Plane Box */}
                    <rect x={15} y={15} width={650} height={160} rx={10} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" />
                    <text x={30} y={38} fill="#3b82f6" fontSize={12} fontWeight={700}>CONTROL PLANE</text>
                    
                    {/* Components - Control Plane */}
                    <Component id="apiserver" label="API Server" x={40} y={60} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'apiserver'} 
                      isFailed={failedComponent === 'apiserver'}
                      isYamlHighlight={yamlHighlightedComponent === 'apiserver'}
                      showScale={showScaleNotes} />
                    <Component id="etcd" label="etcd" x={190} y={60} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'etcd'}
                      isFailed={failedComponent === 'etcd'}
                      isYamlHighlight={yamlHighlightedComponent === 'etcd'}
                      showScale={showScaleNotes} />
                    <Component id="scheduler" label="Scheduler" x={340} y={60} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'scheduler'}
                      isFailed={failedComponent === 'scheduler'}
                      isYamlHighlight={yamlHighlightedComponent === 'scheduler'}
                      showScale={showScaleNotes} />
                    <Component id="controller" label="Controllers" x={490} y={60} 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'controller'}
                      isFailed={failedComponent === 'controller'}
                      isYamlHighlight={yamlHighlightedComponent === 'controller'}
                      showScale={showScaleNotes} />
                    
                    {/* Control Plane Arrows */}
                    {/* API Server → etcd: straight horizontal */}
                    <Arrow id="api-etcd" x1={162} y1={85} x2={188} y2={85} />
                    {/* API Server → Scheduler: arc above etcd */}
                    <Arrow id="api-sched" x1={160} y1={72} x2={340} y2={72} curved curveOffset={50} />
                    {/* API Server → Controllers: higher arc above all */}
                    <Arrow id="api-ctrl" x1={155} y1={62} x2={490} y2={62} curved curveOffset={55} />
                    
                    {/* Worker Node Box */}
                    <rect x={15} y={210} width={650} height={175} rx={10} fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" />
                    <text x={30} y={233} fill="#10b981" fontSize={12} fontWeight={700}>WORKER NODE</text>
                    
                    {/* Components - Worker Node */}
                    <Component id="kubelet" label="kubelet" x={40} y={255} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'kubelet'}
                      isFailed={failedComponent === 'kubelet'}
                      isYamlHighlight={yamlHighlightedComponent === 'kubelet'}
                      showScale={showScaleNotes} />
                    <Component id="kubeproxy" label="kube-proxy" x={190} y={255} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'kubeproxy'}
                      isFailed={failedComponent === 'kubeproxy'}
                      isYamlHighlight={yamlHighlightedComponent === 'kubeproxy'}
                      showScale={showScaleNotes} />
                    <Component id="runtime" label="containerd" x={340} y={255} type="worker" 
                      onClick={failureMode ? setFailedComponent : setSelectedComponent} 
                      isActive={selectedComponent === 'runtime'}
                      isFailed={failedComponent === 'runtime'}
                      isYamlHighlight={yamlHighlightedComponent === 'runtime'}
                      showScale={showScaleNotes} />
                    
                    {/* Pods Box */}
                    <rect x={490} y={248} width={145} height={75} rx={6} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                    <text x={562} y={268} textAnchor="middle" fill="#94a3b8" fontSize={9}>PODS</text>
                    <rect x={505} y={278} width={32} height={32} rx={4} fill="#0f172a" stroke="#10b981" strokeWidth={1} />
                    <rect x={545} y={278} width={32} height={32} rx={4} fill="#0f172a" stroke="#10b981" strokeWidth={1} />
                    <rect x={585} y={278} width={32} height={32} rx={4} fill="#0f172a" stroke="#10b981" strokeWidth={1} />
                    
                    {/* Cross-plane Arrows */}
                    {/* API Server → kubelet: straight down */}
                    <Arrow id="api-kubelet" x1={100} y1={112} x2={100} y2={253} />
                    {/* API Server → kube-proxy: angled from API Server (not etcd) */}
                    <Arrow id="api-proxy" customPath="M 145 112 L 250 253" />
                    {/* kubelet → containerd: route below kube-proxy */}
                    <Arrow id="kubelet-runtime" customPath="M 160 300 L 188 320 L 340 320 L 340 300" />
                    {/* containerd → pods */}
                    <Arrow id="runtime-pods" x1={462} y1={285} x2={488} y2={285} />

                    {/* Traffic Simulation Packet */}
                    {trafficSimulation && (
                      <circle r={7} fill="#f43f5e" stroke="#fff" strokeWidth={2}>
                        <animateMotion dur="2.5s" repeatCount="1" path="M 60 180 L 100 85 L 560 294" />
                      </circle>
                    )}
                  </svg>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 text-center">Esc to clear • Click components for details</p>
              </div>

              {/* YAML Mapping Panel */}
              {showYamlPanel && (
                <div className="mt-3 sm:mt-4 bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-purple-400">YAML → Component Mapping</h3>
                    <span className="text-[10px] sm:text-xs text-slate-500">Click a field to highlight which component handles it</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-950 rounded-lg p-2 sm:p-3 font-mono text-[10px] sm:text-xs overflow-x-auto">
                      <pre className="text-slate-300 leading-relaxed">
                        {sampleDeploymentYaml.split('\n').map((line, i) => {
                          // Extract field name from line
                          const fieldMatch = line.match(/^(\s*)(\w+[\w[].]*):/) || line.match(/^(\s*)- (\w+):/);
                          let fieldKey = null;
                          if (fieldMatch) {
                            const indent = fieldMatch[1].length;
                            const field = fieldMatch[2];
                            // Map to our field keys
                            if (indent === 0 && ['apiVersion', 'kind'].includes(field)) fieldKey = field;
                            if (indent === 2 && field === 'name') fieldKey = 'metadata.name';
                            if (indent === 2 && field === 'namespace') fieldKey = 'metadata.namespace';
                            if (indent === 2 && field === 'labels') fieldKey = 'metadata.labels';
                            if (indent === 2 && field === 'replicas') fieldKey = 'spec.replicas';
                            if (indent === 2 && field === 'selector') fieldKey = 'spec.selector';
                            if (indent === 2 && field === 'strategy') fieldKey = 'spec.strategy';
                            if (field === 'nodeSelector') fieldKey = 'spec.nodeSelector';
                            if (field === 'tolerations') fieldKey = 'spec.tolerations';
                            if (field === 'containers') fieldKey = 'spec.containers';
                            if (field === 'image') fieldKey = 'spec.containers[].image';
                            if (field === 'resources') fieldKey = 'spec.containers[].resources';
                            if (field === 'volumes') fieldKey = 'spec.volumes';
                          }
                          
                          return (
                            <div 
                              key={i} 
                              className={`yaml-line px-1 -mx-1 rounded ${selectedYamlField === fieldKey ? 'yaml-highlight' : ''} ${fieldKey ? '' : 'opacity-60'}`}
                              onClick={() => fieldKey && setSelectedYamlField(fieldKey === selectedYamlField ? null : fieldKey)}
                              role={fieldKey ? 'button' : undefined}
                              tabIndex={fieldKey ? 0 : undefined}
                              aria-label={fieldKey ? `YAML field ${fieldKey}, handled by ${componentDetails[yamlFieldMapping[fieldKey]?.component]?.name}` : undefined}
                              aria-pressed={fieldKey && selectedYamlField === fieldKey}
                              onKeyDown={fieldKey ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedYamlField(fieldKey === selectedYamlField ? null : fieldKey);
                                }
                              } : undefined}
                            >
                              {line || ' '}
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                    <div>
                      {selectedYamlField ? (
                        <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-3 sm:p-4">
                          <div className="text-[10px] sm:text-xs text-purple-400 uppercase tracking-wider mb-1">Field</div>
                          <div className="font-mono text-sm sm:text-base text-white mb-2 sm:mb-3">{selectedYamlField}</div>
                          <div className="text-[10px] sm:text-xs text-purple-400 uppercase tracking-wider mb-1">Handled By</div>
                          <div className="text-emerald-400 text-sm sm:text-base font-semibold mb-2 sm:mb-3">{componentDetails[yamlFieldMapping[selectedYamlField]?.component]?.name}</div>
                          <div className="text-[10px] sm:text-xs text-purple-400 uppercase tracking-wider mb-1">How</div>
                          <div className="text-slate-300 text-xs sm:text-sm">{yamlFieldMapping[selectedYamlField]?.desc}</div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs sm:text-sm">
                          ← Click a highlighted YAML field
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Detail Panel */}
            <div className="xl:col-span-1">
              {failedComponent && failureMode ? (
                <div className="bg-red-950/30 rounded-xl border border-red-800 p-3 sm:p-4 xl:sticky xl:top-20">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="text-sm sm:text-base font-bold text-red-400">{componentDetails[failedComponent].name} FAILURE</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="bg-slate-900 rounded-lg p-2 sm:p-2.5">
                      <div className="text-[9px] sm:text-[10px] text-red-400 uppercase tracking-wider mb-0.5">Symptom</div>
                      <p className="text-white text-xs sm:text-sm font-medium">{componentDetails[failedComponent].failure.symptom}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2 sm:p-2.5">
                      <div className="text-[9px] sm:text-[10px] text-orange-400 uppercase tracking-wider mb-0.5">Impact</div>
                      <p className="text-slate-300 text-[10px] sm:text-xs">{componentDetails[failedComponent].failure.impact}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2 sm:p-2.5">
                      <div className="text-[9px] sm:text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">Diagnostic</div>
                      <code className="text-[9px] sm:text-[10px] text-emerald-400 block bg-slate-800 p-1.5 rounded font-mono break-all">{componentDetails[failedComponent].failure.check}</code>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2 sm:p-2.5">
                      <div className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider mb-0.5">Recovery</div>
                      <p className="text-slate-300 text-[10px] sm:text-xs">{componentDetails[failedComponent].failure.recovery}</p>
                    </div>
                  </div>
                </div>
              ) : selectedComponent ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 xl:sticky xl:top-20">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm sm:text-base font-bold text-white">{componentDetails[selectedComponent].name}</h3>
                  </div>
                  <div className="text-emerald-400 text-[10px] sm:text-xs font-semibold mb-2">{componentDetails[selectedComponent].role}</div>
                  
                  <div className="bg-slate-800 rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Analogy</div>
                    <p className="text-slate-300 text-[10px] sm:text-xs leading-relaxed">{componentDetails[selectedComponent].analogy}</p>
                  </div>

                  {showScaleNotes && (
                    <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-2 mb-2 sm:mb-3">
                      <p className="text-amber-400 text-[9px] sm:text-[10px]">{componentDetails[selectedComponent].scaleNote}</p>
                    </div>
                  )}
                  
                  <div className="mb-2 sm:mb-3">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Internals</div>
                    <ul className="space-y-1">
                      {componentDetails[selectedComponent].internals.map((item, i) => (
                        <li key={i} className="text-[10px] sm:text-xs text-slate-400 flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5 text-[9px] sm:text-[10px]">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Data Flow</div>
                    <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono leading-relaxed">{componentDetails[selectedComponent].flow}</p>
                  </div>
                  
                  {/* AI Explain Button */}
                  <button
                    onClick={() => handleAiExplain(selectedComponent, componentDetails)}
                    disabled={isAiLoading || !GEMINI_API_KEY}
                    className="w-full mt-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
                    aria-label="Get AI explanation for this component"
                  >
                    {isAiLoading ? (
                      <>
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Thinking...
                      </>
                    ) : (
                      <>⚡ AI Explain</>
                    )}
                  </button>
                  {!GEMINI_API_KEY && (
                    <p className="text-[9px] text-amber-400 mt-1 text-center">Add VITE_GEMINI_API_KEY to .env</p>
                  )}
                  
                  {/* AI Response Panel */}
                  {(aiResponse || aiError) && (
                    <div className={`mt-2 p-3 rounded-lg border ${aiError ? 'bg-red-900/30 border-red-700' : 'bg-purple-900/30 border-purple-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-semibold ${aiError ? 'text-red-400' : 'text-purple-400'}`}>
                          {aiError ? '❌ Error' : '💡 AI Insight'}
                        </span>
                        <button onClick={clearAiResponse} className="text-slate-400 hover:text-white text-xs">✕</button>
                      </div>
                      <div className={`text-[10px] leading-relaxed ${aiError ? 'text-red-300' : 'text-slate-300'} whitespace-pre-wrap`}>
                        {aiError || aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 p-4 sm:p-6 text-center">
                  <div className="text-slate-500 text-xs sm:text-base mb-1">← Select a component</div>
                  <p className="text-slate-600 text-[10px] sm:text-xs">Click any box for details</p>
                </div>
              )}
            </div>
          </div>
          </main>
        )}

        {/* ==================== FLOW VIEW - FIXED ARROWS ==================== */}
        {activeView === 'flow' && (
          <main role="main" aria-label="Flow view">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold">Deployment Lifecycle</h2>
                <p className="text-slate-500 text-[10px] sm:text-xs">kubectl apply → Running Pods</p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2" role="toolbar" aria-label="Flow animation controls">
                <button 
                  onClick={() => { setFlowStep(0); setIsFlowPlaying(true); }} 
                  className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] sm:text-xs font-medium"
                  aria-label="Play flow animation"
                >
                  ▶ Play
                </button>
                <button 
                  onClick={() => setFlowStep(s => Math.max(0, s - 1))} 
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs"
                  aria-label="Previous step"
                  disabled={flowStep === 0}
                >
                  ←
                </button>
                <button 
                  onClick={() => setFlowStep(s => Math.min(7, s + 1))} 
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs"
                  aria-label="Next step"
                  disabled={flowStep === 7}
                >
                  →
                </button>
                <button 
                  onClick={resetAll} 
                  className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[9px] sm:text-[10px]"
                  aria-label="Reset flow animation"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto">
              <div className="min-w-[680px] lg:min-w-0">
                <svg viewBox="0 0 750 280" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Deployment lifecycle flow diagram showing steps from kubectl apply to running pods">
                  {/* User Box */}
                  <rect x={25} y={115} width={75} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('user') ? '#f59e0b' : '#1e293b'} 
                    stroke="#f59e0b" strokeWidth={1.5} />
                  <text x={62} y={138} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>You</text>
                  
                  {/* API Server */}
                  <rect x={150} y={50} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('apiserver') ? '#3b82f6' : '#1e3a5f'} 
                    stroke="#3b82f6" strokeWidth={1.5} />
                  <text x={197} y={73} textAnchor="middle" fill="#fff" fontSize={9}>API Server</text>
                  
                  {/* Controllers */}
                  <rect x={290} y={50} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('controller') ? '#8b5cf6' : '#3b2970'} 
                    stroke="#8b5cf6" strokeWidth={1.5} />
                  <text x={337} y={73} textAnchor="middle" fill="#fff" fontSize={9}>Controllers</text>
                  
                  {/* Scheduler */}
                  <rect x={430} y={50} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('scheduler') ? '#ec4899' : '#6b214f'} 
                    stroke="#ec4899" strokeWidth={1.5} />
                  <text x={477} y={73} textAnchor="middle" fill="#fff" fontSize={9}>Scheduler</text>
                  
                  {/* Kubelet */}
                  <rect x={430} y={165} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('kubelet') ? '#10b981' : '#134e3a'} 
                    stroke="#10b981" strokeWidth={1.5} />
                  <text x={477} y={188} textAnchor="middle" fill="#fff" fontSize={9}>Kubelet</text>
                  
                  {/* containerd */}
                  <rect x={570} y={165} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('runtime') ? '#06b6d4' : '#164e63'} 
                    stroke="#06b6d4" strokeWidth={1.5} />
                  <text x={617} y={188} textAnchor="middle" fill="#fff" fontSize={9}>containerd</text>
                  
                  {/* kube-proxy */}
                  <rect x={570} y={230} width={95} height={38} rx={5} 
                    fill={flowSteps[flowStep].active.includes('kubeproxy') ? '#f97316' : '#6b3410'} 
                    stroke="#f97316" strokeWidth={1.5} />
                  <text x={617} y={253} textAnchor="middle" fill="#fff" fontSize={9}>kube-proxy</text>
                  
                  {/* etcd */}
                  <rect x={150} y={165} width={95} height={38} rx={5} fill="#1e293b" stroke="#64748b" strokeWidth={1.5} />
                  <text x={197} y={188} textAnchor="middle" fill="#94a3b8" fontSize={9}>etcd</text>
                  
                  {/* Arrows - FIXED COORDINATES */}
                  {flowStep >= 0 && <Arrow id="f0" x1={100} y1={134} x2={148} y2={78} isActive={flowStep === 0} showPacket={flowStep === 0} />}
                  {flowStep >= 1 && <Arrow id="f1" x1={197} y1={90} x2={197} y2={163} isActive={flowStep === 1} showPacket={flowStep === 1} />}
                  {flowStep >= 2 && <Arrow id="f2" x1={247} y1={69} x2={288} y2={69} isActive={flowStep === 2} showPacket={flowStep === 2} />}
                  {flowStep >= 3 && <Arrow id="f3" x1={387} y1={69} x2={428} y2={69} isActive={flowStep >= 3 && flowStep <= 4} showPacket={flowStep === 4} />}
                  {flowStep >= 5 && <Arrow id="f5" x1={477} y1={90} x2={477} y2={163} isActive={flowStep === 5} showPacket={flowStep === 5} />}
                  {flowStep >= 6 && <Arrow id="f6" x1={527} y1={184} x2={568} y2={184} isActive={flowStep === 6} showPacket={flowStep === 6} />}
                  {flowStep >= 7 && <Arrow id="f7" x1={527} y1={205} x2={568} y2={240} isActive={flowStep === 7} showPacket={flowStep === 7} />}
                </svg>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-3 sm:p-4 border-l-4 border-emerald-500" role="status" aria-live="polite" aria-atomic="true">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">Step {flowStep + 1}/8</span>
                <h3 className="text-xs sm:text-sm font-semibold">{flowSteps[flowStep].label}</h3>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-xs">{flowSteps[flowStep].description}</p>
            </div>

            <div className="flex gap-1" role="tablist" aria-label="Flow step navigation">
              {flowSteps.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setFlowStep(i)}
                  className={`flex-1 h-1.5 rounded-full transition-all ${i === flowStep ? 'bg-emerald-500' : i < flowStep ? 'bg-emerald-800' : 'bg-slate-700'}`}
                  role="tab"
                  aria-selected={i === flowStep}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 text-center">← → navigate • Space play/pause</p>
          </div>
          </main>
        )}

        {/* ==================== SCHEDULER VIEW ==================== */}
        {activeView === 'scheduler' && (
          <main role="main" aria-label="Scheduler view">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-bold">Scheduler Funnel</h2>
                <button 
                  onClick={resetAll} 
                  className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs bg-slate-800 hover:bg-slate-700 rounded"
                  aria-label="Reset scheduler funnel"
                >
                  Reset
                </button>
              </div>
              <p className="text-slate-500 text-[10px] sm:text-xs mb-3 sm:mb-4">filter → score → bind</p>
              
              <div className="space-y-1.5" role="list" aria-label="Scheduler filtering steps">
                {schedulerSteps.map((step, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSchedulerStep(i)}
                    className={`w-full text-left p-2 sm:p-2.5 rounded-lg border transition-all ${schedulerStep === i ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                    role="listitem"
                    aria-label={`${step.label}, ${step.count} nodes remaining`}
                    aria-current={schedulerStep === i ? 'step' : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[10px] sm:text-xs">{step.label}</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono ${step.count === 1 ? 'bg-emerald-600' : 'bg-slate-700'}`} aria-label={`${step.count} nodes`}>{step.count}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-600 mt-3 text-center">↑ ↓ to navigate</p>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-bold mb-1">{schedulerSteps[schedulerStep].label}</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs">{schedulerSteps[schedulerStep].description}</p>
                <p className="text-slate-500 text-[9px] sm:text-[10px] mt-0.5">{schedulerSteps[schedulerStep].detail}</p>
              </div>
              
              {/* Node Grid */}
              <div className="mb-3 sm:mb-4">
                <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Node Pool (100)</div>
                <div className="grid grid-cols-10 gap-0.5 sm:gap-1 p-1.5 sm:p-2 bg-slate-800/50 rounded-lg">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const isActive = i < schedulerSteps[schedulerStep].count;
                    const isWinner = schedulerStep === 6 && i === 0;
                    return (
                      <div key={i} className={`w-full pt-[100%] rounded-sm transition-all duration-300 ${isWinner ? 'bg-emerald-500 scale-125 z-10 shadow-lg' : isActive ? 'bg-blue-500/70' : 'bg-red-900/20'}`} />
                    );
                  })}
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-[9px] sm:text-[10px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/70 rounded-sm"></div> Eligible</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/20 rounded-sm"></div> Eliminated</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Winner</span>
                </div>
              </div>
              
              <div className="p-2.5 sm:p-3 bg-slate-800 rounded-lg">
                <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Insight</div>
                <p className="text-slate-300 text-[10px] sm:text-xs">
                  {schedulerStep < 5 ? "Filtering is elimination. Every predicate must pass." 
                    : schedulerStep === 5 ? "Anti-affinity prevents co-location with matching pods."
                    : "Scoring ranks survivors. Weighted plugins sum to final score."}
                </p>
              </div>
            </div>
          </div>
          </main>
        )}

        {/* ==================== NETWORKING VIEW ==================== */}
        {activeView === 'networking' && (
          <main role="main" aria-label="Networking view">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold mb-1">The Four Networks + Service Types</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs">Every Pod gets a unique, routable IP</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { name: 'Node Network', desc: 'Physical/VM links', color: '#3b82f6' },
                { name: 'Pod Network', desc: 'Overlay (CNI)', color: '#10b981' },
                { name: 'Service Network', desc: 'Virtual IPs', color: '#a78bfa' },
                { name: 'External', desc: 'Ingress traffic', color: '#f97316' }
              ].map((net, i) => (
                <div key={i} className="p-2 sm:p-2.5 rounded-lg border" style={{ borderColor: net.color + '40', backgroundColor: net.color + '10' }}>
                  <div className="font-bold text-[10px] sm:text-xs mb-0.5" style={{ color: net.color }}>{net.name}</div>
                  <p className="text-slate-400 text-[9px] sm:text-[10px]">{net.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {[
                { type: 'ClusterIP', internal: true, external: false, desc: 'Internal only. iptables rules.', use: 'Backends, DBs' },
                { type: 'NodePort', internal: true, external: true, desc: 'Opens 30000-32767 on all nodes.', use: 'Dev/test' },
                { type: 'LoadBalancer', internal: true, external: true, desc: 'Cloud LB (AWS NLB/ALB).', use: 'Production' }
              ].map((svc, i) => (
                <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs sm:text-sm font-bold">{svc.type}</h3>
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded ${svc.internal ? 'bg-emerald-600' : 'bg-slate-700'}`}>Int</span>
                      <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded ${svc.external ? 'bg-blue-600' : 'bg-slate-700'}`}>Ext</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] sm:text-xs mb-1">{svc.desc}</p>
                  <div className="text-[9px] sm:text-[10px] text-slate-500">Use: {svc.use}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 border-l-4 border-cyan-500">
              <h3 className="font-bold text-cyan-400 text-xs sm:text-sm mb-2">kube-proxy: iptables vs IPVS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-slate-900 p-2.5 sm:p-3 rounded-lg">
                  <div className="font-medium text-slate-300 text-[10px] sm:text-xs mb-1">iptables (Legacy)</div>
                  <p className="text-slate-400 text-[9px] sm:text-[10px]">O(n) rules. Falls over ~5000 services.</p>
                </div>
                <div className="bg-slate-900 p-2.5 sm:p-3 rounded-lg border border-cyan-500/30">
                  <div className="font-medium text-cyan-400 text-[10px] sm:text-xs mb-1">IPVS (Recommended)</div>
                  <p className="text-slate-400 text-[9px] sm:text-[10px]">O(1) hash. 100k+ services.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs sm:text-sm font-bold mb-2">CNI Plugins</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { name: 'Flannel', tag: 'Simple', desc: 'VXLAN overlay. No NetworkPolicy.', color: '#f59e0b' },
                  { name: 'Calico', tag: 'Enterprise', desc: 'BGP routing. Full policies.', color: '#ef4444' },
                  { name: 'Cilium', tag: 'eBPF', desc: 'L7 policies, observability.', color: '#8b5cf6' }
                ].map((cni, i) => (
                  <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[10px] sm:text-xs">{cni.name}</span>
                      <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded" style={{ backgroundColor: cni.color + '25', color: cni.color }}>{cni.tag}</span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px]">{cni.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </main>
        )}

        {/* ==================== INGRESS VIEW (NEW) ==================== */}
        {activeView === 'ingress' && (
          <main role="main" aria-label="Ingress view">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold">Ingress Traffic Flow</h2>
                <p className="text-slate-500 text-[10px] sm:text-xs">How external HTTP(S) reaches your Pods</p>
              </div>
              <div className="flex gap-1.5 sm:gap-2" role="toolbar" aria-label="Ingress animation controls">
                <button 
                  onClick={() => { setIngressStep(0); setIsIngressPlaying(true); }} 
                  className="px-2.5 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-[10px] sm:text-xs font-medium"
                  aria-label="Play ingress animation"
                >
                  ▶ Play
                </button>
                <button 
                  onClick={() => setIngressStep(s => Math.max(0, s - 1))} 
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs"
                  aria-label="Previous step"
                  disabled={ingressStep === 0}
                >
                  ←
                </button>
                <button 
                  onClick={() => setIngressStep(s => Math.min(5, s + 1))} 
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[10px] sm:text-xs"
                  aria-label="Next step"
                  disabled={ingressStep === 5}
                >
                  →
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4 overflow-x-auto">
              <div className="min-w-[700px] lg:min-w-0">
                <svg viewBox="0 0 750 260" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Ingress traffic flow diagram showing how external requests reach pods">
                  {/* Internet */}
                  <rect x={20} y={100} width={80} height={50} rx={6} fill={ingressStep === 0 ? '#f97316' : '#3f3f46'} stroke="#f97316" strokeWidth={1.5} />
                  <text x={60} y={130} textAnchor="middle" fill="#fff" fontSize={10}>Internet</text>
                  
                  {/* Load Balancer */}
                  <rect x={140} y={100} width={90} height={50} rx={6} fill={ingressStep === 0 ? '#f97316' : '#1e293b'} stroke="#f97316" strokeWidth={1.5} />
                  <text x={185} y={122} textAnchor="middle" fill="#fff" fontSize={9}>Cloud LB</text>
                  <text x={185} y={136} textAnchor="middle" fill="#94a3b8" fontSize={7}>(or NodePort)</text>
                  
                  {/* Ingress Controller */}
                  <rect x={270} y={100} width={100} height={50} rx={6} fill={ingressStep >= 1 && ingressStep <= 2 ? '#8b5cf6' : '#3b2970'} stroke="#8b5cf6" strokeWidth={1.5} />
                  <text x={320} y={122} textAnchor="middle" fill="#fff" fontSize={9}>Ingress Controller</text>
                  <text x={320} y={136} textAnchor="middle" fill="#c4b5fd" fontSize={7}>(nginx/traefik)</text>
                  
                  {/* Service */}
                  <rect x={410} y={100} width={85} height={50} rx={6} fill={ingressStep >= 3 ? '#3b82f6' : '#1e3a5f'} stroke="#3b82f6" strokeWidth={1.5} />
                  <text x={452} y={130} textAnchor="middle" fill="#fff" fontSize={9}>Service</text>
                  
                  {/* Endpoints */}
                  <rect x={535} y={85} width={75} height={35} rx={5} fill={ingressStep >= 4 ? '#10b981' : '#134e3a'} stroke="#10b981" strokeWidth={1.5} />
                  <text x={572} y={107} textAnchor="middle" fill="#fff" fontSize={8}>Endpoints</text>
                  
                  {/* Pods */}
                  <g>
                    <rect x={640} y={55} width={60} height={35} rx={5} fill={ingressStep >= 5 ? '#10b981' : '#0f172a'} stroke="#10b981" strokeWidth={1.5} />
                    <text x={670} y={77} textAnchor="middle" fill="#fff" fontSize={8}>Pod 1</text>
                    <rect x={640} y={105} width={60} height={35} rx={5} fill="#0f172a" stroke="#10b981" strokeWidth={1.5} />
                    <text x={670} y={127} textAnchor="middle" fill="#fff" fontSize={8}>Pod 2</text>
                    <rect x={640} y={155} width={60} height={35} rx={5} fill="#0f172a" stroke="#10b981" strokeWidth={1.5} />
                    <text x={670} y={177} textAnchor="middle" fill="#fff" fontSize={8}>Pod 3</text>
                  </g>
                  
                  {/* Ingress Rules Box */}
                  <rect x={270} y={170} width={100} height={60} rx={5} fill="#1e1b4b" stroke="#6366f1" strokeWidth={1} strokeDasharray="4 2" />
                  <text x={320} y={188} textAnchor="middle" fill="#a5b4fc" fontSize={8}>Ingress Rules</text>
                  <text x={320} y={202} textAnchor="middle" fill="#64748b" fontSize={7}>host: api.example.com</text>
                  <text x={320} y={214} textAnchor="middle" fill="#64748b" fontSize={7}>path: /v1/*</text>
                  
                  {/* API Server connection */}
                  <Arrow id="ing-rules" x1={320} y1={168} x2={320} y2={152} isActive={ingressStep >= 1} />
                  
                  {/* Main flow arrows */}
                  <Arrow id="ing0" x1={102} y1={125} x2={138} y2={125} isActive={ingressStep >= 0} showPacket={ingressStep === 0} />
                  <Arrow id="ing1" x1={232} y1={125} x2={268} y2={125} isActive={ingressStep >= 1} showPacket={ingressStep === 1} />
                  <Arrow id="ing2" x1={372} y1={125} x2={408} y2={125} isActive={ingressStep >= 3} showPacket={ingressStep === 3} />
                  <Arrow id="ing3" x1={497} y1={110} x2={533} y2={102} isActive={ingressStep >= 4} showPacket={ingressStep === 4} />
                  <Arrow id="ing4" x1={612} y1={102} x2={638} y2={75} isActive={ingressStep >= 5} showPacket={ingressStep === 5} />
                  
                  {/* Bypass arrow label */}
                  {ingressStep >= 5 && (
                    <text x={580} y={55} textAnchor="middle" fill="#22c55e" fontSize={7}>Direct to Pod IP!</text>
                  )}
                </svg>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-3 sm:p-4 border-l-4 border-orange-500" role="status" aria-live="polite" aria-atomic="true">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                <span className="bg-orange-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full">Step {ingressStep + 1}/6</span>
                <h3 className="text-xs sm:text-sm font-semibold">{ingressSteps[ingressStep].label}</h3>
              </div>
              <p className="text-slate-400 text-[10px] sm:text-xs">{ingressSteps[ingressStep].description}</p>
            </div>

            <div className="flex gap-1" role="tablist" aria-label="Ingress step navigation">
              {ingressSteps.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setIngressStep(i)}
                  className={`flex-1 h-1.5 rounded-full transition-all ${i === ingressStep ? 'bg-orange-500' : i < ingressStep ? 'bg-orange-800' : 'bg-slate-700'}`}
                  role="tab"
                  aria-selected={i === ingressStep}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Key Insight */}
            <div className="bg-slate-900 rounded-lg p-3 sm:p-4 border border-slate-800">
              <h3 className="font-bold text-xs sm:text-sm mb-2 text-orange-400">Key Insight: Ingress Controller ≠ kube-proxy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                <div className="bg-slate-800 p-2.5 sm:p-3 rounded">
                  <div className="text-purple-400 font-semibold mb-1">Ingress Controller</div>
                  <p className="text-slate-400">L7 proxy (HTTP). Reads Ingress resources from API server. Routes by Host/Path headers. Connects directly to Pod IPs.</p>
                </div>
                <div className="bg-slate-800 p-2.5 sm:p-3 rounded">
                  <div className="text-blue-400 font-semibold mb-1">kube-proxy</div>
                  <p className="text-slate-400">L4 (TCP/UDP). Programs iptables/IPVS on every node. Routes ClusterIP → Pod IPs. No HTTP awareness.</p>
                </div>
              </div>
            </div>
          </div>
          </main>
        )}

        {/* ==================== TROUBLESHOOTING VIEW ==================== */}
        {activeView === 'troubleshooting' && (
          <main role="main" aria-label="Troubleshooting view">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold mb-1">Troubleshooting Decision Trees</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs">Common failures and diagnostics</p>
            </div>

            {/* Smart Troubleshooter (AI) */}
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-700/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400 text-lg">🤖</span>
                <h3 className="text-sm font-bold text-purple-300">Smart Troubleshooter (AI)</h3>
                {!GEMINI_API_KEY && (
                  <span className="text-[10px] text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">API key required</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={troubleshootQuery}
                  onChange={(e) => setTroubleshootQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartTroubleshoot()}
                  placeholder="Describe your Kubernetes issue... (e.g., 'pods stuck in Pending', 'CrashLoopBackOff')"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  disabled={!GEMINI_API_KEY}
                  aria-label="Describe your Kubernetes issue"
                />
                <button
                  onClick={handleSmartTroubleshoot}
                  disabled={isAiLoading || !troubleshootQuery.trim() || !GEMINI_API_KEY}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {isAiLoading ? 'Analyzing...' : 'Diagnose'}
                </button>
              </div>
              
              {/* AI Response in Troubleshooter */}
              {(aiResponse || aiError) && activeView === 'troubleshooting' && (
                <div className={`mt-3 p-3 rounded-lg border ${aiError ? 'bg-red-900/30 border-red-700' : 'bg-slate-800/80 border-purple-700/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${aiError ? 'text-red-400' : 'text-purple-400'}`}>
                      {aiError ? '❌ Error' : '🔍 AI Diagnosis'}
                    </span>
                    <button onClick={clearAiResponse} className="text-slate-400 hover:text-white text-xs">✕ Clear</button>
                  </div>
                  <div className={`text-xs leading-relaxed ${aiError ? 'text-red-300' : 'text-slate-300'} whitespace-pre-wrap prose prose-invert prose-xs max-w-none`}>
                    {aiError || aiResponse}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { label: 'Total', count: troubleshootingScenarios.length, colorClass: 'text-white' },
                { label: 'Scheduling', count: troubleshootingScenarios.filter(s => s.category === 'scheduling').length, colorClass: 'text-blue-400' },
                { label: 'Runtime', count: troubleshootingScenarios.filter(s => s.category === 'runtime').length, colorClass: 'text-purple-400' },
                { label: 'Storage', count: troubleshootingScenarios.filter(s => s.category === 'storage').length, colorClass: 'text-emerald-400' },
                { label: 'Resources', count: troubleshootingScenarios.filter(s => s.category === 'resources').length, colorClass: 'text-amber-400' },
                { label: 'Networking', count: troubleshootingScenarios.filter(s => s.category === 'networking').length, colorClass: 'text-orange-400' },
              ].map((stat, i) => (
                <button
                  key={i}
                  onClick={() => stat.label === 'Total' ? setTroubleshootingFilter('all') : setTroubleshootingFilter(stat.label.toLowerCase())}
                  className={`p-2 rounded-lg border transition-all ${
                    (stat.label === 'Total' && troubleshootingFilter === 'all') || 
                    (stat.label.toLowerCase() === troubleshootingFilter)
                      ? 'bg-blue-600/20 border-blue-500' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                  aria-label={`Show ${stat.label} scenarios`}
                >
                  <div className={`text-lg sm:text-xl font-bold ${stat.colorClass}`}>{stat.count}</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">{stat.label}</div>
                </button>
              ))}
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
              <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <label htmlFor="troubleshoot-search" className="text-[10px] sm:text-xs text-slate-400 mb-1 block">Search scenarios</label>
                  <input
                    id="troubleshoot-search"
                    type="text"
                    value={troubleshootingSearch}
                    onChange={(e) => setTroubleshootingSearch(e.target.value)}
                    placeholder="Type to search symptoms, causes, fixes..."
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Search troubleshooting scenarios"
                  />
                </div>
                <div>
                  <label htmlFor="troubleshoot-filter" className="text-[10px] sm:text-xs text-slate-400 mb-1 block">Filter by category</label>
                  <select
                    id="troubleshoot-filter"
                    value={troubleshootingFilter}
                    onChange={(e) => setTroubleshootingFilter(e.target.value)}
                    className="w-full md:w-auto px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    <option value="scheduling">Scheduling</option>
                    <option value="runtime">Runtime</option>
                    <option value="storage">Storage</option>
                    <option value="resources">Resources</option>
                    <option value="networking">Networking</option>
                  </select>
                </div>
              </div>
              
              {/* Active filters display */}
              {(troubleshootingSearch || troubleshootingFilter !== 'all') && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-500">Active filters:</span>
                  {troubleshootingSearch && (
                    <button
                      onClick={() => setTroubleshootingSearch('')}
                      className="px-2 py-0.5 bg-blue-600/20 border border-blue-600/50 rounded text-[10px] text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                      aria-label="Clear search filter"
                    >
                      "{troubleshootingSearch}"
                      <span>×</span>
                    </button>
                  )}
                  {troubleshootingFilter !== 'all' && (
                    <button
                      onClick={() => setTroubleshootingFilter('all')}
                      className="px-2 py-0.5 bg-purple-600/20 border border-purple-600/50 rounded text-[10px] text-purple-400 hover:bg-purple-600/30 transition-colors flex items-center gap-1"
                      aria-label="Clear category filter"
                    >
                      {troubleshootingFilter}
                      <span>×</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTroubleshootingSearch('');
                      setTroubleshootingFilter('all');
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                    aria-label="Clear all filters"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {troubleshootingScenarios.filter(scenario => {
                  const matchesCategory = troubleshootingFilter === 'all' || scenario.category === troubleshootingFilter;
                  const matchesSearch = !troubleshootingSearch || 
                    scenario.title.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                    scenario.symptom.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                    scenario.causes.some(cause => 
                      cause.cause.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                      cause.check.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                      cause.fix.toLowerCase().includes(troubleshootingSearch.toLowerCase())
                    );
                  return matchesCategory && matchesSearch;
                }).length} of {troubleshootingScenarios.length} scenarios
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {troubleshootingScenarios
                .filter(scenario => {
                  const matchesCategory = troubleshootingFilter === 'all' || scenario.category === troubleshootingFilter;
                  const matchesSearch = !troubleshootingSearch || 
                    scenario.title.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                    scenario.symptom.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                    scenario.causes.some(cause => 
                      cause.cause.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                      cause.check.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                      cause.fix.toLowerCase().includes(troubleshootingSearch.toLowerCase())
                    );
                  return matchesCategory && matchesSearch;
                })
                .map((scenario) => (
                <div key={scenario.id} className="bg-slate-900 rounded-lg border border-slate-800 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-xs sm:text-sm font-bold text-red-400">{scenario.title}</h3>
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded whitespace-nowrap bg-slate-700/50 text-slate-300 border border-slate-600">
                      {scenario.category}
                    </span>
                  </div>
                  <div className="bg-slate-800 rounded p-2 mb-2 sm:mb-3">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase mb-0.5">Symptom</div>
                    <p className="text-slate-300 text-[10px] sm:text-xs">{scenario.symptom}</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {scenario.causes.map((cause, j) => (
                      <div key={j} className="border-l-2 border-slate-700 pl-2">
                        <div className="text-[10px] sm:text-xs font-medium text-white mb-0.5">{cause.cause}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 mb-0.5">
                          <span className="text-blue-400">Check: </span>
                          <code className="bg-slate-800 px-1 rounded break-all">{cause.check}</code>
                        </div>
                        <div className="text-[9px] sm:text-[10px]">
                          <span className="text-slate-500">Fix: </span>
                          <span className="text-emerald-400">{cause.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* No results message */}
            {troubleshootingScenarios.filter(scenario => {
              const matchesCategory = troubleshootingFilter === 'all' || scenario.category === troubleshootingFilter;
              const matchesSearch = !troubleshootingSearch || 
                scenario.title.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                scenario.symptom.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                scenario.causes.some(cause => 
                  cause.cause.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                  cause.check.toLowerCase().includes(troubleshootingSearch.toLowerCase()) ||
                  cause.fix.toLowerCase().includes(troubleshootingSearch.toLowerCase())
                );
              return matchesCategory && matchesSearch;
            }).length === 0 && (
              <div className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 p-6 sm:p-8 text-center">
                <div className="text-slate-500 text-sm sm:text-base mb-2">No scenarios found</div>
                <p className="text-slate-600 text-xs sm:text-sm mb-3">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setTroubleshootingSearch('');
                    setTroubleshootingFilter('all');
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
            
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4">
              <h3 className="font-bold text-xs sm:text-sm mb-2">Quick Commands</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] sm:text-[10px] font-mono">
                <div className="space-y-1">
                  <div className="break-all"><span className="text-emerald-400">kubectl describe pod &lt;name&gt;</span> <span className="text-slate-500">- Events</span></div>
                  <div className="break-all"><span className="text-emerald-400">kubectl logs &lt;pod&gt; --previous</span> <span className="text-slate-500">- Crash logs</span></div>
                  <div className="break-all"><span className="text-emerald-400">kubectl get events --sort-by='.lastTimestamp'</span></div>
                </div>
                <div className="space-y-1">
                  <div className="break-all"><span className="text-emerald-400">kubectl get endpoints &lt;svc&gt;</span> <span className="text-slate-500">- Service targets</span></div>
                  <div className="break-all"><span className="text-emerald-400">kubectl exec -it &lt;pod&gt; -- nslookup kubernetes</span></div>
                  <div className="break-all"><span className="text-emerald-400">kubectl top nodes</span> <span className="text-slate-500">- Resources</span></div>
                </div>
              </div>
            </div>
          </div>
          </main>
        )}

        {/* ==================== QUIZ VIEW ==================== */}
        {activeView === 'quiz' && (
          <main role="main" aria-label="Quiz view">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-1">Knowledge Check</h2>
              <p className="text-slate-400 text-[10px] sm:text-xs">Test your K8s internals understanding</p>
            </div>

            <div className="flex gap-2 justify-center mb-4">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button
                  key={level}
                  onClick={() => changeDifficulty(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    quizDifficulty === level
                      ? level === 'beginner' ? 'bg-emerald-600 text-white' 
                        : level === 'intermediate' ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  <span className="ml-1 text-[10px] opacity-70">({quizQuestions[level].length}Q)</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {!showQuizResult ? (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">
                        Q {currentQuestion + 1}/{quizQuestions[quizDifficulty].length}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-500" role="status" aria-live="polite">
                        Score: {quizScore}
                      </span>
                    </div>
                    
                    <h3 className="text-sm sm:text-base font-bold mb-4 sm:mb-5" id="quiz-question">
                      {quizQuestions[quizDifficulty][currentQuestion].q}
                    </h3>
                    
                    <div className="space-y-2" role="radiogroup" aria-labelledby="quiz-question">
                      {quizQuestions[quizDifficulty][currentQuestion].options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrect = index === quizQuestions[quizDifficulty][currentQuestion].correct;
                        const showCorrectness = selectedAnswer !== null;
                        
                        let bgClass = "bg-slate-800 hover:bg-slate-700";
                        if (showCorrectness) {
                          if (isCorrect) bgClass = "bg-emerald-600/20 border-emerald-500";
                          else if (isSelected && !isCorrect) bgClass = "bg-red-600/20 border-red-500";
                          else bgClass = "opacity-40 bg-slate-800";
                        }

                        return (
                          <button 
                            key={index} 
                            onClick={() => !showCorrectness && handleQuizAnswer(index)} 
                            disabled={showCorrectness}
                            className={`w-full text-left p-2.5 sm:p-3 rounded-lg border border-transparent transition-all text-xs sm:text-sm ${bgClass}`}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`Option ${index + 1}: ${option}${showCorrectness ? (isCorrect ? ', correct answer' : isSelected ? ', incorrect' : '') : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showCorrectness && isCorrect && <span className="text-emerald-500" aria-label="correct">✓</span>}
                              {showCorrectness && isSelected && !isCorrect && <span className="text-red-500" aria-label="incorrect">✕</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-6 text-center">
                    <div className="text-4xl sm:text-5xl mb-3">🏆</div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">Complete!</h3>
                    <p className="text-slate-400 text-xs sm:text-base mb-3 sm:mb-4">
                      Score: <span className="text-emerald-400 font-bold">{quizScore}</span> / {quizQuestions[quizDifficulty].length}
                      <span className="ml-2 text-slate-500">
                        ({Math.round((quizScore / quizQuestions[quizDifficulty].length) * 100)}%)
                      </span>
                    </p>
                    <div 
                      className="w-full bg-slate-800 rounded-full h-2.5 sm:h-3 mb-4 sm:mb-5 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={quizScore}
                      aria-valuemin={0}
                      aria-valuemax={quizQuestions[quizDifficulty].length}
                      aria-label={`Quiz score: ${quizScore} out of ${quizQuestions[quizDifficulty].length}`}
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all" 
                        style={{ width: `${(quizScore / quizQuestions[quizDifficulty].length) * 100}%` }} />
                    </div>
                    <button 
                      onClick={restartQuiz} 
                      className="px-4 sm:px-5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-xs sm:text-sm"
                      aria-label="Restart quiz"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <h3 className="text-sm font-bold mb-3 text-slate-300">Recent History</h3>
                  {quizHistory.length === 0 ? (
                    <div className="text-center text-slate-500 text-xs py-4">
                      No quiz attempts yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quizHistory.map((attempt, i) => (
                        <div key={i} className="bg-slate-800 rounded-lg p-2.5 border border-slate-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              attempt.difficulty === 'beginner' ? 'bg-emerald-600/20 text-emerald-400'
                              : attempt.difficulty === 'intermediate' ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-red-600/20 text-red-400'
                            }`}>
                              {attempt.difficulty}
                            </span>
                            <span className={`text-xs font-bold ${
                              attempt.percentage >= 80 ? 'text-emerald-400'
                              : attempt.percentage >= 60 ? 'text-blue-400'
                              : 'text-red-400'
                            }`}>
                              {attempt.percentage}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">
                              {attempt.score}/{attempt.total}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(attempt.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {quizHistory.length > 0 && (
                    <button
                      onClick={() => {
                        setQuizHistory([]);
                        localStorage.removeItem('k8s-quiz-history');
                      }}
                      className="w-full mt-3 px-2 py-1.5 text-[10px] text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-all"
                    >
                      Clear History
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </main>
        )}
      </div>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-2 mt-4 sm:mt-6" role="contentinfo">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 text-center text-[9px] sm:text-[10px] text-slate-600">
          1-7 switch views • ← → navigate • Space play • Esc clear
        </div>
      </footer>
    </div>
  );
}
