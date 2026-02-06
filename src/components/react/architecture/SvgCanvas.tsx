import Arrow from "./Arrow";
import ComponentNode from "./ComponentNode";
import { simSteps } from "./TrafficSimulator";

interface SvgCanvasProps {
  selectedComponent: string | null;
  failedComponent: string | null;
  failureMode: boolean;
  showScaleNotes: boolean;
  yamlHighlightedComponent: string | null;
  simStep: number;
  onComponentClick: (id: string) => void;
}

export default function SvgCanvas({
  selectedComponent,
  failedComponent,
  failureMode,
  showScaleNotes,
  yamlHighlightedComponent,
  simStep,
  onComponentClick,
}: SvgCanvasProps) {
  const handleClick = failureMode
    ? (id: string) => onComponentClick(id)
    : (id: string) => onComponentClick(id);

  // Determine which arrow is active based on sim step
  const activeArrow = simStep >= 0 ? simSteps[simStep]?.arrow : null;

  const isArrowActive = (arrowId: string) => activeArrow === arrowId;
  const showPacketOn = (arrowId: string) =>
    simStep >= 0 && activeArrow === arrowId;

  return (
    <div className="min-w-[640px] lg:min-w-0">
      <svg
        viewBox="0 0 680 400"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Kubernetes architecture diagram showing control plane and worker node components"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Control Plane Box */}
        <rect
          x={15}
          y={15}
          width={650}
          height={160}
          rx={10}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          strokeOpacity={0.35}
        />
        <text
          x={30}
          y={38}
          fill="#3b82f6"
          fontSize={12}
          fontWeight={700}
          letterSpacing="0.12em"
          fillOpacity={0.6}
        >
          CONTROL PLANE
        </text>

        {/* Control Plane Components */}
        <ComponentNode
          id="apiserver"
          label="API Server"
          x={40}
          y={60}
          type="control"
          onClick={handleClick}
          isActive={selectedComponent === "apiserver"}
          isFailed={failedComponent === "apiserver"}
          isYamlHighlight={yamlHighlightedComponent === "apiserver"}
          showScale={showScaleNotes}
        />
        <ComponentNode
          id="etcd"
          label="etcd"
          x={196}
          y={60}
          type="control"
          onClick={handleClick}
          isActive={selectedComponent === "etcd"}
          isFailed={failedComponent === "etcd"}
          isYamlHighlight={yamlHighlightedComponent === "etcd"}
          showScale={showScaleNotes}
        />
        <ComponentNode
          id="scheduler"
          label="Scheduler"
          x={352}
          y={60}
          type="control"
          onClick={handleClick}
          isActive={selectedComponent === "scheduler"}
          isFailed={failedComponent === "scheduler"}
          isYamlHighlight={yamlHighlightedComponent === "scheduler"}
          showScale={showScaleNotes}
        />
        <ComponentNode
          id="controller"
          label="Controllers"
          x={508}
          y={60}
          type="control"
          onClick={handleClick}
          isActive={selectedComponent === "controller"}
          isFailed={failedComponent === "controller"}
          isYamlHighlight={yamlHighlightedComponent === "controller"}
          showScale={showScaleNotes}
        />

        {/* Control Plane Arrows */}
        <Arrow
          id="api-etcd"
          x1={162}
          y1={85}
          x2={194}
          y2={85}
          isActive={isArrowActive("api-etcd")}
          showPacket={showPacketOn("api-etcd")}
        />
        <Arrow
          id="api-sched"
          x1={160}
          y1={72}
          x2={352}
          y2={72}
          curved
          curveOffset={50}
          isActive={isArrowActive("api-sched")}
          showPacket={showPacketOn("api-sched")}
        />
        <Arrow
          id="api-ctrl"
          x1={155}
          y1={62}
          x2={508}
          y2={62}
          curved
          curveOffset={55}
          isActive={isArrowActive("api-ctrl")}
          showPacket={showPacketOn("api-ctrl")}
        />

        {/* Worker Node Box */}
        <rect
          x={15}
          y={210}
          width={650}
          height={175}
          rx={10}
          fill="none"
          stroke="#34d399"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          strokeOpacity={0.35}
        />
        <text
          x={30}
          y={233}
          fill="#34d399"
          fontSize={12}
          fontWeight={700}
          letterSpacing="0.12em"
          fillOpacity={0.6}
        >
          WORKER NODE
        </text>

        {/* Worker Node Components */}
        <ComponentNode
          id="kubelet"
          label="kubelet"
          x={40}
          y={255}
          type="worker"
          onClick={handleClick}
          isActive={selectedComponent === "kubelet"}
          isFailed={failedComponent === "kubelet"}
          isYamlHighlight={yamlHighlightedComponent === "kubelet"}
          showScale={showScaleNotes}
        />
        <ComponentNode
          id="kubeproxy"
          label="kube-proxy"
          x={196}
          y={255}
          type="worker"
          onClick={handleClick}
          isActive={selectedComponent === "kubeproxy"}
          isFailed={failedComponent === "kubeproxy"}
          isYamlHighlight={yamlHighlightedComponent === "kubeproxy"}
          showScale={showScaleNotes}
        />
        <ComponentNode
          id="runtime"
          label="containerd"
          x={352}
          y={255}
          type="worker"
          onClick={handleClick}
          isActive={selectedComponent === "runtime"}
          isFailed={failedComponent === "runtime"}
          isYamlHighlight={yamlHighlightedComponent === "runtime"}
          showScale={showScaleNotes}
        />

        {/* Pods Box */}
        <rect
          x={508}
          y={248}
          width={145}
          height={75}
          rx={6}
          fill="#1e293b"
          stroke="#475569"
          strokeWidth={1}
        />
        <text x={580} y={268} textAnchor="middle" fill="#94a3b8" fontSize={9}>
          PODS
        </text>
        {/* Pod 1 — active */}
        <rect
          x={523}
          y={278}
          width={32}
          height={32}
          rx={4}
          fill="#0f172a"
          stroke="#34d399"
          strokeWidth={1}
        />
        {/* Pod 2 — empty slot */}
        <rect
          x={563}
          y={278}
          width={32}
          height={32}
          rx={4}
          fill="#0f172a"
          stroke="#34d399"
          strokeWidth={1}
          strokeDasharray="3 2"
          strokeOpacity={0.5}
        />
        <text
          x={579}
          y={298}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#34d399"
          fillOpacity={0.3}
          fontSize={16}
        >
          &#x25A1;
        </text>
        {/* Pod 3 — empty slot */}
        <rect
          x={603}
          y={278}
          width={32}
          height={32}
          rx={4}
          fill="#0f172a"
          stroke="#34d399"
          strokeWidth={1}
          strokeDasharray="3 2"
          strokeOpacity={0.5}
        />
        <text
          x={619}
          y={298}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#34d399"
          fillOpacity={0.3}
          fontSize={16}
        >
          &#x25A1;
        </text>

        {/* Cross-plane Arrows */}
        <Arrow
          id="api-kubelet"
          x1={100}
          y1={112}
          x2={100}
          y2={253}
          isActive={isArrowActive("api-kubelet")}
          showPacket={showPacketOn("api-kubelet")}
        />
        <Arrow
          id="api-proxy"
          customPath="M 145 112 L 256 253"
          isActive={isArrowActive("api-proxy")}
          showPacket={showPacketOn("api-proxy")}
        />
        <Arrow
          id="kubelet-runtime"
          customPath="M 160 300 L 188 320 L 352 320 L 352 300"
          isActive={isArrowActive("kubelet-runtime")}
          showPacket={showPacketOn("kubelet-runtime")}
        />
        <Arrow
          id="runtime-pods"
          x1={474}
          y1={285}
          x2={506}
          y2={285}
          isActive={isArrowActive("runtime-pods")}
          showPacket={showPacketOn("runtime-pods")}
        />
      </svg>
    </div>
  );
}
