import type { FlowStep } from "./types";

export const flowSteps: FlowStep[] = [
  {
    id: 0,
    label: "kubectl apply deployment.yaml",
    active: ["user"],
    description:
      "You submit a Deployment manifest. kubectl serializes to JSON and sends to API server.",
  },
  {
    id: 1,
    label: "API Server processes request",
    active: ["apiserver"],
    description:
      "AuthN (who are you?) → AuthZ (can you do this?) → Admission (modify/validate) → Persist to etcd.",
  },
  {
    id: 2,
    label: "Deployment Controller reacts",
    active: ["controller", "apiserver"],
    description:
      "Deployment controller watches for new Deployments. Sees yours, creates a ReplicaSet.",
  },
  {
    id: 3,
    label: "ReplicaSet Controller reacts",
    active: ["controller", "apiserver"],
    description:
      "ReplicaSet controller sees RS with 0 pods but wants 3. Creates 3 Pod objects (still unscheduled).",
  },
  {
    id: 4,
    label: "Scheduler assigns nodes",
    active: ["scheduler", "apiserver"],
    description:
      "Scheduler finds Pods with no nodeName. Runs filter/score, binds each Pod to a Node.",
  },
  {
    id: 5,
    label: "Kubelet sees its work",
    active: ["kubelet", "apiserver"],
    description:
      "Kubelet on each assigned Node watches for Pods with its nodeName. Sees new work.",
  },
  {
    id: 6,
    label: "Runtime creates containers",
    active: ["kubelet", "runtime"],
    description:
      "Kubelet calls containerd via CRI. Image pulled, container started, probes begin.",
  },
  {
    id: 7,
    label: "Pod becomes Ready",
    active: ["kubelet", "kubeproxy"],
    description:
      "Container passes readiness probe. Kubelet updates status. kube-proxy adds Pod to Service endpoints.",
  },
];
