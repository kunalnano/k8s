import type { SchedulerStep } from "./types";

export const schedulerSteps: SchedulerStep[] = [
  {
    label: "All Nodes",
    count: 100,
    description: "Starting pool of all nodes in cluster",
    detail: "Every registered node that is Ready",
  },
  {
    label: "NodeSelector",
    count: 45,
    description: "Filter: node.kubernetes.io/type=compute",
    detail: "Hard requirement - must have this label",
  },
  {
    label: "Resources",
    count: 32,
    description: "Filter: Need 2 CPU, 4Gi RAM available",
    detail: "Compares requests against allocatable - limits",
  },
  {
    label: "Taints",
    count: 28,
    description: "Filter: Tolerate only monitoring taints",
    detail: "NoSchedule taints block without matching tolerations",
  },
  {
    label: "Affinity",
    count: 12,
    description: "Filter: requiredDuringScheduling zone=us-east-1a",
    detail: "Required = hard constraint, Preferred = soft",
  },
  {
    label: "Anti-Affinity",
    count: 8,
    description: "Filter: Don't colocate with other DB pods",
    detail: "podAntiAffinity prevents same-node placement",
  },
  {
    label: "Scoring",
    count: 1,
    description: "Score remaining 8: LeastRequestedPriority wins node-7",
    detail: "Multiple scoring plugins weighted and summed",
  },
];
