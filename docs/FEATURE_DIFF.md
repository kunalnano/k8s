# Feature Diff: AI Version vs Tonkotsu's Version

## Summary

| Metric | Tonkotsu (Current) | AI Version | Delta |
|--------|-------------------|------------|-------|
| Lines | 1814 | ~1300 | -514 |
| Views | 7 | 6 | -1 (Ingress) |
| AI Features | 0 | 3 | +3 |
| UX Enhancements | 8 | 2 | -6 |

## Features Tonkotsu Has That AI Version Doesn't

### 1. Ingress View (Key 5)
- Full animated flow: Internet → LB → Ingress Controller → Service → Pods
- 6-step visualization
- Key insight panel comparing Ingress vs kube-proxy

### 2. YAML Mapping Panel
- Interactive YAML-to-architecture mapping
- Click YAML field → highlights component in diagram

### 3. Quiz Difficulty Levels
- Beginner, Intermediate, Advanced questions
- Separate question pools per difficulty

### 4. Quiz History (localStorage)
- Persistent score tracking
- History of past quiz attempts

### 5. Error Boundary Component
- Class component with recovery options
- User-friendly error UI
- Collapsible stack trace

### 6. Comprehensive Accessibility
- ARIA labels throughout (role, aria-label, aria-selected)
- Focus indicators in CSS

### 7. Mobile Responsive Design
- Responsive grid breakpoints
- Text scaling for mobile
- SVG responsiveness

### 8. Enhanced Troubleshooting
- Search input with live filtering
- Category filter buttons with counts

## Features AI Version Has That Tonkotsu Doesn't

### 1. Gemini AI Integration
- API calls with exponential backoff retry
- Environment variable for API key

### 2. AI Component Explanations
- "AI Explain" button in component detail panel
- Returns beginner explanation + production insight + gotcha

### 3. Smart Troubleshooter
- Free-form text input for issues
- AI returns diagnostic commands and fixes

### 4. Node Grid Visualizer
- Visual grid of 8 nodes in Scheduler view
- Animated filter/score as steps advance
