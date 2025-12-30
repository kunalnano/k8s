import React, { useState, useEffect } from 'react';

export default function App() {
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

  // Set page title
  useEffect(() => {
    document.title = "Kubernetes Internals — Interactive Deep Dive";
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
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
      if (activeView === 'scheduler') {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSchedulerStep(s => Math.min(6, s + 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSchedulerStep(s => Math.max(0, s - 1)); }
      }
      if (e.key === 'Escape') {
        setSelectedComponent(null);
        setFailedComponent(null);
        setTrafficSimulation(false);
        setSelectedYamlField(null);
      }
      if (e.key === '1') { setActiveView('architecture'); resetAll(); }
      if (e.key === '2') { setActiveView('flow'); resetAll(); }
      if (e.key === '3') { setActiveView('scheduler'); resetAll(); }
      if (e.key === '4') { setActiveView('networking'); resetAll(); }
      if (e.key === '5') { setActiveView('ingress'); resetAll(); }
      if (e.key === '6') { setActiveView('troubleshooting'); resetAll(); }
      if (e.key === '7') { setActiveView('quiz'); resetAll(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeView]);

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

  const resetAll = () => {
    setFlowStep(0);
    setIsFlowPlaying(false);
    setIngressStep(0);
    setIsIngressPlaying(false);
    setSchedulerStep(0);
    setSelectedComponent(null);
    setFailedComponent(null);
    setTrafficSimulation(false);
    setSelectedYamlField(null);
  };

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

  const quizQuestions = [
    { q: "Which component is the only one that communicates directly with etcd?", options: ["kube-scheduler", "kube-apiserver", "kubelet", "kube-controller-manager"], correct: 1 },
    { q: "If you have 1000 Services, which kube-proxy mode should you use?", options: ["userspace", "iptables", "IPVS", "ebpf-lite"], correct: 2 },
    { q: "Which is NOT a phase in the Pod lifecycle?", options: ["Pending", "ContainerCreating", "Running", "Compiling"], correct: 3 },
    { q: "What happens if a Pod lacks a Toleration for a node's Taint?", options: ["Pod warns but schedules", "Pod rejected from that node", "Pod crashes", "Node deletes Pod"], correct: 1 },
    { q: "Which component talks to the container runtime via CRI?", options: ["kube-proxy", "etcd", "kubelet", "Cloud Controller"], correct: 2 },
    { q: "Where does an Ingress Controller get its routing rules from?", options: ["ConfigMap only", "API Server (Ingress resources)", "CoreDNS", "kube-proxy"], correct: 1 },
    { q: "What key format does etcd use to store a Pod named 'web' in namespace 'prod'?", options: ["/pods/prod/web", "/registry/pods/prod/web", "/v1/pods/web", "/api/pods/prod-web"], correct: 1 }
  ];

  const troubleshootingScenarios = [
    {
      id: 'pending', title: 'Pod Stuck in Pending', symptom: 'kubectl get pods shows Pending for minutes',
      causes: [
        { cause: 'Insufficient resources', check: 'kubectl describe pod - look for "Insufficient cpu/memory"', fix: 'Scale cluster or reduce requests' },
        { cause: 'Node taints blocking', check: 'kubectl describe pod - look for "node(s) had taints"', fix: 'Add tolerations or untaint nodes' },
        { cause: 'PVC not bound', check: 'kubectl get pvc - check for Pending status', fix: 'Ensure StorageClass exists and provisioner works' },
        { cause: 'Node affinity mismatch', check: 'kubectl describe pod - look for affinity/nodeSelector', fix: 'Label nodes or adjust affinity rules' }
      ]
    },
    {
      id: 'crashloop', title: 'CrashLoopBackOff', symptom: 'Container starts then immediately dies',
      causes: [
        { cause: 'Application crash', check: 'kubectl logs <pod> --previous', fix: 'Fix application code, check environment variables' },
        { cause: 'Liveness probe too aggressive', check: 'kubectl describe pod - check probe config', fix: 'Increase initialDelaySeconds, timeoutSeconds' },
        { cause: 'Missing config/secrets', check: 'kubectl logs - look for config errors', fix: 'Ensure ConfigMaps/Secrets exist and are mounted' },
        { cause: 'OOMKilled', check: 'kubectl describe pod - look for OOMKilled', fix: 'Increase memory limits or fix memory leak' }
      ]
    },
    {
      id: 'service', title: 'Service Unreachable', symptom: 'curl to ClusterIP times out',
      causes: [
        { cause: 'No endpoints', check: 'kubectl get endpoints <svc> - empty?', fix: 'Check pod labels match service selector' },
        { cause: 'Pods not ready', check: 'kubectl get pods - all Running but not Ready?', fix: 'Fix readiness probe failures' },
        { cause: 'NetworkPolicy blocking', check: 'kubectl get networkpolicy -A', fix: 'Add ingress rule to allow traffic' },
        { cause: 'kube-proxy not running', check: 'kubectl get pods -n kube-system | grep proxy', fix: 'Restart kube-proxy DaemonSet' }
      ]
    },
    {
      id: 'dns', title: 'DNS Resolution Failing', symptom: 'nslookup kubernetes.default fails from pod',
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

  // Reusable SVG Arrow component with unique marker IDs
  const Arrow = ({ id, x1, y1, x2, y2, isActive, curved = false, showPacket = false }) => {
    const markerId = `arrow-${id}-${isActive ? 'on' : 'off'}`;
    const path = curved 
      ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 30} ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x2} ${y2}`;
    
    return (
      <g>
        <defs>
          <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={isActive ? '#22c55e' : '#475569'} />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={isActive ? '#22c55e' : '#475569'}
          strokeWidth={isActive ? 2.5 : 1.5}
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
      aria-label={`${label} component`}
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
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Kubernetes Internals
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Interactive Architecture Deep Dive</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => {setActiveView(view.id); resetAll();}}
                  className={`px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeView === view.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title={`Press ${view.key}`}
                >
                  {view.label}
                  <span className="ml-1 text-slate-500 text-[10px]">{view.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">
        
        {/* ==================== ARCHITECTURE VIEW ==================== */}
        {activeView === 'architecture' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-x-auto relative">
                {/* Controls Row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-slate-300">Click component →</h2>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none hover:bg-slate-800 px-2 py-1 rounded transition-colors">
                    <input type="checkbox" checked={showScaleNotes} onChange={e => setShowScaleNotes(e.target.checked)} className="rounded bg-slate-700 border-slate-600 text-blue-500 w-3 h-3" />
                    <span className="text-slate-400">Scale</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none hover:bg-slate-800 px-2 py-1 rounded transition-colors">
                    <input type="checkbox" checked={failureMode} onChange={e => {setFailureMode(e.target.checked); setFailedComponent(null); setSelectedComponent(null);}} className="rounded bg-slate-700 border-slate-600 text-red-500 w-3 h-3" />
                    <span className="text-red-400">Failure</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none hover:bg-slate-800 px-2 py-1 rounded transition-colors">
                    <input type="checkbox" checked={showYamlPanel} onChange={e => {setShowYamlPanel(e.target.checked); setSelectedYamlField(null);}} className="rounded bg-slate-700 border-slate-600 text-purple-500 w-3 h-3" />
                    <span className="text-purple-400">YAML Map</span>
                  </label>
                  <button
                    onClick={() => setTrafficSimulation(true)}
                    disabled={trafficSimulation}
                    className="ml-auto px-2.5 py-1 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-xs font-medium rounded transition-all"
                  >
                    {trafficSimulation ? '...' : '🚀 Simulate'}
                  </button>
                </div>

                {failureMode && (
                  <div className="mb-3 p-2 bg-red-950/50 border border-red-900 rounded text-xs text-red-300">
                    💀 Click a component to see failure impact
                  </div>
                )}

                {/* Architecture SVG - FIXED ARROW ALIGNMENT */}
                <div className="min-w-[640px]">
                  <svg viewBox="0 0 680 400" className="w-full h-auto">
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
                    
                    {/* Control Plane Arrows - FIXED */}
                    <Arrow id="api-etcd" x1={160} y1={85} x2={188} y2={85} />
                    <Arrow id="api-sched" x1={100} y1={112} x2={340} y2={85} curved />
                    <Arrow id="api-ctrl" x1={100} y1={115} x2={490} y2={85} curved />
                    
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
                    
                    {/* Cross-plane Arrows - FIXED */}
                    <Arrow id="api-kubelet" x1={100} y1={175} x2={100} y2={253} />
                    <Arrow id="api-proxy" x1={250} y1={175} x2={250} y2={253} />
                    <Arrow id="kubelet-runtime" x1={160} y1={280} x2={338} y2={280} />
                    <Arrow id="runtime-pods" x1={460} y1={294} x2={488} y2={294} />

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
                <div className="mt-4 bg-slate-900 rounded-xl border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-purple-400">YAML → Component Mapping</h3>
                    <span className="text-xs text-slate-500">Click a field to highlight which component handles it</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                      <pre className="text-slate-300 leading-relaxed">
                        {sampleDeploymentYaml.split('\n').map((line, i) => {
                          // Extract field name from line
                          const fieldMatch = line.match(/^(\s*)(\w+[\w\[\].]*):/) || line.match(/^(\s*)- (\w+):/);
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
                            >
                              {line || ' '}
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                    <div>
                      {selectedYamlField ? (
                        <div className="bg-purple-950/30 border border-purple-800 rounded-lg p-4">
                          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Field</div>
                          <div className="font-mono text-white mb-3">{selectedYamlField}</div>
                          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Handled By</div>
                          <div className="text-emerald-400 font-semibold mb-3">{componentDetails[yamlFieldMapping[selectedYamlField]?.component]?.name}</div>
                          <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">How</div>
                          <div className="text-slate-300 text-sm">{yamlFieldMapping[selectedYamlField]?.desc}</div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
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
                <div className="bg-red-950/30 rounded-xl border border-red-800 p-4 sticky top-20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="text-base font-bold text-red-400">{componentDetails[failedComponent].name} FAILURE</h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-slate-900 rounded-lg p-2.5">
                      <div className="text-[10px] text-red-400 uppercase tracking-wider mb-0.5">Symptom</div>
                      <p className="text-white text-sm font-medium">{componentDetails[failedComponent].failure.symptom}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2.5">
                      <div className="text-[10px] text-orange-400 uppercase tracking-wider mb-0.5">Impact</div>
                      <p className="text-slate-300 text-xs">{componentDetails[failedComponent].failure.impact}</p>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2.5">
                      <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">Diagnostic</div>
                      <code className="text-[10px] text-emerald-400 block bg-slate-800 p-1.5 rounded font-mono break-all">{componentDetails[failedComponent].failure.check}</code>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-2.5">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-0.5">Recovery</div>
                      <p className="text-slate-300 text-xs">{componentDetails[failedComponent].failure.recovery}</p>
                    </div>
                  </div>
                </div>
              ) : selectedComponent ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sticky top-20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-base font-bold text-white">{componentDetails[selectedComponent].name}</h3>
                  </div>
                  <div className="text-emerald-400 text-xs font-semibold mb-2">{componentDetails[selectedComponent].role}</div>
                  
                  <div className="bg-slate-800 rounded-lg p-2.5 mb-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Analogy</div>
                    <p className="text-slate-300 text-xs leading-relaxed">{componentDetails[selectedComponent].analogy}</p>
                  </div>

                  {showScaleNotes && (
                    <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-2 mb-3">
                      <p className="text-amber-400 text-[10px]">{componentDetails[selectedComponent].scaleNote}</p>
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Internals</div>
                    <ul className="space-y-1">
                      {componentDetails[selectedComponent].internals.map((item, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                          <span className="text-blue-400 mt-0.5 text-[10px]">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Data Flow</div>
                    <p className="text-[10px] text-emerald-400 font-mono leading-relaxed">{componentDetails[selectedComponent].flow}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 rounded-xl border border-dashed border-slate-700 p-6 text-center">
                  <div className="text-slate-500 mb-1">← Select a component</div>
                  <p className="text-slate-600 text-xs">Click any box for details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== FLOW VIEW - FIXED ARROWS ==================== */}
        {activeView === 'flow' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Deployment Lifecycle</h2>
                <p className="text-slate-500 text-xs">kubectl apply → Running Pods</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setFlowStep(0); setIsFlowPlaying(true); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium">▶ Play</button>
                <button onClick={() => setFlowStep(s => Math.max(0, s - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">←</button>
                <button onClick={() => setFlowStep(s => Math.min(7, s + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">→</button>
                <button onClick={resetAll} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px]">Reset</button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-x-auto">
              <div className="min-w-[680px]">
                <svg viewBox="0 0 750 280" className="w-full h-auto">
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

            <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-emerald-500">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Step {flowStep + 1}/8</span>
                <h3 className="text-sm font-semibold">{flowSteps[flowStep].label}</h3>
              </div>
              <p className="text-slate-400 text-xs">{flowSteps[flowStep].description}</p>
            </div>

            <div className="flex gap-1">
              {flowSteps.map((_, i) => (
                <button key={i} onClick={() => setFlowStep(i)}
                  className={`flex-1 h-1.5 rounded-full transition-all ${i === flowStep ? 'bg-emerald-500' : i < flowStep ? 'bg-emerald-800' : 'bg-slate-700'}`} />
              ))}
            </div>
            <p className="text-[10px] text-slate-600 text-center">← → navigate • Space play/pause</p>
          </div>
        )}

        {/* ==================== SCHEDULER VIEW ==================== */}
        {activeView === 'scheduler' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Scheduler Funnel</h2>
                <button onClick={resetAll} className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded">Reset</button>
              </div>
              <p className="text-slate-500 text-xs mb-4">filter → score → bind</p>
              
              <div className="space-y-1.5">
                {schedulerSteps.map((step, i) => (
                  <button key={i} onClick={() => setSchedulerStep(i)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${schedulerStep === i ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">{step.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${step.count === 1 ? 'bg-emerald-600' : 'bg-slate-700'}`}>{step.count}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-3 text-center">↑ ↓ to navigate</p>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-1">{schedulerSteps[schedulerStep].label}</h3>
                <p className="text-slate-400 text-xs">{schedulerSteps[schedulerStep].description}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{schedulerSteps[schedulerStep].detail}</p>
              </div>
              
              {/* Node Grid */}
              <div className="mb-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Node Pool (100)</div>
                <div className="grid grid-cols-10 gap-1 p-2 bg-slate-800/50 rounded-lg">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const isActive = i < schedulerSteps[schedulerStep].count;
                    const isWinner = schedulerStep === 6 && i === 0;
                    return (
                      <div key={i} className={`w-full pt-[100%] rounded-sm transition-all duration-300 ${isWinner ? 'bg-emerald-500 scale-125 z-10 shadow-lg' : isActive ? 'bg-blue-500/70' : 'bg-red-900/20'}`} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/70 rounded-sm"></div> Eligible</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/20 rounded-sm"></div> Eliminated</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Winner</span>
                </div>
              </div>
              
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Insight</div>
                <p className="text-slate-300 text-xs">
                  {schedulerStep < 5 ? "Filtering is elimination. Every predicate must pass." 
                    : schedulerStep === 5 ? "Anti-affinity prevents co-location with matching pods."
                    : "Scoring ranks survivors. Weighted plugins sum to final score."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== NETWORKING VIEW ==================== */}
        {activeView === 'networking' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">The Four Networks + Service Types</h2>
              <p className="text-slate-500 text-xs">Every Pod gets a unique, routable IP</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { name: 'Node Network', desc: 'Physical/VM links', color: '#3b82f6' },
                { name: 'Pod Network', desc: 'Overlay (CNI)', color: '#10b981' },
                { name: 'Service Network', desc: 'Virtual IPs', color: '#a78bfa' },
                { name: 'External', desc: 'Ingress traffic', color: '#f97316' }
              ].map((net, i) => (
                <div key={i} className="p-2.5 rounded-lg border" style={{ borderColor: net.color + '40', backgroundColor: net.color + '10' }}>
                  <div className="font-bold text-xs mb-0.5" style={{ color: net.color }}>{net.name}</div>
                  <p className="text-slate-400 text-[10px]">{net.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { type: 'ClusterIP', internal: true, external: false, desc: 'Internal only. iptables rules.', use: 'Backends, DBs' },
                { type: 'NodePort', internal: true, external: true, desc: 'Opens 30000-32767 on all nodes.', use: 'Dev/test' },
                { type: 'LoadBalancer', internal: true, external: true, desc: 'Cloud LB (AWS NLB/ALB).', use: 'Production' }
              ].map((svc, i) => (
                <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold">{svc.type}</h3>
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${svc.internal ? 'bg-emerald-600' : 'bg-slate-700'}`}>Int</span>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${svc.external ? 'bg-blue-600' : 'bg-slate-700'}`}>Ext</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-1">{svc.desc}</p>
                  <div className="text-[10px] text-slate-500">Use: {svc.use}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-cyan-500">
              <h3 className="font-bold text-cyan-400 text-sm mb-2">kube-proxy: iptables vs IPVS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg">
                  <div className="font-medium text-slate-300 text-xs mb-1">iptables (Legacy)</div>
                  <p className="text-slate-400 text-[10px]">O(n) rules. Falls over ~5000 services.</p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-cyan-500/30">
                  <div className="font-medium text-cyan-400 text-xs mb-1">IPVS (Recommended)</div>
                  <p className="text-slate-400 text-[10px]">O(1) hash. 100k+ services.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold mb-2">CNI Plugins</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  { name: 'Flannel', tag: 'Simple', desc: 'VXLAN overlay. No NetworkPolicy.', color: '#f59e0b' },
                  { name: 'Calico', tag: 'Enterprise', desc: 'BGP routing. Full policies.', color: '#ef4444' },
                  { name: 'Cilium', tag: 'eBPF', desc: 'L7 policies, observability.', color: '#8b5cf6' }
                ].map((cni, i) => (
                  <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs">{cni.name}</span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: cni.color + '25', color: cni.color }}>{cni.tag}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{cni.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== INGRESS VIEW (NEW) ==================== */}
        {activeView === 'ingress' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Ingress Traffic Flow</h2>
                <p className="text-slate-500 text-xs">How external HTTP(S) reaches your Pods</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIngressStep(0); setIsIngressPlaying(true); }} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium">▶ Play</button>
                <button onClick={() => setIngressStep(s => Math.max(0, s - 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">←</button>
                <button onClick={() => setIngressStep(s => Math.min(5, s + 1))} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs">→</button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 overflow-x-auto">
              <div className="min-w-[700px]">
                <svg viewBox="0 0 750 260" className="w-full h-auto">
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

            <div className="bg-slate-800 rounded-xl p-4 border-l-4 border-orange-500">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Step {ingressStep + 1}/6</span>
                <h3 className="text-sm font-semibold">{ingressSteps[ingressStep].label}</h3>
              </div>
              <p className="text-slate-400 text-xs">{ingressSteps[ingressStep].description}</p>
            </div>

            <div className="flex gap-1">
              {ingressSteps.map((_, i) => (
                <button key={i} onClick={() => setIngressStep(i)}
                  className={`flex-1 h-1.5 rounded-full transition-all ${i === ingressStep ? 'bg-orange-500' : i < ingressStep ? 'bg-orange-800' : 'bg-slate-700'}`} />
              ))}
            </div>

            {/* Key Insight */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <h3 className="font-bold text-sm mb-2 text-orange-400">Key Insight: Ingress Controller ≠ kube-proxy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-purple-400 font-semibold mb-1">Ingress Controller</div>
                  <p className="text-slate-400">L7 proxy (HTTP). Reads Ingress resources from API server. Routes by Host/Path headers. Connects directly to Pod IPs.</p>
                </div>
                <div className="bg-slate-800 p-3 rounded">
                  <div className="text-blue-400 font-semibold mb-1">kube-proxy</div>
                  <p className="text-slate-400">L4 (TCP/UDP). Programs iptables/IPVS on every node. Routes ClusterIP → Pod IPs. No HTTP awareness.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TROUBLESHOOTING VIEW ==================== */}
        {activeView === 'troubleshooting' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold mb-1">Troubleshooting Decision Trees</h2>
              <p className="text-slate-500 text-xs">Common failures and diagnostics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {troubleshootingScenarios.map((scenario, i) => (
                <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                  <h3 className="text-sm font-bold text-red-400 mb-2">{scenario.title}</h3>
                  <div className="bg-slate-800 rounded p-2 mb-3">
                    <div className="text-[10px] text-slate-500 uppercase mb-0.5">Symptom</div>
                    <p className="text-slate-300 text-xs">{scenario.symptom}</p>
                  </div>
                  <div className="space-y-2">
                    {scenario.causes.map((cause, j) => (
                      <div key={j} className="border-l-2 border-slate-700 pl-2">
                        <div className="text-xs font-medium text-white mb-0.5">{cause.cause}</div>
                        <div className="text-[10px] text-slate-400 mb-0.5">
                          <span className="text-blue-400">Check: </span>
                          <code className="bg-slate-800 px-1 rounded">{cause.check}</code>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-slate-500">Fix: </span>
                          <span className="text-emerald-400">{cause.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-bold text-sm mb-2">Quick Commands</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="space-y-1">
                  <div><span className="text-emerald-400">kubectl describe pod &lt;name&gt;</span> <span className="text-slate-500">- Events</span></div>
                  <div><span className="text-emerald-400">kubectl logs &lt;pod&gt; --previous</span> <span className="text-slate-500">- Crash logs</span></div>
                  <div><span className="text-emerald-400">kubectl get events --sort-by='.lastTimestamp'</span></div>
                </div>
                <div className="space-y-1">
                  <div><span className="text-emerald-400">kubectl get endpoints &lt;svc&gt;</span> <span className="text-slate-500">- Service targets</span></div>
                  <div><span className="text-emerald-400">kubectl exec -it &lt;pod&gt; -- nslookup kubernetes</span></div>
                  <div><span className="text-emerald-400">kubectl top nodes</span> <span className="text-slate-500">- Resources</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== QUIZ VIEW ==================== */}
        {activeView === 'quiz' && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">Knowledge Check</h2>
              <p className="text-slate-400 text-xs">Test your K8s internals understanding</p>
            </div>

            {!showQuizResult ? (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Q {currentQuestion + 1}/{quizQuestions.length}</span>
                  <span className="text-xs font-bold text-emerald-500">Score: {quizScore}</span>
                </div>
                
                <h3 className="text-base font-bold mb-5">{quizQuestions[currentQuestion].q}</h3>
                
                <div className="space-y-2">
                  {quizQuestions[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === quizQuestions[currentQuestion].correct;
                    const showCorrectness = selectedAnswer !== null;
                    
                    let bgClass = "bg-slate-800 hover:bg-slate-700";
                    if (showCorrectness) {
                      if (isCorrect) bgClass = "bg-emerald-600/20 border-emerald-500";
                      else if (isSelected && !isCorrect) bgClass = "bg-red-600/20 border-red-500";
                      else bgClass = "opacity-40 bg-slate-800";
                    }

                    return (
                      <button key={index} onClick={() => !showCorrectness && handleQuizAnswer(index)} disabled={showCorrectness}
                        className={`w-full text-left p-3 rounded-lg border border-transparent transition-all text-sm ${bgClass}`}>
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
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
                <div className="text-5xl mb-3">🏆</div>
                <h3 className="text-xl font-bold mb-1">Complete!</h3>
                <p className="text-slate-400 mb-4">Score: <span className="text-emerald-400 font-bold">{quizScore}</span> / {quizQuestions.length}</p>
                <div className="w-full bg-slate-800 rounded-full h-3 mb-5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all" style={{ width: `${(quizScore / quizQuestions.length) * 100}%` }} />
                </div>
                <button onClick={restartQuiz} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm">Try Again</button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-800 bg-slate-900/50 py-2 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-slate-600">
          1-7 switch views • ← → navigate • Space play • Esc clear
        </div>
      </div>
    </div>
  );
}
