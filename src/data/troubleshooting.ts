import type { TroubleshootingScenario } from "./types";

export const troubleshootingScenarios: TroubleshootingScenario[] = [
  {
    id: "pending",
    title: "Pod Stuck in Pending",
    category: "scheduling",
    symptom: "kubectl get pods shows Pending for minutes",
    causes: [
      {
        cause: "Insufficient resources",
        check: 'kubectl describe pod - look for "Insufficient cpu/memory"',
        fix: "Scale cluster or reduce requests",
      },
      {
        cause: "Node taints blocking",
        check: 'kubectl describe pod - look for "node(s) had taints"',
        fix: "Add tolerations or untaint nodes",
      },
      {
        cause: "PVC not bound",
        check: "kubectl get pvc - check for Pending status",
        fix: "Ensure StorageClass exists and provisioner works",
      },
      {
        cause: "Node affinity mismatch",
        check: "kubectl describe pod - look for affinity/nodeSelector",
        fix: "Label nodes or adjust affinity rules",
      },
    ],
  },
  {
    id: "crashloop",
    title: "CrashLoopBackOff",
    category: "runtime",
    symptom: "Container starts then immediately dies",
    causes: [
      {
        cause: "Application crash",
        check: "kubectl logs <pod> --previous",
        fix: "Fix application code, check environment variables",
      },
      {
        cause: "Liveness probe too aggressive",
        check: "kubectl describe pod - check probe config",
        fix: "Increase initialDelaySeconds, timeoutSeconds",
      },
      {
        cause: "Missing config/secrets",
        check: "kubectl logs - look for config errors",
        fix: "Ensure ConfigMaps/Secrets exist and are mounted",
      },
      {
        cause: "OOMKilled",
        check: "kubectl describe pod - look for OOMKilled",
        fix: "Increase memory limits or fix memory leak",
      },
    ],
  },
  {
    id: "imagepull",
    title: "ImagePullBackOff",
    category: "runtime",
    symptom: "Pod stuck in ImagePullBackOff or ErrImagePull",
    causes: [
      {
        cause: "Image does not exist",
        check: 'kubectl describe pod - check Events for "not found" or 404',
        fix: "Verify image name and tag in registry",
      },
      {
        cause: "Missing image pull secret",
        check: 'kubectl describe pod - look for "unauthorized" or 401',
        fix: "Create imagePullSecrets and reference in pod spec",
      },
      {
        cause: "Private registry authentication failed",
        check: "kubectl get secret <secret> -o yaml | base64 -d",
        fix: "Recreate secret with correct credentials",
      },
      {
        cause: "Registry unreachable",
        check: "kubectl exec -it <pod> -- curl <registry-url>",
        fix: "Check network connectivity, firewall rules, DNS",
      },
      {
        cause: "Rate limit exceeded",
        check: 'kubectl describe pod - look for "429 Too Many Requests"',
        fix: "Use authenticated pulls or mirror to private registry",
      },
    ],
  },
  {
    id: "pvc",
    title: "Persistent Volume Issues",
    category: "storage",
    symptom: "PVC stuck in Pending or Pod cannot mount volume",
    causes: [
      {
        cause: "No StorageClass available",
        check: "kubectl get storageclass",
        fix: "Create or configure default StorageClass",
      },
      {
        cause: "Volume provisioner not running",
        check: "kubectl get pods -n kube-system | grep <provisioner>",
        fix: "Deploy or restart storage provisioner",
      },
      {
        cause: "Insufficient storage capacity",
        check: "kubectl describe pvc - check Events for capacity errors",
        fix: "Increase storage quota or use smaller PVC",
      },
      {
        cause: "Access mode mismatch",
        check: "kubectl describe pv - compare accessModes with PVC",
        fix: "Match ReadWriteOnce/ReadWriteMany between PV and PVC",
      },
      {
        cause: "Volume already mounted elsewhere",
        check: "kubectl get pods -A -o wide | grep <volume>",
        fix: "Delete pod holding volume or use ReadWriteMany",
      },
      {
        cause: "Node selector conflicts",
        check: "kubectl describe pv - check nodeAffinity",
        fix: "Ensure pod can schedule on nodes with PV affinity",
      },
    ],
  },
  {
    id: "quota",
    title: "Resource Quota Exceeded",
    category: "resources",
    symptom: 'Pod creation fails with "exceeded quota" error',
    causes: [
      {
        cause: "CPU quota exceeded",
        check: "kubectl describe resourcequota -n <namespace>",
        fix: "Reduce resource requests or increase quota limits",
      },
      {
        cause: "Memory quota exceeded",
        check: "kubectl get resourcequota -n <namespace> -o yaml",
        fix: "Scale down deployments or request quota increase",
      },
      {
        cause: "Pod count limit reached",
        check: "kubectl describe quota - check pods used vs hard limit",
        fix: "Delete unused pods or increase pod count quota",
      },
      {
        cause: "Storage quota exceeded",
        check: "kubectl describe resourcequota - check persistentvolumeclaims",
        fix: "Delete unused PVCs or request storage increase",
      },
      {
        cause: "Missing resource requests",
        check: "kubectl describe pod - verify requests/limits defined",
        fix: "Add resource requests to pod spec (required with quotas)",
      },
    ],
  },
  {
    id: "service",
    title: "Service Unreachable",
    category: "networking",
    symptom: "curl to ClusterIP times out",
    causes: [
      {
        cause: "No endpoints",
        check: "kubectl get endpoints <svc> - empty?",
        fix: "Check pod labels match service selector",
      },
      {
        cause: "Pods not ready",
        check: "kubectl get pods - all Running but not Ready?",
        fix: "Fix readiness probe failures",
      },
      {
        cause: "NetworkPolicy blocking",
        check: "kubectl get networkpolicy -A",
        fix: "Add ingress rule to allow traffic",
      },
      {
        cause: "kube-proxy not running",
        check: "kubectl get pods -n kube-system | grep proxy",
        fix: "Restart kube-proxy DaemonSet",
      },
    ],
  },
  {
    id: "dns",
    title: "DNS Resolution Failing",
    category: "networking",
    symptom: "nslookup kubernetes.default fails from pod",
    causes: [
      {
        cause: "CoreDNS down",
        check: "kubectl get pods -n kube-system -l k8s-app=kube-dns",
        fix: "Restart CoreDNS, check logs",
      },
      {
        cause: "resolv.conf wrong",
        check: "kubectl exec <pod> -- cat /etc/resolv.conf",
        fix: "Check kubelet DNS config, dnsPolicy",
      },
      {
        cause: "NetworkPolicy blocking UDP 53",
        check: "Check egress NetworkPolicy",
        fix: "Allow egress to kube-dns on UDP 53",
      },
      {
        cause: "CoreDNS ConfigMap corrupt",
        check: "kubectl get cm coredns -n kube-system -o yaml",
        fix: "Restore default Corefile",
      },
    ],
  },
];
