import type { IngressStep } from "./types";

export const ingressSteps: IngressStep[] = [
  {
    id: 0,
    label: "External Request Arrives",
    description:
      "HTTP request hits cloud load balancer or node IP on port 80/443",
  },
  {
    id: 1,
    label: "Ingress Controller Receives",
    description:
      "NGINX/Traefik/etc pod receives traffic, reads Ingress rules from API server",
  },
  {
    id: 2,
    label: "Host/Path Matching",
    description:
      "Controller matches request Host header and URL path to Ingress rules",
  },
  {
    id: 3,
    label: "Service Resolution",
    description:
      "Ingress routes to backend Service. Controller looks up Endpoints.",
  },
  {
    id: 4,
    label: "Pod Selection",
    description:
      "Controller selects a ready Pod IP from Endpoints (load balancing)",
  },
  {
    id: 5,
    label: "Direct Pod Connection",
    description:
      "Traffic proxied directly to Pod IP:Port, bypassing kube-proxy",
  },
];
