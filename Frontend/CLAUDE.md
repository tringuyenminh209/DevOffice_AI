# Frontend — DevOffice AI (v3.0)

> Phase: **実装中** — UI first, mock data, then wire to backend.

## Dev

```bash
cd Frontend
pnpm dev        # http://localhost:5173
pnpm build      # dist/
```

## Key Facts

- **Phaser version**: 4.0.0 (NOT 3.x — API differs: `Phaser.Types.*`, `this.add.graphics()`, etc.)
- **Routing**: `useState`-based screen navigation in `App.tsx` (no react-router for now)
- **Theme**: Always dark. `dark` class on root div. Colors via CSS vars in `src/styles/theme.css`
- **State**: Mock data only until Supabase connected. No zustand yet — plain useState per screen
- **HTTP**: native fetch only. No axios.
- **Icons**: `@mui/icons-material` only. No MUI components.
- **No emoji** in any UI output

## Color Palette (from theme.css)

```
bg:      #0C0D12   (--background)
surface: #15171F   (--surface / --popover)
card:    #1D202B   (--card)
border:  #2B303F   (--border)
accent:  #5E55EA   (--primary / --accent)

Company colors:
MK (Marketing):  #DA3950  (crimson)
DV (Dev Team):   #5E55EA  (indigo)
LG (Legal):      #800080  (purple)
RS (Research):   #267ADE  (sapphire)
AN (Analytics):  #10B06B  (emerald)

Status:
emerald: #10B06B  (success / running)
amber:   #EB9619  (pending / thinking)
crimson: #DA3950  (error / high-risk)
sapphire:#267ADE  (info / medium-risk)
```

## Screen Build Order & Status

| # | Screen | File | Status |
|---|---|---|---|
| 1 | Landing Page | `components/LandingPage.tsx` | **in progress** |
| 2 | World Map | `components/WorldMapPage.tsx` | **in progress** |
| 3 | Company Profile + Task Form | `components/CompanyProfilePage.tsx` | **in progress** |
| 4 | Approval Gate Modal | `components/ApprovalModal.tsx` | exists (v2, needs v3 update) |
| 5 | My Tasks | `components/MyTasksPage.tsx` | todo |
| 6 | Task Detail + Result | `components/TaskDetailPage.tsx` | todo |
| 7 | Credits | `components/CreditsPage.tsx` | todo |
| 8 | Login / Register | `components/AuthPage.tsx` | todo |

## Navigation (App.tsx)

```typescript
type Screen = 'landing' | 'world' | 'company' | 'tasks' | 'task-detail' | 'credits' | 'auth';
// nav.goto('company', { companyId: 'MK' })
// nav.goto('task-detail', { taskId: 'abc123' })
```

## Companies (mock seed)

```typescript
const COMPANIES = [
  { id: 'MK', name: 'Marketing Crew', color: '#DA3950', credits: 10 },
  { id: 'DV', name: 'Dev Team',       color: '#5E55EA', credits: 15 },
  { id: 'LG', name: 'Legal Review',   color: '#800080', credits: 12 },
  { id: 'RS', name: 'Research Lab',   color: '#267ADE', credits: 10 },
  { id: 'AN', name: 'Analytics',      color: '#10B06B', credits: 8  },
];
```

## World Map Canvas (HTML5 Canvas, not Phaser for landing)

- 3×2 grid: MK(0,0) DV(1,0) LG(2,0) | PLAZA(0,1) RS(1,1) AN(2,1)
- Agents = colored dots orbiting buildings
- Messages = animated dashed lines between buildings
- Building colors = company brand colors

## Phaser 4 (WorldScene in full World Map page)

```typescript
import Phaser from 'phaser';
// Phaser 4 differences from 3:
// - Scene extends Phaser.Scene (same)
// - this.add.graphics() (same)
// - Phaser.Math.* (same)
// - GameObjects use this.add.rectangle() etc.
```

## Files NOT to touch

- `src/styles/theme.css` — CSS vars are correct, don't override
- `src/app/components/ui/*` — shadcn/ui primitives, don't modify
- `src/app/utils/websocketMock.ts` — can repurpose for mock realtime
