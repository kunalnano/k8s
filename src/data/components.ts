import type { ComponentDetail, YamlFieldMapping } from "./types";

export const componentDetails: Record<string, ComponentDetail> = {
  apiserver: {
    id: "apiserver",
    name: "kube-apiserver",
    role: "The Front Door & Traffic Cop",
    analogy:
      "Think of it as the receptionist at a hospital - every request (patient) must check in here first. It validates identity, checks permissions, and routes to the right department.",
    internals: [
      "Stateless - scales horizontally behind a load balancer",
      "Only component that touches etcd directly",
      "Runs Admission Controllers (mutating → validating) before persisting",
      "All cluster communication flows through here - components never talk directly",
    ],
    flow: "kubectl apply → AuthN → AuthZ (RBAC) → Admission → etcd write → Watch notification to controllers",
    scaleNote:
      "⚠️ Horizontal scaling required at ~500 nodes. Tune --max-requests-inflight.",
    failure: {
      symptom: "All kubectl commands hang or timeout",
      impact:
        "Complete cluster management blackout. Running pods continue but no changes possible.",
      check: "kubectl cluster-info; curl -k https://<master>:6443/healthz",
      recovery:
        "Check API server pod logs, verify etcd connectivity, check certificates",
    },
    yamlFields: ["apiVersion", "kind", "metadata"],
  },
  etcd: {
    id: "etcd",
    name: "etcd",
    role: "The Source of Truth",
    analogy:
      "The hospital's medical records system. If this burns down, you lose who every patient is, what treatments they need, everything. Raft consensus = multiple copies in different buildings.",
    internals: [
      "Key-value store using Raft consensus (3 or 5 node quorum)",
      "Stores ENTIRE cluster state: nodes, pods, configmaps, secrets, everything",
      "Watches enable reactive updates - controllers subscribe to changes",
      "Performance bottleneck at scale - limit to ~100 pods/second creation",
    ],
    flow: "Write → Leader receives → Replicates to quorum → Commit → ACK back",
    scaleNote:
      "🔴 CRITICAL: Never exceed 5 nodes. 3-node = survives 1 failure.",
    failure: {
      symptom: "Cluster completely frozen. API server returns 500s.",
      impact:
        "CATASTROPHIC. All state lost if no backup. Cluster unrecoverable without restore.",
      check: "etcdctl endpoint health; etcdctl member list",
      recovery:
        "Restore from snapshot: etcdctl snapshot restore. Prevent: automated backups to S3/GCS.",
    },
    yamlFields: ["metadata.name", "metadata.namespace", "metadata.labels"],
  },
  scheduler: {
    id: "scheduler",
    name: "kube-scheduler",
    role: "The Assignment Engine",
    analogy:
      "Like a hotel concierge assigning rooms. Guest (pod) arrives, concierge checks which rooms fit (filtering), then picks the best one based on preferences (scoring).",
    internals: [
      "Watches for Pods with spec.nodeName = empty",
      "Filter phase: hard constraints (taints, affinity, resources)",
      "Score phase: soft preferences (spread, bin-packing)",
      "Binding: writes decision back to API server",
    ],
    flow: "New Pod detected → Filter nodes → Score remaining → Select winner → Bind to node",
    scaleNote:
      "⚡ Single scheduler handles ~5000 nodes. Use multiple for multi-tenancy.",
    failure: {
      symptom: "All new pods stuck in Pending state forever",
      impact: "No new workloads scheduled. Existing pods unaffected.",
      check: "kubectl get pods -n kube-system | grep scheduler",
      recovery:
        "Scheduler is stateless - just restart it. Check for resource exhaustion.",
    },
    yamlFields: ["spec.nodeSelector", "spec.affinity", "spec.tolerations"],
  },
  controller: {
    id: "controller",
    name: "kube-controller-manager",
    role: "The Reconciliation Army",
    analogy:
      'A team of janitors who each have one job: "Keep X clean." Deployment janitor ensures 3 replicas. Node janitor marks dead nodes. They work independently, reacting to etcd changes.',
    internals: [
      "Single binary running ~30+ controllers in goroutines",
      "Each controller watches specific resources via API server",
      "Node controller: 5-minute timeout → mark NotReady → evict pods",
      "ReplicaSet controller: diff current vs desired, create/delete pods",
    ],
    flow: "Watch event → Read desired state → Read actual state → Diff → Act → Loop",
    scaleNote:
      "⚙️ Most controllers are leader-elected. Only one active at a time.",
    failure: {
      symptom:
        "Deployments don't scale, dead nodes not detected, endpoints not updated",
      impact: "Cluster drift. Desired state diverges from actual state.",
      check: "kubectl get pods -n kube-system | grep controller",
      recovery:
        "Restart controller-manager. State will reconcile automatically.",
    },
    yamlFields: ["spec.replicas", "spec.selector", "spec.strategy"],
  },
  kubelet: {
    id: "kubelet",
    name: "kubelet",
    role: "The Node Captain",
    analogy:
      "The site foreman on a construction site. HQ (control plane) sends blueprints (PodSpecs), foreman makes sure the actual building matches. Reports status back up.",
    internals: [
      "Runs on every node as a systemd service (not a pod!)",
      "Talks to Container Runtime via CRI (gRPC)",
      "Manages probes: Liveness (restart?), Readiness (route traffic?), Startup (delay probes?)",
      "Reports node status (capacity, conditions) every 10s",
    ],
    flow: "Watch for PodSpecs → Pull images → Create sandbox → Start containers → Monitor → Report",
    scaleNote:
      "📊 Each kubelet handles ~110 pods max by default. Tune --max-pods.",
    failure: {
      symptom:
        "Node shows NotReady. Pods on that node evicted after 5 minutes.",
      impact:
        "Single node failure. Pods rescheduled elsewhere (if resources available).",
      check: "systemctl status kubelet; journalctl -u kubelet -f",
      recovery:
        "Check disk pressure, memory, kubelet certificates, container runtime health.",
    },
    yamlFields: ["spec.containers", "spec.volumes", "spec.restartPolicy"],
  },
  kubeproxy: {
    id: "kubeproxy",
    name: "kube-proxy",
    role: "The Network Plumber",
    analogy:
      'Like the building\'s HVAC routing system. When you call "billing department" (Service), it routes your call to one of the actual desks (Pod IPs) in that department.',
    internals: [
      "Implements Services by programming node network rules",
      "iptables mode: O(n) rules - each Service = more latency at scale",
      "IPVS mode: O(1) lookup via kernel hash table - use this at scale",
      "Does NOT proxy traffic - just sets up rules so kernel handles it",
    ],
    flow: "Watch Services/Endpoints → Update iptables/IPVS → Traffic flows via kernel",
    scaleNote:
      "🚨 Switch to IPVS mode beyond 1000 Services. iptables = O(n) bottleneck.",
    failure: {
      symptom: "Services unreachable. ClusterIP connections timeout.",
      impact:
        "Service discovery broken on affected nodes. Pod-to-pod still works.",
      check:
        "kubectl get pods -n kube-system | grep proxy; iptables -t nat -L | grep KUBE",
      recovery: "Restart kube-proxy. Check for iptables rule corruption.",
    },
    yamlFields: ["spec.ports", "spec.selector", "spec.type"],
  },
  runtime: {
    id: "runtime",
    name: "Container Runtime",
    role: "The Execution Engine",
    analogy:
      'The actual construction workers. Kubelet says "build this container," runtime actually pulls materials (images) and constructs it (namespaces, cgroups).',
    internals: [
      "containerd is the standard (Docker is now just a shim around it)",
      "Uses OCI images and runtimes (runc for Linux namespaces)",
      "Handles image pulling, layer caching, lifecycle management",
      "CRI-O is the lightweight alternative for pure Kubernetes",
    ],
    flow: "CRI call → Pull image layers → Create namespaces → Apply cgroups → Start process",
    scaleNote:
      "💾 Image pull parallelism defaults to 5. Increase for large clusters.",
    failure: {
      symptom: "Pods stuck in ContainerCreating. ImagePullBackOff errors.",
      impact:
        "No new containers on affected node. Existing containers may continue.",
      check: "crictl ps; crictl info; systemctl status containerd",
      recovery:
        "Restart containerd. Check disk space, registry connectivity, image pull secrets.",
    },
    yamlFields: [
      "spec.containers[].image",
      "spec.containers[].resources",
      "spec.containers[].ports",
    ],
  },
};

export const yamlFieldMapping: Record<string, YamlFieldMapping> = {
  apiVersion: {
    component: "apiserver",
    desc: "API Server validates version and routes to correct API group",
  },
  kind: {
    component: "apiserver",
    desc: "Determines which controller will handle this resource",
  },
  "metadata.name": {
    component: "etcd",
    desc: "Stored as key in etcd: /registry/{kind}/{namespace}/{name}",
  },
  "metadata.namespace": {
    component: "etcd",
    desc: "Partition key - isolates resources logically",
  },
  "metadata.labels": {
    component: "etcd",
    desc: "Indexed for fast label selector queries",
  },
  "spec.replicas": {
    component: "controller",
    desc: "ReplicaSet controller reconciles actual vs desired count",
  },
  "spec.selector": {
    component: "controller",
    desc: "Controller uses this to find pods it owns",
  },
  "spec.strategy": {
    component: "controller",
    desc: "Deployment controller uses for rolling update logic",
  },
  "spec.nodeSelector": {
    component: "scheduler",
    desc: "Hard constraint - filter phase eliminates non-matching nodes",
  },
  "spec.affinity": {
    component: "scheduler",
    desc: "Soft/hard constraints for node and pod placement",
  },
  "spec.tolerations": {
    component: "scheduler",
    desc: "Allows scheduling on tainted nodes",
  },
  "spec.containers": {
    component: "kubelet",
    desc: "Kubelet creates these via CRI calls to runtime",
  },
  "spec.containers[].image": {
    component: "runtime",
    desc: "Runtime pulls from registry, caches layers",
  },
  "spec.containers[].resources": {
    component: "scheduler",
    desc: "Scheduler uses for bin-packing; kubelet enforces via cgroups",
  },
  "spec.volumes": {
    component: "kubelet",
    desc: "Kubelet mounts volumes before starting containers",
  },
  "spec.restartPolicy": {
    component: "kubelet",
    desc: "Kubelet decides whether to restart failed containers",
  },
  "spec.ports": {
    component: "kubeproxy",
    desc: "kube-proxy creates iptables/IPVS rules for Service",
  },
  "spec.type": {
    component: "kubeproxy",
    desc: "Determines ClusterIP/NodePort/LoadBalancer behavior",
  },
};

export const sampleDeploymentYaml: string = `apiVersion: apps/v1
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
