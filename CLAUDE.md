# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

金融資産シミュレーター (Financial Asset Simulator) - A Monte Carlo simulation tool for financial assets with regime-switching model. Single-screen React application for simulating portfolio performance across market regimes (normal/crash/recovery).

## Commands

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Type check (tsc -b) then build with Vite
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Architecture

**Tech Stack**: TypeScript, React 19, Vite 7, Tailwind CSS v4, shadcn/ui, Supabase (Auth & Database)

**Key Directories**:
- `src/lib/utils.ts` - Utility functions including `cn()` for Tailwind class merging
- `src/components/ui/` - shadcn/ui components (install via `npx shadcn@latest add <component>`)

**Import Alias**: Use `@/` for src imports (e.g., `import { cn } from "@/lib/utils"`)

**shadcn/ui Config** (`components.json`):
- Style: "new-york"
- Icons: lucide-react
- CSS variables enabled for theming

## Domain Context

See `doc/requirements.md` for full specification. Key concepts:

- **Regime-switching model**: Market phases (通常期 normal +8%, 暴落期 crash -30%, 戻り期 recovery +15%)
- **Monte Carlo simulation**: 1,000 trials default, annual time steps
- **Asset types**: Stocks (株式), Bonds (国債), Cash (現金)
- **Withdrawal priority**: Configurable order for normal vs crash periods
- **Scenarios**: Multiple parameter sets for comparison simulations

## Git

- Commit messages should be written in English

## TypeScript

Strict mode enabled. Key settings in `tsconfig.app.json`:
- `noUnusedLocals`, `noUnusedParameters`
- `erasableSyntaxOnly` (type-only imports)
- Target ES2022, JSX react-jsx
