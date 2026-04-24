# パフォーマンステスト設計書
# DevOffice AI Performance Test Design Document

## 📋 Document Information

- **Project**: DevOffice AI
- **Version**: 1.0.0
- **Date**: 2026-04-19
- **Author**: Development Team
- **Review Status**: Draft

---

## 1. テスト目的 (Test Objectives)

### 1.1 Primary Objectives
- Validate 60 FPS performance for Phaser.js canvas with 5+ agents
- Ensure page load time < 3 seconds on 3G connection
- Verify memory stability during extended sessions (30+ minutes)
- Confirm responsive UI across all breakpoints (320px - 1920px)

### 1.2 Secondary Objectives
- Measure WebSocket event processing latency
- Validate audio system performance without glitches
- Test bundle size optimization targets
- Verify haptic feedback timing on mobile devices

---

## 2. テスト環境 (Test Environment)

### 2.1 Hardware Specifications

| Device Type | CPU | RAM | GPU | Resolution |
|------------|-----|-----|-----|-----------|
| Desktop (High) | Intel i7-12700K | 16 GB | NVIDIA RTX 3060 | 1920×1080 |
| Desktop (Mid) | Intel i5-10400 | 8 GB | Integrated | 1920×1080 |
| Laptop | Intel i5-8250U | 8 GB | Integrated | 1366×768 |
| Tablet | Apple M1 | 8 GB | Integrated | 2732×2048 |
| Mobile (High) | Snapdragon 888 | 8 GB | Adreno 660 | 1080×2400 |
| Mobile (Low) | Snapdragon 660 | 4 GB | Adreno 512 | 720×1600 |

### 2.2 Browser Matrix

| Browser | Versions | OS |
|---------|----------|-----|
| Chrome | 120, 121, 122 | Windows, macOS, Android |
| Firefox | 121, 122 | Windows, macOS |
| Safari | 17.0, 17.1 | macOS, iOS |
| Edge | 120, 121 | Windows |

### 2.3 Network Conditions

```typescript
const networkProfiles = {
  'fast-3g': {
    downloadSpeed: 1.6,  // Mbps
    uploadSpeed: 0.75,   // Mbps
    latency: 150,        // ms
    packetLoss: 0        // %
  },
  '4g': {
    downloadSpeed: 4,
    uploadSpeed: 3,
    latency: 50,
    packetLoss: 0
  },
  'wifi': {
    downloadSpeed: 30,
    uploadSpeed: 15,
    latency: 10,
    packetLoss: 0
  }
};
```

---

## 3. パフォーマンス指標 (Performance Metrics)

### 3.1 Core Web Vitals

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| **FID** (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

### 3.2 Additional Metrics

```typescript
const performanceMetrics = {
  // Load Performance
  'TTFB': 600,           // Time to First Byte (ms)
  'FCP': 1200,           // First Contentful Paint (ms)
  'LCP': 2500,           // Largest Contentful Paint (ms)
  'TTI': 3000,           // Time to Interactive (ms)
  
  // Runtime Performance
  'canvas-fps': 60,      // Phaser canvas frame rate
  'animation-fps': 60,   // CSS/JS animations
  'memory-heap': 150,    // MB (max)
  'dom-nodes': 2000,     // Maximum DOM nodes
  
  // Interaction
  'click-response': 50,  // ms
  'input-latency': 100,  // ms
  'modal-open': 150,     // ms
  'view-switch': 200,    // ms
  
  // Network
  'bundle-size': 1500,   // KB (gzipped)
  'api-response': 500,   // ms
  'ws-latency': 50,      // ms
  
  // Audio
  'audio-latency': 20,   // ms
  'audio-glitch': 0      // count per minute
};
```

---

## 4. テストケース (Test Cases)

### 4.1 Initial Load Performance

#### TC-LOAD-001: Landing Page Load
```yaml
Test ID: TC-LOAD-001
Category: Load Performance
Priority: P0 (Critical)

Setup:
  - Clear browser cache
  - Set network: Fast 3G
  - Device: Desktop (Mid)

Steps:
  1. Navigate to https://devoffice.ai
  2. Wait for page load complete
  3. Measure metrics

Success Criteria:
  - FCP < 1.5s
  - LCP < 3.0s
  - TTI < 4.0s
  - Bundle size < 1.5 MB (gzipped)

Measurement Tools:
  - Lighthouse
  - WebPageTest
  - Chrome DevTools Performance
```

#### TC-LOAD-002: Manager View Initial Render
```yaml
Test ID: TC-LOAD-002
Category: Load Performance
Priority: P0

Setup:
  - Cached assets allowed
  - Set network: 4G
  - Device: Desktop (High)

Steps:
  1. Click "Get Started" from landing
  2. Wait for Manager View render
  3. Wait for Phaser canvas initialization
  4. Measure metrics

Success Criteria:
  - View switch < 300ms
  - Canvas ready < 1000ms
  - First agent visible < 1500ms
  - Total render < 2000ms

Measurement Tools:
  - Performance.mark/measure
  - Phaser.Game events
  - React DevTools Profiler
```

---

### 4.2 Canvas Rendering Performance

#### TC-CANVAS-001: 60 FPS with 5 Agents
```yaml
Test ID: TC-CANVAS-001
Category: Canvas Performance
Priority: P0

Setup:
  - Manager View loaded
  - 5 agents active
  - WebSocket connected

Steps:
  1. Trigger agent movement (all 5 agents)
  2. Record FPS for 60 seconds
  3. Monitor frame drops

Success Criteria:
  - Average FPS >= 58
  - Min FPS >= 45
  - Frame drops < 5% of frames
  - No stuttering visible to user

Measurement Tools:
  - Chrome DevTools Performance
  - Phaser.Game.loop.actualFps
  - stats.js library
```

#### TC-CANVAS-002: Memory Stability
```yaml
Test ID: TC-CANVAS-002
Category: Memory
Priority: P0

Setup:
  - Manager View loaded
  - WebSocket events streaming

Steps:
  1. Run for 30 minutes
  2. Generate 100+ events
  3. Open/close approval modal 10 times
  4. Switch views 20 times
  5. Monitor heap size

Success Criteria:
  - Max heap < 200 MB
  - No memory leaks (heap stable after GC)
  - Heap growth < 1 MB/minute

Measurement Tools:
  - Chrome DevTools Memory Profiler
  - performance.memory API
  - Heap snapshot comparison
```

#### TC-CANVAS-003: Agent Animation Performance
```yaml
Test ID: TC-CANVAS-003
Category: Animation
Priority: P1

Setup:
  - Manager View loaded
  - Test Panel visible

Steps:
  1. Trigger approval animation for all agent types
  2. Trigger reject animation for all agent types
  3. Measure animation smoothness

Success Criteria:
  - All animations run at 60 FPS
  - No frame drops during animations
  - Animation timing accurate (±50ms)
  - Tweens complete without lag

Measurement Tools:
  - Phaser.Tweens events
  - Performance timeline
```

---

### 4.3 WebSocket Performance

#### TC-WS-001: Event Processing Latency
```yaml
Test ID: TC-WS-001
Category: Real-time
Priority: P0

Setup:
  - Manager/Dev view loaded
  - WebSocket Mock connected

Steps:
  1. Generate 100 events at 3s intervals
  2. Measure time from event emission to UI update
  3. Monitor state update latency

Success Criteria:
  - Event processing < 50ms
  - UI update < 100ms total
  - No event queue backlog
  - Smooth UI updates (no blocking)

Measurement Tools:
  - Performance.mark at event points
  - React DevTools Profiler
  - Console timestamps
```

#### TC-WS-002: High Frequency Events
```yaml
Test ID: TC-WS-002
Category: Stress Test
Priority: P1

Setup:
  - Dev View loaded
  - WebSocket Mock configured for burst mode

Steps:
  1. Generate 50 events in 5 seconds (10 events/sec)
  2. Monitor UI responsiveness
  3. Check for dropped events

Success Criteria:
  - All events processed
  - UI remains responsive
  - No frame drops in canvas
  - Event timeline updates smoothly

Measurement Tools:
  - Custom event counter
  - FPS monitor
  - React rendering time
```

---

### 4.4 Audio System Performance

#### TC-AUDIO-001: Sound Generation Latency
```yaml
Test ID: TC-AUDIO-001
Category: Audio
Priority: P1

Setup:
  - Test Panel open
  - Audio enabled

Steps:
  1. Click "Approval Ping" 20 times rapidly
  2. Click "Success Chord" 20 times
  3. Measure latency from click to sound

Success Criteria:
  - Click-to-sound < 50ms
  - No audio glitches
  - Sounds overlap cleanly
  - No distortion at any volume level

Measurement Tools:
  - AudioContext.currentTime
  - Performance.now()
  - Audio analyzer
```

#### TC-AUDIO-002: Audio Ducking
```yaml
Test ID: TC-AUDIO-002
Category: Audio
Priority: P2

Setup:
  - Session Replay loaded
  - Background audio playing (if implemented)

Steps:
  1. Play AI Voice Summary
  2. Measure background volume reduction
  3. Verify restoration after playback

Success Criteria:
  - Ducking fade-out < 300ms
  - Target level reached (0.1)
  - Restoration fade-in < 500ms
  - No audio pops/clicks

Measurement Tools:
  - AudioContext.getOutputTimestamp
  - GainNode.gain.value tracking
```

---

### 4.5 Interaction Performance

#### TC-INT-001: Approval Modal Open Time
```yaml
Test ID: TC-INT-001
Category: Interaction
Priority: P0

Setup:
  - Manager View loaded
  - Approval event ready

Steps:
  1. Trigger approval event
  2. Measure modal open time
  3. Measure animation completion
  4. Test 50 times for consistency

Success Criteria:
  - Modal visible < 100ms
  - Animation complete < 300ms
  - Hologram rotation smooth (60 FPS)
  - Countdown timer accurate

Measurement Tools:
  - Performance.mark
  - requestAnimationFrame timing
  - React component mount time
```

#### TC-INT-002: View Switching
```yaml
Test ID: TC-INT-002
Category: Navigation
Priority: P0

Setup:
  - Manager View loaded

Steps:
  1. Switch to Dev View (measure)
  2. Switch to Session Replay (measure)
  3. Switch back to Manager View (measure)
  4. Repeat 10 times

Success Criteria:
  - Each switch < 200ms
  - No layout shift (CLS = 0)
  - Canvas reinitializes correctly
  - State preserved across switches

Measurement Tools:
  - Performance.mark
  - Layout Shift API
  - React component lifecycle hooks
```

---

### 4.6 Responsive Performance

#### TC-RESP-001: Mobile Breakpoint
```yaml
Test ID: TC-RESP-001
Category: Responsive
Priority: P0

Setup:
  - Viewport: 375×667 (iPhone SE)
  - Network: Fast 3G
  - Touch events enabled

Steps:
  1. Load all views (Landing, Manager, Dev, Replay)
  2. Test touch interactions (scroll, tap, swipe)
  3. Monitor canvas scaling
  4. Verify hidden elements

Success Criteria:
  - Canvas scales to 70% correctly
  - Touch targets >= 44×44px
  - No horizontal scroll
  - All interactions responsive < 100ms
  - Layout stable (CLS < 0.1)

Measurement Tools:
  - Chrome DevTools Device Mode
  - Touch event inspector
  - Layout analysis
```

#### TC-RESP-002: Tablet Landscape
```yaml
Test ID: TC-RESP-002
Category: Responsive
Priority: P1

Setup:
  - Viewport: 1024×768 (iPad)
  - Orientation: Landscape

Steps:
  1. Load Manager View
  2. Verify layout (2-column expected)
  3. Test canvas scaling (85%)
  4. Verify sidebar width (200px)

Success Criteria:
  - Correct layout applied
  - Canvas readable and interactive
  - Sidebar visible with full content
  - No content overflow

Measurement Tools:
  - Viewport size detection
  - CSS computed styles
  - Visual regression testing
```

---

### 4.7 Bundle Size & Optimization

#### TC-BUNDLE-001: Main Bundle Size
```yaml
Test ID: TC-BUNDLE-001
Category: Optimization
Priority: P0

Setup:
  - Production build
  - Gzip compression enabled

Steps:
  1. Run `pnpm build`
  2. Analyze bundle output
  3. Measure each chunk

Success Criteria:
  - Total bundle (gzipped) < 1.5 MB
  - Main chunk < 500 KB
  - Vendor chunks < 200 KB each
  - Code splitting implemented correctly

Measurement Tools:
  - vite-bundle-analyzer
  - webpack-bundle-analyzer
  - File system du command
```

#### TC-BUNDLE-002: Tree Shaking
```yaml
Test ID: TC-BUNDLE-002
Category: Optimization
Priority: P1

Setup:
  - Production build
  - Analyze bundle composition

Steps:
  1. Check for unused exports
  2. Verify dead code elimination
  3. Check for duplicate dependencies

Success Criteria:
  - No unused UI components in bundle
  - Radix UI tree-shaken correctly
  - No duplicate React copies
  - lodash/moment not fully imported

Measurement Tools:
  - Bundle analyzer
  - source-map-explorer
```

---

## 5. 測定ツール (Measurement Tools)

### 5.1 Browser Tools

```typescript
const browserTools = {
  'Chrome DevTools': {
    Performance: 'FPS, memory, network waterfall',
    Lighthouse: 'Core Web Vitals, best practices',
    Coverage: 'Unused CSS/JS detection',
    Memory: 'Heap snapshots, allocation timeline'
  },
  
  'Firefox DevTools': {
    Performance: 'Frame rate, waterfall',
    'Network Monitor': 'Request timing, sizes'
  },
  
  'Safari Web Inspector': {
    Timelines: 'Rendering, JavaScript',
    'Network Tab': 'Resource loading'
  }
};
```

### 5.2 Automated Tools

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --config=.lighthouserc.json

# WebPageTest API
curl "https://www.webpagetest.org/runtest.php?url=https://devoffice.ai&k=API_KEY"

# Bundle Analyzer
pnpm build -- --analyze

# Performance Budget
{
  "budgets": [{
    "resourceSizes": [{
      "resourceType": "script",
      "budget": 500
    }],
    "resourceCounts": [{
      "resourceType": "third-party",
      "budget": 10
    }]
  }]
}
```

### 5.3 Custom Monitoring

```typescript
// Performance marks
performance.mark('canvas-init-start');
// ... initialization code
performance.mark('canvas-init-end');
performance.measure('canvas-init', 'canvas-init-start', 'canvas-init-end');

// FPS Counter
class FPSMonitor {
  private lastTime = performance.now();
  private frames = 0;
  private fps = 60;
  
  tick() {
    this.frames++;
    const now = performance.now();
    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
      this.lastTime = now;
      this.frames = 0;
    }
    return this.fps;
  }
}

// Memory Monitor
const getMemoryUsage = () => {
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize / 1048576, // MB
      total: performance.memory.totalJSHeapSize / 1048576,
      limit: performance.memory.jsHeapSizeLimit / 1048576
    };
  }
  return null;
};
```

---

## 6. 合格基準 (Pass/Fail Criteria)

### 6.1 Critical (Must Pass)

| Test Case | Metric | Target | Action if Fail |
|-----------|--------|--------|----------------|
| TC-LOAD-001 | LCP | < 3.0s | Optimize images, code-split |
| TC-CANVAS-001 | FPS | >= 58 | Reduce particles, optimize loops |
| TC-CANVAS-002 | Memory | < 200 MB | Fix leaks, clear unused objects |
| TC-WS-001 | Latency | < 100ms | Optimize event handlers |
| TC-INT-001 | Modal open | < 300ms | Reduce animation complexity |
| TC-BUNDLE-001 | Size | < 1.5 MB | Remove unused deps, tree-shake |

### 6.2 Important (Should Pass)

| Test Case | Metric | Target | Action if Fail |
|-----------|--------|--------|----------------|
| TC-AUDIO-001 | Audio latency | < 50ms | Adjust AudioContext buffer |
| TC-INT-002 | View switch | < 200ms | Lazy load components |
| TC-RESP-001 | Mobile CLS | < 0.1 | Fix layout shifts |
| TC-BUNDLE-002 | Tree shaking | 100% | Configure Vite correctly |

---

## 7. レポート形式 (Report Format)

### 7.1 Test Execution Report Template

```markdown
# Performance Test Report - YYYY-MM-DD

## Executive Summary
- Total Tests: XX
- Passed: XX (XX%)
- Failed: XX (XX%)
- Critical Issues: X

## Test Results

### Critical Tests
| Test ID | Status | Metric | Result | Target | Delta |
|---------|--------|--------|--------|--------|-------|
| TC-LOAD-001 | ✅ PASS | LCP | 2.3s | < 3.0s | -0.7s |
| TC-CANVAS-001 | ❌ FAIL | FPS | 52 | >= 58 | -6 |

### Performance Graphs
[Chart: FPS over time]
[Chart: Memory usage over time]
[Chart: Network waterfall]

### Issues Found
1. **Critical**: Canvas FPS drops below 58 when all 5 agents moving
   - Severity: High
   - Recommendation: Optimize path trace rendering

2. **Important**: Bundle size 1.6 MB (target: 1.5 MB)
   - Severity: Medium
   - Recommendation: Remove unused Radix UI components

### Recommendations
1. Implement virtual scrolling for event list
2. Lazy load Recharts library
3. Optimize Phaser sprite rendering

## Appendix
- Raw data: [link to CSV]
- Screenshots: [folder]
- Video recordings: [folder]
```

---

## 8. 実行スケジュール (Execution Schedule)

```typescript
const testSchedule = {
  'Development': {
    frequency: 'Daily',
    scope: 'Smoke tests (P0)',
    automated: true
  },
  
  'Pre-Release': {
    frequency: 'Per RC build',
    scope: 'Full suite (P0 + P1)',
    automated: true,
    manual: 'Exploratory'
  },
  
  'Production': {
    frequency: 'Weekly',
    scope: 'Monitoring + synthetic tests',
    automated: true
  }
};
```

---

この設計書に基づいて、DevOffice AI のパフォーマンステストを実施してください。
