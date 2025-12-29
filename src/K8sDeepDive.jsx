import React, { useState, useEffect } from 'react';

const K8sDeepDive = () => {
  const [activeView, setActiveView] = useState('architecture');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [flowStep, setFlowStep] = useState(0);
  const [isFlowPlaying, setIsFlowPlaying] = useState(false);
  const [schedulerStep, setSchedulerStep] = useState(0);

  // Auto-advance flow animation
  useEffect(() => {
    if (isFlowPlaying && flowStep < 7) {
      const timer = setTimeout(() => setFlowStep(f => f + 1), 1500);
      return () => clearTimeout(timer);
    } else if (flowStep >= 7) {
      setIsFlowPlaying(false);
    }
  }, [isFlowPlaying, flowStep]);

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
      flow: 'kubectl apply → AuthN → AuthZ (RBAC) → Admission → etcd write → Watch notification to controllers'
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
      flow: 'Write → Leader receives → Replicates to quorum → Commit → ACK back'
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
      flow: 'New Pod detected → Filter nodes → Score remaining → Select winner → Bind to node'
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
      flow: 'Watch event → Read desired state → Read actual state → Diff → Act → Loop'
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
      flow: 'Watch for PodSpecs → Pull images → Create sandbox → Start containers → Monitor → Report'
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
      flow: 'Watch Services/Endpoints → Update iptables/IPVS → Traffic flows via kernel'
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
      flow: 'CRI call → Pull image layers → Create namespaces → Apply cgroups → Start process'
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
    { label: 'All Nodes', count: 100, passed: true, description: 'Starting pool of all nodes in cluster' },
    { label: 'NodeSelector', count: 45, passed: true, description: 'Filter: node.kubernetes.io/type=compute' },
    { label: 'Resources', count: 32, passed: true, description: 'Filter: Need 2 CPU, 4Gi RAM available' },
    { label: 'Taints', count: 28, passed: true, description: 'Filter: Tolerate only monitoring taints' },
    { label: 'Affinity', count: 12, passed: true, description: 'Filter: requiredDuringScheduling zone=us-east-1a' },
    { label: 'Anti-Affinity', count: 8, passed: true, description: 'Filter: Don\'t colocate with other DB pods' },
    { label: 'Scoring', count: 1, passed: true, description: 'Score remaining 8: LeastRequestedPriority wins node-7' }
  ];

  const Component = ({ id, label, x, y, type = 'control', onClick, isActive }) => (
    <g 
      onClick={() => onClick(id)} 
      style={{ cursor: 'pointer' }}
      className="transition-all duration-300"
    >
      <rect
        x={x}
        y={y}
        width={120}
        height={50}
        rx={6}
        fill={isActive ? (type === 'control' ? '#3b82f6' : '#10b981') : (type === 'control' ? '#1e3a5f' : '#134e3a')}
        stroke={isActive ? '#fff' : (type === 'control' ? '#3b82f6' : '#10b981')}
        strokeWidth={isActive ? 3 : 2}
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
      {isActive && (
        <circle cx={x + 110} cy={y + 10} r={6} fill="#22c55e" className="animate-pulse" />
      )}
    </g>
  );

  const Arrow = ({ x1, y1, x2, y2, isActive, curved = false }) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const path = curved 
      ? `M ${x1} ${y1} Q ${midX} ${y1 - 30} ${x2} ${y2}`
      : `M ${x1} ${y1} L ${x2} ${y2}`;
    
    return (
      <g>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={isActive ? '#22c55e' : '#475569'} />
          </marker>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={isActive ? '#22c55e' : '#475569'}
          strokeWidth={isActive ? 3 : 2}
          markerEnd="url(#arrowhead)"
          strokeDasharray={isActive ? '8 4' : 'none'}
          className={isActive ? 'animate-pulse' : ''}
        />
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Kubernetes Internals
              </h1>
              <p className="text-slate-500 text-sm mt-1">Interactive Architecture Deep Dive</p>
            </div>
            <div className="flex gap-2">
              {['architecture', 'flow', 'scheduler', 'networking'].map(view => (
                <button
                  key={view}
                  onClick={() => {setActiveView(view); setSelectedComponent(null); setFlowStep(0); setIsFlowPlaying(false);}}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeView === view 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Architecture View */}
        {activeView === 'architecture' && (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-semibold mb-4 text-slate-300">Click any component to explore →</h2>
                <svg viewBox="0 0 700 420" className="w-full">
                  {/* Control Plane Box */}
                  <rect x={20} y={20} width={660} height={170} rx={12} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" />
                  <text x={40} y={50} fill="#3b82f6" fontSize={14} fontWeight={700}>CONTROL PLANE (The Brain)</text>
                  
                  <Component id="apiserver" label="API Server" x={50} y={70} onClick={setSelectedComponent} isActive={selectedComponent === 'apiserver'} />
                  <Component id="etcd" label="etcd" x={200} y={70} onClick={setSelectedComponent} isActive={selectedComponent === 'etcd'} />
                  <Component id="scheduler" label="Scheduler" x={350} y={70} onClick={setSelectedComponent} isActive={selectedComponent === 'scheduler'} />
                  <Component id="controller" label="Controllers" x={500} y={70} onClick={setSelectedComponent} isActive={selectedComponent === 'controller'} />
                  
                  {/* Arrows within control plane */}
                  <Arrow x1={170} y1={95} x2={195} y2={95} />
                  <Arrow x1={110} y1={125} x2={350} y2={125} curved />
                  <Arrow x1={110} y1={130} x2={500} y2={130} curved />
                  
                  {/* Worker Node Box */}
                  <rect x={20} y={230} width={660} height={170} rx={12} fill="none" stroke="#10b981" strokeWidth={2} strokeDasharray="8 4" />
                  <text x={40} y={260} fill="#10b981" fontSize={14} fontWeight={700}>WORKER NODE (The Muscle)</text>
                  
                  <Component id="kubelet" label="kubelet" x={50} y={280} type="worker" onClick={setSelectedComponent} isActive={selectedComponent === 'kubelet'} />
                  <Component id="kubeproxy" label="kube-proxy" x={200} y={280} type="worker" onClick={setSelectedComponent} isActive={selectedComponent === 'kubeproxy'} />
                  <Component id="runtime" label="containerd" x={350} y={280} type="worker" onClick={setSelectedComponent} isActive={selectedComponent === 'runtime'} />
                  
                  {/* Pod representations */}
                  <rect x={500} y={270} width={150} height={80} rx={8} fill="#1e293b" stroke="#475569" strokeWidth={1} />
                  <text x={575} y={295} textAnchor="middle" fill="#94a3b8" fontSize={10}>PODS</text>
                  <rect x={515} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                  <rect x={557} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                  <rect x={599} y={305} width={35} height={35} rx={4} fill="#0f172a" stroke="#10b981" />
                  
                  {/* Cross-plane arrows */}
                  <Arrow x1={110} y1={195} x2={110} y2={275} />
                  <Arrow x1={260} y1={195} x2={260} y2={275} />
                  <Arrow x1={170} y1={305} x2={345} y2={305} />
                  <Arrow x1={470} y1={320} x2={495} y2={320} />
                </svg>
              </div>
            </div>
            
            {/* Detail Panel */}
            <div className="col-span-1">
              {selectedComponent ? (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 sticky top-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-xl font-bold text-white">{componentDetails[selectedComponent].name}</h3>
                  </div>
                  <div className="text-emerald-400 text-sm font-semibold mb-3">{componentDetails[selectedComponent].role}</div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Analogy</div>
                    <p className="text-slate-300 text-sm leading-relaxed">{componentDetails[selectedComponent].analogy}</p>
                  </div>
                  
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
                  <p className="text-slate-600 text-sm">Click on any box in the architecture diagram to see detailed internals, analogies, and data flows.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flow View - Deployment Lifecycle */}
        {activeView === 'flow' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Deployment Lifecycle: From YAML to Running Pods</h2>
                <p className="text-slate-500 text-sm">Watch how a single `kubectl apply` cascades through the entire system</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setFlowStep(0); setIsFlowPlaying(true); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium"
                >
                  ▶ Play Animation
                </button>
                <button
                  onClick={() => setFlowStep(s => Math.max(0, s - 1))}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setFlowStep(s => Math.min(7, s + 1))}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <svg viewBox="0 0 800 300" className="w-full">
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
                
                {/* Kube-proxy */}
                <rect x={610} y={250} width={100} height={40} rx={6} fill={flowSteps[flowStep].active.includes('kubeproxy') ? '#f97316' : '#6b3410'} stroke="#f97316" strokeWidth={2} />
                <text x={660} y={275} textAnchor="middle" fill="#fff" fontSize={10}>kube-proxy</text>
                
                {/* etcd */}
                <rect x={160} y={180} width={100} height={40} rx={6} fill="#1e293b" stroke="#64748b" strokeWidth={2} />
                <text x={210} y={205} textAnchor="middle" fill="#94a3b8" fontSize={10}>etcd</text>
                
                {/* Arrows based on step */}
                {flowStep >= 0 && <Arrow x1={110} y1={150} x2={155} y2={90} isActive={flowStep === 0} />}
                {flowStep >= 1 && <Arrow x1={210} y1={105} x2={210} y2={175} isActive={flowStep === 1} />}
                {flowStep >= 2 && <Arrow x1={265} y1={80} x2={305} y2={80} isActive={flowStep === 2} />}
                {flowStep >= 3 && <Arrow x1={415} y1={80} x2={455} y2={80} isActive={flowStep >= 3 && flowStep <= 4} />}
                {flowStep >= 5 && <Arrow x1={510} y1={105} x2={510} y2={175} isActive={flowStep === 5} />}
                {flowStep >= 6 && <Arrow x1={565} y1={200} x2={605} y2={200} isActive={flowStep === 6} />}
                {flowStep >= 7 && <Arrow x1={560} y1={225} x2={620} y2={250} isActive={flowStep === 7} />}
              </svg>
            </div>

            {/* Current Step Description */}
            <div className="bg-slate-800 rounded-xl p-6 border-l-4 border-emerald-500">
              <div className="flex items-center gap-4 mb-2">
                <span className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">Step {flowStep + 1}/8</span>
                <h3 className="text-lg font-semibold">{flowSteps[flowStep].label}</h3>
              </div>
              <p className="text-slate-400">{flowSteps[flowStep].description}</p>
            </div>

            {/* Timeline */}
            <div className="flex gap-2">
              {flowSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setFlowStep(i)}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    i === flowStep ? 'bg-emerald-500' : i < flowStep ? 'bg-emerald-800' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scheduler View */}
        {activeView === 'scheduler' && (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold mb-2">Scheduler Funnel: How Nodes Are Selected</h2>
              <p className="text-slate-500 text-sm mb-6">Not magic. Just a systematic filter → score → bind process.</p>
              
              <div className="space-y-3">
                {schedulerSteps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setSchedulerStep(i)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      schedulerStep === i 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{step.label}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-mono ${
                        step.count === 1 ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}>
                        {step.count} nodes
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">Step: {schedulerSteps[schedulerStep].label}</h3>
                <p className="text-slate-400">{schedulerSteps[schedulerStep].description}</p>
              </div>
              
              {/* Visual funnel */}
              <div className="space-y-2">
                {schedulerSteps.slice(0, schedulerStep + 1).map((step, i) => (
                  <div
                    key={i}
                    className="h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded transition-all"
                    style={{ 
                      width: `${step.count}%`,
                      opacity: i === schedulerStep ? 1 : 0.4
                    }}
                  />
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">The Core Insight</div>
                <p className="text-slate-300 text-sm">
                  {schedulerStep < 5 
                    ? "Filtering is elimination. Every predicate must pass or the node is OUT."
                    : schedulerStep === 5
                    ? "Anti-affinity prevents co-location. If another DB pod exists on a node, it's eliminated."
                    : "Scoring ranks survivors. LeastRequestedPriority prefers nodes with more headroom."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Networking View */}
        {activeView === 'networking' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-2">The Four Networks + Service Types</h2>
              <p className="text-slate-500 text-sm">Kubernetes assumes a flat network. Every Pod gets a unique, routable IP.</p>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Node Network', desc: 'Physical/virtual links between VMs', color: 'blue' },
                { name: 'Pod Network', desc: 'Overlay (Calico/Cilium). IP-per-Pod', color: 'emerald' },
                { name: 'Service Network', desc: 'Virtual IPs. iptables/IPVS rules only', color: 'purple' },
                { name: 'External', desc: 'Ingress. Traffic from outside cluster', color: 'orange' }
              ].map((net, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-xl border-2 border-${net.color}-500/30 bg-${net.color}-500/10`}
                  style={{ borderColor: `var(--${net.color}-500)` }}
                >
                  <div className={`text-${net.color}-400 font-bold mb-2`} style={{ color: net.color === 'blue' ? '#60a5fa' : net.color === 'emerald' ? '#34d399' : net.color === 'purple' ? '#a78bfa' : '#fb923c' }}>{net.name}</div>
                  <p className="text-slate-400 text-sm">{net.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { type: 'ClusterIP', internal: true, external: false, desc: 'Internal only. Virtual IP exists only as iptables rules. Default type.', useCase: 'Backend services, databases' },
                { type: 'NodePort', internal: true, external: true, desc: 'Opens port 30000-32767 on EVERY node. Traffic routes to pods.', useCase: 'Dev/test, on-prem without LB' },
                { type: 'LoadBalancer', internal: true, external: true, desc: 'Cloud provisions external LB (AWS NLB/ALB). Points to NodePorts.', useCase: 'Production external traffic' }
              ].map((svc, i) => (
                <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{svc.type}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${svc.internal ? 'bg-emerald-600' : 'bg-slate-700'}`}>Internal</span>
                      <span className={`px-2 py-1 text-xs rounded ${svc.external ? 'bg-blue-600' : 'bg-slate-700'}`}>External</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{svc.desc}</p>
                  <div className="text-xs text-slate-500">Use case: {svc.useCase}</div>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-800 rounded-xl p-6 border-l-4 border-cyan-500">
              <h3 className="font-bold text-cyan-400 mb-2">kube-proxy Modes: Why IPVS Wins at Scale</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <div className="font-semibold text-slate-300 mb-2">iptables (Legacy)</div>
                  <p className="text-slate-400">O(n) rules. Every service = more rules = more latency. Falls over at ~5000 services.</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-cyan-500/30">
                  <div className="font-semibold text-cyan-400 mb-2">IPVS (Recommended)</div>
                  <p className="text-slate-400">O(1) hash lookup. Handles 100k+ services. Supports proper LB algos (least connections).</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default K8sDeepDive;
