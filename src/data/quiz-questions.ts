import type { QuizQuestion } from "./types";

export const quizQuestions: Record<string, QuizQuestion[]> = {
  beginner: [
    {
      q: "Which component is the only one that communicates directly with etcd?",
      options: [
        "kube-scheduler",
        "kube-apiserver",
        "kubelet",
        "kube-controller-manager",
      ],
      correct: 1,
    },
    {
      q: "If you have 1000 Services, which kube-proxy mode should you use?",
      options: ["userspace", "iptables", "IPVS", "ebpf-lite"],
      correct: 2,
    },
    {
      q: "Which is NOT a phase in the Pod lifecycle?",
      options: ["Pending", "ContainerCreating", "Running", "Compiling"],
      correct: 3,
    },
    {
      q: "What happens if a Pod lacks a Toleration for a node's Taint?",
      options: [
        "Pod warns but schedules",
        "Pod rejected from that node",
        "Pod crashes",
        "Node deletes Pod",
      ],
      correct: 1,
    },
    {
      q: "Which component talks to the container runtime via CRI?",
      options: ["kube-proxy", "etcd", "kubelet", "Cloud Controller"],
      correct: 2,
    },
    {
      q: "Where does an Ingress Controller get its routing rules from?",
      options: [
        "ConfigMap only",
        "API Server (Ingress resources)",
        "CoreDNS",
        "kube-proxy",
      ],
      correct: 1,
    },
    {
      q: "What key format does etcd use to store a Pod named 'web' in namespace 'prod'?",
      options: [
        "/pods/prod/web",
        "/registry/pods/prod/web",
        "/v1/pods/web",
        "/api/pods/prod-web",
      ],
      correct: 1,
    },
  ],
  intermediate: [
    {
      q: "What is the primary difference between a DaemonSet and a Deployment?",
      options: [
        "DaemonSets use more memory",
        "DaemonSets run one pod per node",
        "DaemonSets can't be updated",
        "DaemonSets are stateful",
      ],
      correct: 1,
    },
    {
      q: "In a StatefulSet, how are pod names assigned?",
      options: [
        "Random UUIDs",
        "Sequential ordinal indices (0,1,2...)",
        "By node name",
        "By creation timestamp",
      ],
      correct: 1,
    },
    {
      q: "What happens to a StatefulSet's PersistentVolume when the pod is deleted?",
      options: [
        "Automatically deleted",
        "Retained (not deleted)",
        "Moved to another pod",
        "Backed up to etcd",
      ],
      correct: 1,
    },
    {
      q: "Which RBAC resource binds a Role to a user/group within a namespace?",
      options: [
        "ClusterRoleBinding",
        "RoleBinding",
        "ServiceAccount",
        "RoleAttachment",
      ],
      correct: 1,
    },
    {
      q: "What component watches for new Custom Resource Definition (CRD) instances?",
      options: [
        "API Server only",
        "Custom Controller/Operator",
        "Scheduler",
        "Kubelet",
      ],
      correct: 1,
    },
    {
      q: "DaemonSets ignore which scheduler constraint by default?",
      options: [
        "Taints",
        "Node affinity",
        "Resource limits",
        "Unschedulable nodes",
      ],
      correct: 3,
    },
    {
      q: "What field in StatefulSet spec controls the number of pods updated at once?",
      options: ["maxSurge", "partition", "maxUnavailable", "parallelism"],
      correct: 1,
    },
  ],
  advanced: [
    {
      q: "In RBAC, what is the difference between Role and ClusterRole?",
      options: [
        "Roles are deprecated",
        "Roles are namespaced, ClusterRoles are cluster-wide",
        "ClusterRoles can't modify resources",
        "No difference",
      ],
      correct: 1,
    },
    {
      q: "When creating a CRD, which field defines the API group?",
      options: [
        "metadata.group",
        "spec.group",
        "apiVersion",
        "spec.names.group",
      ],
      correct: 1,
    },
    {
      q: "What is the purpose of a StatefulSet's serviceName field?",
      options: [
        "For monitoring",
        "Creates headless Service for network identity",
        "Sets pod hostname",
        "Required but unused",
      ],
      correct: 1,
    },
    {
      q: "How does a DaemonSet ensure pods run even on nodes with NoSchedule taints?",
      options: [
        "It doesn't",
        "Automatic tolerations for critical DaemonSets",
        "Bypasses scheduler entirely",
        "Removes taints temporarily",
      ],
      correct: 1,
    },
    {
      q: "What does spec.updateStrategy.rollingUpdate.partition do in StatefulSets?",
      options: [
        "Limits replicas",
        "Updates pods with ordinal >= partition value",
        "Splits pods across zones",
        "Partitions storage",
      ],
      correct: 1,
    },
    {
      q: "Which verb in RBAC allows reading secrets?",
      options: ["read", "get", "list", "watch"],
      correct: 1,
    },
    {
      q: "What is the purpose of CRD validation schemas (OpenAPI v3)?",
      options: [
        "Performance optimization",
        "Validate custom resource instances before persistence",
        "Generate documentation",
        "Enable caching",
      ],
      correct: 1,
    },
    {
      q: "How do you make a CRD subresource like /status or /scale available?",
      options: [
        "They're automatic",
        "Define in spec.subresources",
        "Create separate CRD",
        "Use admission webhooks",
      ],
      correct: 1,
    },
    {
      q: "What is the finalizer pattern in custom controllers?",
      options: [
        "Cleanup hook before resource deletion",
        "Final update after creation",
        "End-of-lifecycle logging",
        "Performance optimization",
      ],
      correct: 0,
    },
    {
      q: "In StatefulSets, what is the pod management policy 'Parallel' vs 'OrderedReady'?",
      options: [
        "No difference",
        "Parallel creates/deletes pods simultaneously",
        "Parallel uses more CPU",
        "OrderedReady is deprecated",
      ],
      correct: 1,
    },
  ],
};
