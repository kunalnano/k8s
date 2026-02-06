# Kubernetes Learning Platform - Astro Rebuild

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the K8s interactive learning site from a monolithic React SPA into a modern Astro static site with React islands, MDX content, dual deployment (GitHub Pages + Docker), and improved simulations.

**Architecture:** Astro 5.x static site generator with React islands for interactive components (architecture diagram, flow animations, quiz, troubleshooter). Educational content lives in MDX files managed by Astro Content Layer API. Static HTML pages for fast loads; JavaScript only hydrates where interactivity is needed. Tailwind v4 via Vite plugin for styling.

**Tech Stack:** Astro 5.x, React 18, TypeScript, Tailwind CSS v4, MDX, Docker + nginx, GitHub Actions

---

## Current State

- Single React SPA with one 2036-line monolithic component (K8sDeepDive.jsx)
- 7 views: Architecture, Flow, Scheduler, Networking, Ingress, Troubleshooting, Quiz
- Gemini AI integration for component explanations and troubleshooting
- Tailwind CSS v3, Vite, no TypeScript, no tests
- Deployed to GitHub Pages via custom workflow
- The Simulate button is a cosmetic red dot animation with no educational value

## Target State

- Astro static site with file-based routing (one page per view)
- React islands hydrated only where needed (diagrams, quiz, AI features)
- MDX content collections for educational text (easily editable, typed schemas)
- TypeScript throughout
- Dockerfile for container deployment alongside GitHub Pages
- Meaningful simulations that teach, not just animate

---

## Phase 1: Project Scaffolding and Infrastructure

### Task 1: Initialize Astro project alongside existing code

**Files:** Create astro.config.mjs, tsconfig.json, src/env.d.ts. Modify package.json. Remove vite.config.js, postcss.config.js, tailwind.config.js, eslint.config.js.

**Steps:**

1. Back up current source (move src to src-old, index.html to index-old.html, config files to .bak). Clean node_modules and lockfile.
2. Create new package.json with astro scripts (dev, build, preview, check).
3. Install deps: astro, @astrojs/react, @astrojs/mdx, react, react-dom. Dev: typescript, @types/react, @types/react-dom, tailwindcss, @tailwindcss/vite.
4. Create astro.config.mjs with env-based base path (DEPLOY_TARGET=container uses '/', otherwise '/k8s').
5. Create tsconfig.json extending astro/tsconfigs/strict with path aliases.
6. Create src/env.d.ts with PUBLIC_GEMINI_API_KEY type.
7. Verify: npm run build. Commit.

---

### Task 2: Create project structure and base layout

**Files:** Create src/styles/global.css, src/layouts/BaseLayout.astro, src/components/astro/Header.astro, Navigation.astro, Footer.astro, src/pages/index.astro.

**Steps:**

1. Create directory tree: src/{components/{astro,react/architecture},layouts,pages,styles,data,content/lessons}
2. Create global.css with Tailwind v4 @import and @theme tokens (k8s-blue, control-plane, worker-node colors).
3. Create BaseLayout.astro (HTML shell, head, meta, dark theme, header/footer/slot).
4. Create Header.astro, Navigation.astro (7 tabs with shortcut hints, active highlighting), Footer.astro.
5. Create placeholder index.astro. Verify dev server. Commit.

---

### Task 3: Extract data layer from monolith

**Files:** Create src/data/types.ts, components.ts, flow-steps.ts, scheduler-steps.ts, networking.ts, ingress-steps.ts, troubleshooting.ts, quiz-questions.ts.

**Steps:**

1. Create types.ts with interfaces: ComponentDetail, FlowStep, SchedulerStep, IngressStep, TroubleshootingScenario, QuizQuestion, YamlFieldMapping.
2. Extract data verbatim from src-old/K8sDeepDive.jsx into typed exports.
3. Verify: npx astro check. Commit.

---

## Phase 2: Interactive React Islands

### Task 4: Architecture diagram island (biggest task)

**Files:** Create src/components/react/architecture/{Arrow.tsx, ComponentNode.tsx, SvgCanvas.tsx, ComponentDetailPanel.tsx, FailureSimulator.tsx, TrafficSimulator.tsx}, src/components/react/ArchitectureDiagram.tsx. Modify src/pages/index.astro.

**Steps:**

1. **Arrow.tsx** - SVG arrow with marker, straight/curved paths, active/inactive states, packet animation.
2. **ComponentNode.tsx** - SVG box with conditional styling, label, status circle, failure indicator. Accessible.
3. **SvgCanvas.tsx** - viewBox 680x400, Control Plane (4 components), Worker Node (3 + pods), all arrows.
4. **ComponentDetailPanel.tsx** - Name, role, analogy, internals, flow, failure info, YAML mapping, AI Explain button.
5. **TrafficSimulator.tsx** - REDESIGN: Replace cosmetic red dot with meaningful 7-step simulation:
   - Step 1: kubectl to API Server ("REST request received")
   - Step 2: API Server to etcd ("Persist desired state")
   - Step 3: API Server to Scheduler ("Watch: unscheduled pod")
   - Step 4: Scheduler to API Server ("Bind pod to node")
   - Step 5: API Server to kubelet ("Watch: pod assigned to this node")
   - Step 6: kubelet to containerd ("CRI: pull image, create container")
   - Step 7: containerd to Pods ("Container running, pod ready")
   - Features: step counter, auto-play (2s/step), manual next/prev, arrow highlighting.
6. **FailureSimulator.tsx** - Red component, cascading impact panel, warning indicators.
7. **ArchitectureDiagram.tsx** - Compose all sub-components with state.
8. Wire into index.astro with client:load. Verify. Commit.

---

### Task 5: Flow animation island

**Files:** Create src/components/react/FlowDiagram.tsx, src/pages/flow.astro.

Port deployment lifecycle (old lines 1179-1306): SVG 8-step flow, play/pause, arrow keys, step tabs. Import from flow-steps.ts. Commit.

---

### Task 6: Scheduler funnel island

**Files:** Create src/components/react/SchedulerFunnel.tsx, src/pages/scheduler.astro.

Port scheduler view (old lines 1308-1382): 7 filter steps, 10x10 node grid, arrow nav, colored nodes. Import from scheduler-steps.ts. Commit.

---

### Task 7: Networking page (pure Astro, zero JS)

**Files:** Create src/pages/networking.astro.

Pure Astro, NO React island: 4 network cards, 3 service types, kube-proxy comparison, CNI plugins. Ships zero JavaScript. Commit.

---

### Task 8: Ingress flow island

**Files:** Create src/components/react/IngressFlow.tsx, src/pages/ingress.astro.

Port ingress view (old lines 1463-1595): SVG 6-step flow, play/pause, step navigation, L7 vs L4 insight box. Import from ingress-steps.ts. Commit.

---

### Task 9: Troubleshooting page with AI island

**Files:** Create src/components/react/SmartTroubleshooter.tsx, TroubleshootingSearch.tsx, src/pages/troubleshooting.astro.

1. SmartTroubleshooter: text input, Diagnose button, Gemini API, structured response, retry logic.
2. TroubleshootingSearch: search/filter, category dropdown, results grid, quick commands.
3. Astro page with both islands (client:load). Commit.

---

### Task 10: Quiz island

**Files:** Create src/components/react/Quiz.tsx, src/pages/quiz.astro.

Port quiz: difficulty selection, 4-option questions, 1.5s feedback, auto-advance, results screen, localStorage history. Import from quiz-questions.ts. Commit.

---

## Phase 3: Keyboard Navigation and Polish

### Task 11: Global keyboard navigation

**Files:** Create src/components/react/KeyboardNavigator.tsx, modify BaseLayout.astro.

Renderless component: number keys 1-7 navigate via window.location, Escape dispatches k8s:escape event. Uses BASE_URL for path construction. Add to BaseLayout as client:load. Commit.

---

## Phase 4: Deployment Infrastructure

### Task 12: Docker container setup

**Files:** Create Dockerfile, nginx/nginx.conf, .dockerignore.

1. .dockerignore: node_modules, dist, .git, .github, src-old
2. nginx.conf: listen 8080, gzip, static caching (1y), try_files, 404 handling.
3. Dockerfile: multi-stage (node:22-alpine build, nginx:alpine runtime).
4. Verify docker build and run on port 8080. Commit.

---

### Task 13: GitHub Actions for dual deployment

**Files:** Replace .github/workflows/deploy.yml. Delete jekyll-gh-pages.yml and static.yml.

Two parallel jobs: github-pages (withastro/action) + docker (GHCR push). Commit.

---

## Phase 5: Content and Cleanup

### Task 14: 404 page and SEO meta tags

Create 404.astro, add OpenGraph/Twitter meta to BaseLayout, create favicon.svg. Commit.

### Task 15: Clean up old files and update docs

Remove src-old, dist, .bak files. Create env example. Update README and AGENTS.md. Commit.

### Task 16: Final verification

Full build, preview, Docker test, feature checklist (all 7 pages, keyboard nav, mobile responsive). Final commit.

---

## Summary

| Phase          | Tasks | Delivers                                 |
| -------------- | ----- | ---------------------------------------- |
| 1: Scaffolding | 1-3   | Astro project, layouts, typed data layer |
| 2: Islands     | 4-10  | All 7 interactive views as React islands |
| 3: Navigation  | 11    | Global keyboard shortcuts across pages   |
| 4: Deployment  | 12-13 | Dockerfile + unified CI/CD pipeline      |
| 5: Cleanup     | 14-16 | 404 page, SEO, docs, verification        |

**Key improvements over current site:**

1. Performance: Static HTML pages, JS only where needed (networking = zero JS)
2. Architecture: 7 focused components instead of 1 monolith (2036 lines)
3. Type safety: TypeScript throughout
4. Simulate button: Replaced with meaningful 7-step request tracing with labels
5. Dual deployment: GitHub Pages + Docker container from single CI pipeline
6. Content authoring: MDX-ready structure for future lesson content
7. Modern stack: Astro 5 + Tailwind v4 + Content Layer API
