import type { NetworkType, ServiceType, CniPlugin } from "./types";

export const networkTypes: NetworkType[] = [
  { name: "Node Network", description: "Physical/VM links", color: "#3b82f6" },
  { name: "Pod Network", description: "Overlay (CNI)", color: "#10b981" },
  { name: "Service Network", description: "Virtual IPs", color: "#a78bfa" },
  { name: "External", description: "Ingress traffic", color: "#f97316" },
];

export const serviceTypes: ServiceType[] = [
  {
    name: "ClusterIP",
    description: "Internal only. iptables rules.",
    details: "Backends, DBs",
  },
  {
    name: "NodePort",
    description: "Opens 30000-32767 on all nodes.",
    details: "Dev/test",
  },
  {
    name: "LoadBalancer",
    description: "Cloud LB (AWS NLB/ALB).",
    details: "Production",
  },
];

export const cniPlugins: CniPlugin[] = [
  {
    name: "Flannel",
    description: "VXLAN overlay. No NetworkPolicy.",
    features: ["Simple", "#f59e0b"],
  },
  {
    name: "Calico",
    description: "BGP routing. Full policies.",
    features: ["Enterprise", "#ef4444"],
  },
  {
    name: "Cilium",
    description: "L7 policies, observability.",
    features: ["eBPF", "#8b5cf6"],
  },
];

export interface KubeProxyMode {
  name: string;
  description: string;
  recommended: boolean;
}

export const kubeProxyModes: KubeProxyMode[] = [
  {
    name: "iptables (Legacy)",
    description: "O(n) rules. Falls over ~5000 services.",
    recommended: false,
  },
  {
    name: "IPVS (Recommended)",
    description: "O(1) hash. 100k+ services.",
    recommended: true,
  },
];
