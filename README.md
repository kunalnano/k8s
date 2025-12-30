# Kubernetes Internals — Interactive Deep Dive

An interactive visualization tool for learning Kubernetes architecture, internals, and troubleshooting. Built with React + Vite + Tailwind CSS.

![K8s Deep Dive](https://img.shields.io/badge/Kubernetes-Learning-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🎯 Features

### 7 Interactive Views

| View | Description |
|------|-------------|
| **Architecture** | Control plane & worker node components with click-to-explore details |
| **Flow** | Animated step-by-step: `kubectl apply` → Running Pod (8 stages) |
| **Scheduler** | Filter/Score funnel visualization with node selection |
| **Networking** | Service types, CNI plugins, kube-proxy modes, DNS resolution |
| **Ingress** | L7 routing flow from Internet → Ingress Controller → Pods |
| **Troubleshooting** | Decision trees for common failures with search/filter |
| **Quiz** | Test your knowledge with beginner/intermediate/advanced questions |

### Learning Enhancements

- 🎨 **Failure Mode Simulation** — See what happens when components fail
- 📝 **YAML Mapping** — Connect manifest fields to architecture concepts
- 🚦 **Traffic Simulation** — Visualize packet flow through the cluster
- ⌨️ **Keyboard Navigation** — Arrow keys, number keys, space, escape
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- ♿ **Accessible** — ARIA labels, focus indicators, screen reader support
- 💾 **Quiz History** — LocalStorage persistence for tracking progress

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/kunalnano/k8s.git
cd k8s

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-7` | Switch between views |
| `←` `→` | Navigate flow/ingress steps |
| `↑` `↓` | Navigate scheduler steps |
| `Space` | Play/pause animations |
| `Escape` | Clear selections, stop animations |

## 🏗️ Project Structure

```
k8s/
├── src/
│   ├── K8sDeepDive.jsx    # Main component (1800+ lines)
│   ├── ErrorBoundary.jsx  # Error handling with recovery
│   ├── App.jsx            # App wrapper
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind + focus styles
├── index.html             # Entry HTML with meta tags
├── tailwind.config.js     # Tailwind configuration
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

## 🎓 What You'll Learn

### Control Plane Components
- **API Server** — The only component that talks to etcd
- **etcd** — Distributed key-value store for cluster state
- **Scheduler** — Assigns pods to nodes using filter/score
- **Controller Manager** — Reconciliation loops for desired state

### Worker Node Components
- **Kubelet** — Node agent that manages pods via CRI
- **Container Runtime** — containerd/CRI-O for running containers
- **kube-proxy** — iptables/IPVS rules for Service routing

### Networking Concepts
- Service types: ClusterIP, NodePort, LoadBalancer, ExternalName
- CNI plugins: Calico, Cilium, Flannel, Weave
- kube-proxy modes: iptables vs IPVS
- Ingress controllers and L7 routing

## 🛠️ Tech Stack

- **React 18** — UI components with hooks
- **Vite 5** — Fast development and builds
- **Tailwind CSS** — Utility-first styling
- **SVG** — Custom visualizations and animations

## 📄 License

MIT License — feel free to use for learning and teaching!

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional troubleshooting scenarios
- More quiz questions
- New visualization views (Storage, RBAC, etc.)
- AI-powered explanations (see docs/AI_FEATURES_PATCH.jsx)
- Translations

---

Built with ❤️ for the Kubernetes community
