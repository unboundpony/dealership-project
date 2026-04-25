# Cox Automotive — Omni-Channel Dealer Health Index

> A single, IE-weighted executive dashboard that centralizes telemetry from the
> **Big 6** Cox Automotive brands into one composite **Dealer Health Score
> (0–100)**.

The application is designed as an internship-portfolio-grade proof of concept
for the Cox Automotive PRISM platform: a high-density, cross-brand operations
cockpit that turns fragmented source-system signals into a single,
boardroom-ready number — and then shows *exactly* which operational stage is
dragging that number down.

---

## 1 · The Big 6 Signal Architecture

| Pillar        | Source System           | Key Signals                                      |
| ------------- | ----------------------- | ------------------------------------------------ |
| **Inventory** | **vAuto** · **Manheim** | Market Days Supply, Stocking Health, Auction Win-Rate, Floor Variance |
| **Demand**    | **Autotrader**          | VDP Views / VIN, Lead-to-Appointment Conversion |
| **Valuation** | **Kelley Blue Book**    | Price-to-Market Index, Trade-In Volume          |
| **Service**   | **Xtime**               | Recon Cycle Time (Speed-to-Retail), Bay Utilization |
| **Finance**   | **Dealertrack**         | F&I Penetration, Tier A+B Credit Mix            |

Each brand card in the **Brand Signal Grid** renders its own pillar score, live
sync status, and per-metric normalized bars. The dashboard "feels live" via a
jitter loop in `useDealerHealth` that mimics a 6-second polling cadence.

---

## 2 · The `HealthScoreEngine` — IE-Weighted MCDA

The scoring engine (`src/utils/HealthScoreEngine.ts`) implements a
three-stage **Multi-Criteria Decision Analysis (MCDA)** pipeline, weighted
using the **Importance × Entropy (IE)** principle from operations research:

### Stage 1 — Normalization

Every raw metric is mapped to `[0, 1]` against its own `target` (healthy) and
`floor` (worst-tolerated) thresholds, respecting whether higher or lower is
better:

```
higher-better:  n = (value − floor) / (target − floor)
lower-better:   n = (floor − value) / (floor − target)
```

This decouples wildly different units (days, %, counts, indices, $) and puts
every metric on a common, dealer-relative scale.

### Stage 2 — IE Weighting (Importance × Shannon Entropy)

Pillar weights are a principled blend of analyst importance priors and the
**Shannon entropy** of the live signal:

```
H(pillar) = −Σ pᵢ · ln(pᵢ)      where pᵢ = nᵢ / Σn  for pillar metrics

w(pillar) = 0.7 · prior  +  0.3 · H(pillar) / ΣH(all)
```

* **Importance prior** — executive judgment: inventory and demand move the P&L
  the fastest, service is the recon bottleneck that gates the other four, and
  finance closes the deal.
* **Entropy term** — rewards *decision-relevant* information. Pillars whose
  constituent metrics disagree (high entropy) carry more diagnostic signal and
  are weighted up; pillars that have saturated (low entropy) are damped down.

The 70/30 prior-to-entropy blend keeps the dashboard stable for executives
while still letting the live signal shift emphasis when a pillar genuinely
becomes more informative.

Intra-pillar metric weights (`MetricSpec.weight`) are analyst-set importance
priors baked into the service layer — e.g. *Recon Cycle Time* is 60 % of the
Service pillar because speed-to-retail is the single biggest lever Xtime
controls.

### Stage 3 — Aggregation + Drag Attribution

```
pillarScore = Σ (w_metric · n_metric) / Σ w_metric      (0–1, per pillar)

Score       = 100 · Σ (w_pillar · pillarScore_pillar)   (0–100, final)
```

Beyond the headline number, the engine emits a **ranked bottleneck list**:

```
drag(metric) = (1 − n_metric) · w_metric · (w_pillar / brandsInPillar) · 100
```

`drag` is literally *"how many score points out of 100 is this one metric
personally costing us right now?"* — the output that powers the **Operational
Bottlenecks (IE Insight)** panel.

---

## 3 · UI/UX — Cox PRISM "Executive Navy"

The theme is a dense, executive-navy palette tuned for board-room legibility
on dark displays:

* **Navy base** (`#060B1A → #243C79`) for chrome and panels
* **Accent Cyan** (`#22D3EE`) for primary data / live indicators
* **Gold / Amber / Crimson** for severity ramps on bottlenecks
* **Emerald** for on-target / healthy callouts
* **Inter** display + body, **JetBrains Mono** for tabular numerics

### Key components

| Component                   | Role                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `HeroScore.tsx`             | Interactive radial gauge, pillar contribution bars, 30-day spark |
| `BrandGrid.tsx`             | Six Big-6 cards with live sync badges and per-metric bars  |
| `OperationalBottlenecks.tsx`| Ranked IE-drag list with severity chips + recommendations   |
| `PillarRadar.tsx`           | Radar chart of live score vs 85-point target fingerprint    |
| `BrandRankBar.tsx`          | Horizontal benchmark of every source system's pillar score  |
| `KpiStrip.tsx`              | Six hero KPIs synced directly from brand telemetry          |
| `MethodologyPanel.tsx`      | Executive audit trail of the 3-stage scoring pipeline       |
| `AppHeader.tsx`             | Live/pause controls, search, alert center, user chrome      |

Icons are **lucide-react**, all charts are **recharts**.

---

## 4 · Project Structure

```
src/
├── components/              UI — Hero, BrandGrid, Bottlenecks, charts, header
│   └── ui/                  Shared primitives (Panel, SyncBadge, ScoreSpark)
├── hooks/
│   └── useDealerHealth.ts   Live-feed simulator + HealthScoreEngine driver
├── services/
│   └── mockDealerData.ts    The Big 6 signal fixture + realistic jitter
├── utils/
│   ├── HealthScoreEngine.ts The MCDA/IE scoring engine (core of the app)
│   ├── cn.ts                clsx + tailwind-merge class composer
│   └── format.ts            i18n-aware number / %, / $ / day formatters
├── types/
│   └── health.ts            BrandSignal, MetricSpec, HealthReport, Bottleneck
├── styles/
│   └── index.css            Tailwind layers + Cox PRISM design tokens
├── App.tsx                  Dashboard composition root
└── main.tsx                 React entry point
```

---

## 5 · Running the Project

### Prerequisites

* Node.js ≥ 20 (Node 22 / 24 both tested)
* npm ≥ 10

### Scripts

```powershell
npm install          # one-time install
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # type-check + production build into /dist
npm run preview      # serve the built bundle locally
npm run typecheck    # tsc -b --noEmit
```

---

## 6 · Design Decisions & Trade-Offs

| Decision | Why |
| -------- | --- |
| **IE weighting (entropy + prior blend)** | Pure entropy weights are jumpy on small signal sets; pure priors ignore live market reality. The 70/30 blend is the standard CRITIC-family compromise. |
| **Mocked `jitterBrands` feed** | Keeps the demo fully self-contained and reproducible while simulating the *behavior* of a live Cox data-mesh subscription. Swap the mock service for a real fetch client without touching the engine. |
| **Per-metric `target` / `floor`** | Normalizing to dealer-specific targets (not global min-max) prevents lane-leader dealers from being penalized by raw-unit outliers elsewhere in the dataset. |
| **Separate drag attribution** | Decoupling "what's the score" from "what's dragging it down" lets the same engine output power both the Hero gauge *and* the Bottlenecks panel without redundant computation. |
| **Type-first domain model** | `src/types/health.ts` is the source of truth; services and components conform to it. This mirrors how Cox's PRISM contracts would be consumed in production. |

---

## 7 · Future Hooks

* Replace `src/services/mockDealerData.ts` with a real PRISM / GraphQL client.
* Persist `previousOverall` and snapshots to power a true 30/60/90-day trend.
* Add per-rooftop drill-down routes (`/rooftop/:id`).
* Wire `recommendationFor` to Cox's play-book CMS for in-context actions.
* Add a what-if simulator: let the user drag a pillar slider and watch the
  overall score, weights, and bottlenecks recompute live.

---

**Build summary · why IE matters for an omnichannel dealer:** a dealer's P&L
is not the average of its five pillars — it is gated by the *worst* one that
is *currently moving*. Shannon entropy is how we detect which pillar is moving
the most, and MCDA is how we turn that detection into a single, defensible,
boardroom-grade number. Everything in this dashboard is in service of that one
idea.
