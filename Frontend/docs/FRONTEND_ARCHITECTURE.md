# DevOffice AI - Frontend Architecture Document

## 📋 Thông tin Tổng quan

### Project Information
- **Project Name**: DevOffice AI
- **Version**: 1.0.0
- **Platform**: Web Application (React + TypeScript)
- **Design Concept**: "Enterprise Dark SaaS meets 2D Pixel Art"
- **Target Users**: CEOs, Managers, Developers

### Tech Stack
```json
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS v4.1.12",
  "canvas": "Phaser.js 4.0.0",
  "charts": "Recharts 2.15.2",
  "ui_library": "Radix UI (shadcn/ui)",
  "state": "React useState/useEffect + Custom State Manager",
  "realtime": "WebSocket Mock (ready for Socket.io)",
  "audio": "Web Audio API",
  "build": "Vite 6.3.5",
  "package_manager": "pnpm"
}
```

---

## 🏗️ Architecture Overview

### 1. Application Structure

```
src/
├── app/
│   ├── App.tsx                          # Main application entry
│   ├── components/
│   │   ├── LandingPage.tsx              # Marketing landing page
│   │   ├── ManagerView.tsx              # CEO/Manager dashboard
│   │   ├── DevView.tsx                  # Developer event trace view
│   │   ├── SessionReplay.tsx            # Replay & analytics view
│   │   ├── ApprovalModal.tsx            # Human-in-the-loop approval UI
│   │   ├── OnboardingTutorial.tsx       # 3-step CEO onboarding
│   │   ├── TestPanel.tsx                # Testing utilities panel
│   │   ├── VirtualOfficeCanvas.tsx      # Original Phaser canvas
│   │   ├── VirtualOfficeCanvasV2.tsx    # Enhanced canvas with movement
│   │   ├── AIVoiceSummary.tsx           # Audio playback component
│   │   ├── BubbleMiniCard.tsx           # Tooltip detail card
│   │   ├── ROIChart.tsx                 # AI vs Human cost chart
│   │   ├── BudgetForecast.tsx           # Weekly budget forecast
│   │   └── ui/                          # Radix UI components (40+ files)
│   └── utils/
│       ├── pathfinding.ts               # A* algorithm for agent movement
│       ├── agentAnimations.ts           # Agent animation library
│       ├── zoneEffects.ts               # Zone visual effects
│       ├── audioSystem.ts               # Web Audio synthesis
│       ├── hapticFeedback.ts            # Mobile haptic API
│       ├── websocketMock.ts             # Real-time event simulator
│       ├── stateManagement.ts           # Session & agent state
│       └── qrGenerator.ts               # QR code for PDF export
├── styles/
│   ├── index.css                        # Main CSS entry
│   ├── fonts.css                        # Font imports
│   ├── theme.css                        # Design tokens & colors
│   └── responsive.css                   # Breakpoint utilities
└── imports/                             # Design specification documents
```

---

## 🎨 Design System

### Color Palette (Dark Theme)

```typescript
const colors = {
  // Base
  background: '#0C0D12',      // Near-black with blue undertone
  surface: '#15171F',         // App panels, sidebars
  card: '#1D202B',            // Cards, rows
  
  // Primary
  primary: '#5E55EA',         // Violet - brand color
  'primary-light': '#7D75F7', // Hover states
  
  // Semantic
  emerald: '#10B06B',         // Success, idle, approved
  amber: '#EB9619',           // Waiting, pending, cost
  crimson: '#DA3950',         // Error, high-risk, rejection
  sapphire: '#267ADE',        // Informational, Researcher
  gold: '#E5BA2E',            // Analyst agent
  
  // Agent Colors
  'forest-green': '#228B22',  // Writer
  charcoal: '#36454F',        // Developer
  
  // Text
  'text-primary': '#EAEDEC',
  'text-secondary': '#7D8BA3',
  'text-muted': '#556177',
  
  // Borders
  'border-subtle': '#2B303F',
  'border-inner': '#1F232F',
  
  // Canvas
  'canvas-bg': '#080C11'
};
```

### Typography

```typescript
const typography = {
  fontFamily: 'Inter, sans-serif',
  monoFont: 'JetBrains Mono, monospace',
  
  sizes: {
    xs: '9px',
    sm: '10px',
    base: '12px',
    lg: '14px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '28px',
    hero: '64px'
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em'
  }
};
```

### Spacing System (4px base unit)

```typescript
const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px'
};
```

### Border Radius

```typescript
const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px'
};
```

---

## 📱 Screen Layouts

### 1. Landing Page (1440×900px)

**Structure**:
```
┌─────────────────────────────────────┐
│ Navbar (66px)                       │
├─────────────────────────────────────┤
│                                     │
│         Hero Section                │
│      (Badge + Title + CTA)          │
│                                     │
├─────────────────────────────────────┤
│  Feature Cards (Grid 1×4)           │
├─────────────────────────────────────┤
│  Stats Row (Grid 1×4)               │
└─────────────────────────────────────┘
```

**Components**:
- Ambient glow orbs (gradient backgrounds)
- Geometric icon system (no emoji)
- Responsive grid (1→2→4 columns)

---

### 2. Manager View (1440×900px)

**Structure**:
```
┌──────────┬─────────────────────┬──────────┐
│          │  Top Bar (56px)     │          │
├──────────┼─────────────────────┼──────────┤
│  Agent   │                     │ Activity │
│  List    │  Virtual Office     │  Feed    │
│  220px   │  Canvas (1280×720)  │  382px   │
│          │                     │          │
│  Session │                     │  Cost    │
│  Stats   │                     │  Tracker │
└──────────┴─────────────────────┴──────────┘
```

**Features**:
- Live WebSocket events
- Real-time cost/duration updates
- Smart bubbles (Vietnamese business language)
- Agent state indicators

---

### 3. Dev View (1440×900px)

**Structure**:
```
┌──────────┬─────────────────────┬──────────┐
│          │  Filter Bar (52px)  │          │
├──────────┼─────────────────────┼──────────┤
│  Agent   │                     │  Event   │
│  Filter  │  Event Trace        │  Detail  │
│  220px   │  Timeline           │  440px   │
│          │                     │          │
│          │  (10 event rows)    │  Payload │
│          │                     │  Tokens  │
└──────────┴─────────────────────┴──────────┘
```

**Features**:
- Raw technical logs (monospace)
- JSON payload viewer
- Token usage tracking
- Call stack display

---

### 4. Session Replay (1440×900px)

**Structure**:
```
┌─────────────────────────┬─────────────────┐
│ Session Selector (48px) │                 │
├─────────────────────────┤  Right Panel    │
│                         │  640px          │
│  Canvas (60% opacity)   │                 │
│  800×720                │  • AI Voice     │
│                         │  • Stats Grid   │
│  Playback Controls      │  • Charts       │
│  Timeline Scrubber      │  • Insights     │
│                         │  • Export PDF   │
└─────────────────────────┴─────────────────┘
```

**Features**:
- Ghost trail effects
- Playback speed (1×, 2×, 5×, 10×)
- AI Voice Summary with audio
- ROI & Budget charts
- PDF export with QR code

---

## 🎮 Virtual Office Canvas (Phaser.js)

### Canvas Specifications

```typescript
const canvasConfig = {
  size: { width: 1280, height: 720 },
  gridSize: 60, // 60px per cell
  gridDimensions: { cols: 21, rows: 12 },
  backgroundColor: '#080C11',
  fps: 60,
  physics: false // We use custom A* pathfinding
};
```

### Zone Layout (Grid Coordinates)

```typescript
const zones = {
  lounge: {
    position: { x: 64, y: 64 },
    size: { width: 256, height: 210 },
    slots: [
      { x: 120, y: 140 },
      { x: 162, y: 140 },
      { x: 204, y: 140 }
    ],
    color: '#267ADE'
  },
  
  dataVault: {
    position: { x: 1024, y: 64 },
    size: { width: 260, height: 210 },
    targetSlot: { x: 1154, y: 180 },
    color: '#267ADE'
  },
  
  workstations: {
    position: { x: 350, y: 260 },
    size: { width: 500, height: 280 },
    desks: {
      RS: { x: 400, y: 320 },
      AN: { x: 600, y: 320 },
      WR: { x: 800, y: 320 },
      RV: { x: 400, y: 480 },
      DV: { x: 600, y: 480 }
    },
    color: '#7D8BA3'
  },
  
  meetingRoom: {
    position: { x: 960, y: 384 },
    size: { width: 348, height: 306 },
    tableCenter: { x: 1134, y: 537 },
    color: '#5E55EA'
  },
  
  approvalGate: {
    position: { x: 617, y: 185 },
    size: { width: 46, height: 350 },
    podium: { x: 640, y: 280 },
    color: '#EB9619'
  }
};
```

### Agent Specifications

```typescript
interface AgentSpec {
  id: string;
  name: string;
  color: string;
  spriteSize: { width: 40, height: 40 };
  glowRingSize: { width: 52, height: 52 };
  accessories: string[];
  animations: {
    idle: AnimationConfig;
    walk: AnimationConfig;
    action: AnimationConfig;
    approval: AnimationConfig;
    reject: AnimationConfig;
  };
}

const agents: AgentSpec[] = [
  {
    id: 'RS',
    name: 'Researcher',
    color: '#267ADE',
    accessories: ['glasses', 'tablet'],
    animations: {
      approval: 'pushGlasses_raiseClipboard',
      reject: 'bowHead_greyCloud'
    }
  },
  {
    id: 'AN',
    name: 'Analyst',
    color: '#E5BA2E',
    accessories: ['visor', 'hologramCharts'],
    animations: {
      approval: 'juggleCharts_rotate',
      reject: 'chartsShatter'
    }
  },
  {
    id: 'WR',
    name: 'Writer',
    color: '#228B22',
    accessories: ['headphones', 'scarf'],
    animations: {
      approval: 'removeHeadphones_thinkPose',
      reject: 'sigh_crumplePaper'
    }
  },
  {
    id: 'RV',
    name: 'Reviewer',
    color: '#5E55EA',
    accessories: ['vest', 'stamp'],
    animations: {
      approval: 'raiseStamp_glow',
      reject: 'shrug_putAwayStamp'
    }
  },
  {
    id: 'DV',
    name: 'Developer',
    color: '#36454F',
    accessories: ['hoodie', 'coffeeCup'],
    animations: {
      approval: 'typeMatrix_sipCoffee',
      reject: 'spillCoffee_coverHead'
    }
  }
];
```

### Agent Movement System

```typescript
interface MovementConfig {
  algorithm: 'A*';
  speed: {
    walk: 180,      // pixels per second
    run: 360        // pixels per second (for errors)
  };
  pathfinding: {
    gridSize: 60,
    diagonals: false,
    smoothing: true
  };
  animations: {
    flipDelay: 100,  // ms delay when changing direction
    trailCount: 3,   // number of ghost trail ellipses
    trailFadeTime: 400 // ms for trail to fade
  };
}
```

---

## 🔊 Audio System Specifications

### Web Audio API Configuration

```typescript
interface AudioSystemConfig {
  context: AudioContext;
  masterGain: {
    default: 0.3,
    range: [0, 1]
  };
  sounds: {
    approvalPing: {
      type: 'oscillator';
      waveform: 'sine';
      frequency: { start: 800, end: 1200 };
      duration: 200; // ms
      envelope: 'exponential';
    };
    successChord: {
      type: 'oscillator';
      notes: [261.63, 329.63, 392.00]; // C4, E4, G4
      waveform: 'sine';
      duration: 400;
      stagger: 100; // ms between notes
    };
    errorBuzz: {
      type: 'oscillator';
      waveform: 'sawtooth';
      frequency: 100;
      duration: 150;
    };
    footstep: {
      type: 'noise';
      filter: 'lowpass';
      cutoff: 200;
      duration: 50;
    };
  };
  ducking: {
    fadeTime: 300, // ms to fade out
    targetLevel: 0.1,
    restoreTime: 500 // ms to fade in
  };
}
```

---

## 📊 Performance Metrics

### Target Performance

```typescript
const performanceTargets = {
  // Initial Load
  FCP: 1200,           // First Contentful Paint (ms)
  LCP: 2500,           // Largest Contentful Paint (ms)
  TTI: 3000,           // Time to Interactive (ms)
  
  // Runtime
  canvasFPS: 60,       // Phaser canvas frame rate
  maxMemory: 150,      // MB for canvas + app
  
  // Network
  bundleSize: {
    main: 500,         // KB (gzipped)
    phaser: 800,       // KB (gzipped)
    total: 1500        // KB (gzipped)
  },
  
  // Interactions
  clickResponse: 50,   // ms
  modalOpen: 150,      // ms animation
  viewSwitch: 200,     // ms transition
  
  // WebSocket
  eventProcessing: 10, // ms per event
  stateUpdate: 5,      // ms to update React state
  
  // Responsive
  mobileBreakpoint: 640,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1440
};
```

### Bundle Analysis

```typescript
const bundleBreakdown = {
  'react-dom': '~130 KB',
  'phaser': '~750 KB',
  'recharts': '~200 KB',
  'radix-ui': '~150 KB',
  'app-code': '~250 KB',
  'tailwind-css': '~50 KB',
  total: '~1530 KB (gzipped)'
};
```

---

## 🔄 State Management

### Session State Schema

```typescript
interface SessionState {
  id: string;                    // sess_xxxxx
  name: string;                  // "Marketing Q2 Analysis"
  startTime: Date;
  duration: number;              // seconds
  cost: number;                  // USD
  events: AgentEvent[];
  agents: Map<string, AgentState>;
}

interface AgentState {
  id: string;                    // RS, AN, WR, RV, DV
  name: string;
  position: { x: number; y: number };
  targetZone: string;
  state: 'idle' | 'thinking' | 'tool_call' | 'waiting' | 'error';
  isMoving: boolean;
  color: string;
}

interface AgentEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'state_change' | 'tool_call' | 'message' | 'error' | 'approval_required';
  state?: string;
  tool?: string;
  message?: string;
  payload?: any;
  cost?: number;
  status: 'pending' | 'completed' | 'error' | 'approval_required';
}
```

### State Flow

```
User Action → Event Handler → State Manager → WebSocket Mock
     ↓              ↓               ↓              ↓
  UI Update ← React State ← Event Listener ← Event Queue
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)

```typescript
const testCoverage = {
  components: {
    'LandingPage': ['rendering', 'CTA clicks', 'responsive'],
    'ManagerView': ['agent selection', 'view toggle', 'cost updates'],
    'ApprovalModal': ['countdown', 'approve/reject', 'audio/haptic'],
    'OnboardingTutorial': ['steps navigation', 'localStorage']
  },
  
  utils: {
    'pathfinding': ['A* algorithm', 'obstacle detection'],
    'audioSystem': ['sound generation', 'ducking'],
    'stateManagement': ['session tracking', 'event processing'],
    'websocketMock': ['event generation', 'approval flow']
  }
};
```

### Performance Tests

```typescript
const performanceTests = {
  'canvas-rendering': {
    metric: 'FPS',
    target: 60,
    duration: 30000, // 30 seconds
    agents: 5,
    events: 100
  },
  
  'memory-leak': {
    metric: 'Heap Size',
    target: '<150 MB',
    duration: 300000, // 5 minutes
    operations: ['view switching', 'event processing', 'modal open/close']
  },
  
  'bundle-size': {
    metric: 'File Size',
    targets: {
      main: '<500 KB',
      chunks: '<200 KB each',
      total: '<1.5 MB'
    }
  },
  
  'interaction': {
    metric: 'Response Time',
    targets: {
      click: '<50 ms',
      modal: '<150 ms',
      viewSwitch: '<200 ms'
    }
  }
};
```

---

## 📱 Responsive Breakpoints

```typescript
const breakpoints = {
  mobile: {
    max: 640,
    layout: 'single-column',
    canvasScale: 0.7,
    features: ['touch-optimized', 'reduced-motion'],
    hidden: ['secondary-nav', 'stats-sidebar']
  },
  
  tablet: {
    min: 641,
    max: 1024,
    layout: 'two-column',
    canvasScale: 0.85,
    features: ['hybrid-input'],
    sidebarWidth: 200
  },
  
  desktop: {
    min: 1024,
    layout: 'three-column',
    canvasScale: 1.0,
    features: ['full-features'],
    sidebarWidth: 220,
    activityPanelWidth: 382
  }
};
```

---

## 🔐 Security Considerations

```typescript
const securityMeasures = {
  'XSS-prevention': 'React auto-escaping + DOMPurify for user content',
  'CORS': 'Whitelist origins in production',
  'API-keys': 'Environment variables only',
  'localStorage': 'Only non-sensitive data (onboarding flag)',
  'CSP': 'Content-Security-Policy headers',
  'HTTPS': 'Required in production',
  'input-validation': 'Sanitize all user inputs'
};
```

---

## 📦 Deployment Configuration

```typescript
const deployConfig = {
  build: {
    command: 'pnpm build',
    output: 'dist/',
    optimization: {
      minify: true,
      treeshake: true,
      codeSplit: true
    }
  },
  
  env: {
    production: {
      VITE_API_URL: 'https://api.devoffice.ai',
      VITE_WS_URL: 'wss://ws.devoffice.ai'
    },
    staging: {
      VITE_API_URL: 'https://staging-api.devoffice.ai',
      VITE_WS_URL: 'wss://staging-ws.devoffice.ai'
    }
  },
  
  cdn: {
    assets: ['fonts', 'images'],
    caching: {
      fonts: '1y',
      js: '1w',
      css: '1w'
    }
  }
};
```

---

## 📚 Dependencies List

```json
{
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "phaser": "4.0.0",
    "recharts": "2.15.2",
    "@radix-ui/*": "~1.x.x",
    "lucide-react": "0.487.0",
    "sonner": "2.0.3",
    "qrcode": "1.5.4",
    "tailwind-merge": "3.2.0",
    "class-variance-authority": "0.7.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "4.7.0",
    "vite": "6.3.5",
    "tailwindcss": "4.1.12",
    "@tailwindcss/vite": "4.1.12",
    "typescript": "5.x"
  }
}
```

---

Tài liệu này cung cấp đầy đủ thông tin kiến trúc frontend cho Performance Test và UI Design Document.
