# @entidex/sdk

**Signed, verifiable entity ground truth** — the typed TypeScript client for the [Entidex](https://entidex.com) entity-intelligence API.

AI engines get entities wrong. Entidex maintains a verified, provenance-carrying record per entity and measures exactly where each engine diverges from it. This SDK gives you that in three calls:

1. **Knowledge Statement** — the signed verified record (Ed25519, `did:web:entidex.com`) plus corrections to the claims AI engines currently get wrong: `knowledge('tesla')`.
2. **LLM Knowledge Accuracy** — per-engine accuracy vs the verified record, with a 95% confidence interval and the exact fields each engine gets wrong: `knowledgeAccuracy('tesla')`.
3. **Information lag** — how long it takes each engine to pick up new facts: `episodeAdoptionLag(id)` for shows/creators, `timeline(id)` and `drift(id)` for the movement history behind it.

On top of that sits the full visibility dataset — AI Visibility, Sentiment, Share of Voice, Trust Stack, lifecycle, drift, cohorts — one typed helper per `/v1` endpoint.

Zero runtime dependencies. Works in Node 18+, Deno, Bun, edge runtimes, and the browser.

> **Prefer tools over REST?** The same record is exposed as MCP tools your AI client can call directly: `npx @entidex/mcp-setup` configures Claude Desktop, Claude Code, Cursor, or VS Code in one command. Docs: [entidex.com/developers/mcp](https://entidex.com/developers/mcp).

## Install

```bash
npm install @entidex/sdk
```

## Quick start

```ts
import { EntidexClient } from '@entidex/sdk';

const entidex = new EntidexClient({ apiKey: process.env.ENTIDEX_API_KEY });

// The signed verified record + corrections to common AI claims
const statement = await entidex.knowledge('tesla');
console.log(statement.verifiedFacts);   // provenance-carrying facts
console.log(statement.corrections);     // what AI engines currently get wrong

// Per-engine accuracy vs that record
const accuracy = await entidex.knowledgeAccuracy('tesla');
if (accuracy.available) {
  console.log(accuracy.accuracyPct);    // e.g. 78 (± 95% CI)
  console.log(accuracy.perEngine);      // exact wrong/unaware fields per engine
}

// Check a statement BEFORE asserting it (free tier — the guardrail hook)
const check = await entidex.groundingCheck('tesla', 'Tesla is headquartered in Palo Alto');
if (check.available) {
  console.log(check.verdict);           // "contradicted" — with a citation into the signed record
}

// Or the complete, categorized record in one call
const record = await entidex.complete('tesla');
console.log(record.headline.aiVisibility);
console.log(record.meta.withheld);      // sections your tier hasn't unlocked yet
```

A **free key** unlocks the free, rate-limited tier — a generous taste (identity, categorization, headline signals, coverage, grounding packet + grounding check). Create one at [entidex.com/developers](https://entidex.com/developers); keyless requests are rejected (every tier needs a key for per-key rate-limiting + attribution). Higher tiers unlock scores, perception, derived insights, drift, decision survival and cohort additively; anything withheld is listed in `record.meta.withheld` with the tier that unlocks it.

## API

```ts
const entidex = new EntidexClient({
  apiKey: 'entx_…',                       // required — a free key still unlocks the free tier
  baseUrl: 'https://entidex.com/api/v1',  // optional override
  fetch: customFetch,                     // optional — for Node <18 / testing
});
```

Every read endpoint has a typed helper — the SDK is at full parity with the REST API, MCP server, and CLI.

**Ground truth & grounding** (the wedge)

| Method | Returns | Notes |
| --- | --- | --- |
| `knowledge(id)` · `groundTruth(id)` | `KnowledgeStatement` | signed verified record + AI-engine corrections + accuracy |
| `groundingPacket(id)` | `GroundingPacket` | deterministic, signed per-entity grounding payload — fetch first, answer second |
| `groundingMetadata(id)` | `GroundingMetadataProjection` | the packet in Vertex `GroundingMetadata` shape for grounding pipelines |
| `groundingCheck(id, statement)` | `GroundingCheckResponse` | coded verdicts (supported \| contradicted \| unverifiable) + citations vs the signed record — free tier |
| `knowledgeAccuracy(id)` | `KnowledgeAccuracyResponse` | per-engine accuracy vs the verified record (overall % + 95% CI + per-engine wrong/unaware fields) |
| `episodeAdoptionLag(id)` | `EpisodeAdoptionLagResponse` | per-episode Episode → Engine Adoption Lag (how long until each engine can name it) |

**Identity & the composite record**

| Method | Returns | Notes |
| --- | --- | --- |
| `resolve(query)` | `Entity` | name/alias → the resolved canonical entity profile (lite on a free key) |
| `resolveCreator(query)` | `CreatorResolutionResult` | creator/podcast name or profile link → canonical creator + cross-verified handles |
| `getEntity(id, { include })` | `Entity` | identity; free tier returns the lite projection |
| `complete(id)` | `EntityComplete` | **the full categorized record in one call** |
| `insights(id)` | `Partial<Record<ScoreDimension, Score>>` | all score dimensions (insight tier) |

**Composable read datasets** (one typed twin per `/v1` endpoint)

| Method | Returns | Notes |
| --- | --- | --- |
| `drift(id, { limit?, days? })` | `DriftEvent[]` | detected drift events, newest first |
| `timeline(id, { days?, limit? })` | `EntityTimeline` | unified "what happened, when, and why" stream with evidence panels |
| `scoreHistory(id, { dimension?, days? })` | `ScoreHistoryResponse` | time-series history + deltas/trend per dimension |
| `trajectory(id)` | `TrajectoryResponse` | momentum / acceleration / sparklines per dimension |
| `lifecycle(id)` | `LifecycleView` | nine-state lifecycle stage + predicted next |
| `consensusMap(id)` | `ConsensusMapResponse` | cross-surface consensus / divergence + trend matrix |
| `decisionSurvival(id, { scenario? })` | `DecisionSurvivalResponse` | survival across multi-turn AI conversations |
| `recommendationPotential(id)` | `RecommendationPotentialResponse` | per-prompt-class AI recommendation rates + 95% CI |
| `serpVsAi(id)` | `SerpVsAiResponse` | traditional-search vs AI-engine presence with a coded gap verdict |
| `googleAiAnswers(id)` | `GoogleAiAnswersResponse` | what Google AI Overviews + AI Mode say — answers, citations, competitor mentions |
| `guestIntelligence(id)` | `GuestIntelligenceResponse` | per-episode cast read + Guest Impact roll-up |
| `ecosystem(id)` | `PublicEcosystem` | per-engine grounded fit + strategic narrative |
| `coreIntelligence(id)` | `CoreIntelligence` | ten authority/readability scores + grounding |
| `xSentiment(id)` · `xSentimentHistory(id)` | `XSentimentSnapshot \| null` · `XSentimentSnapshot[]` | X (social) sentiment + the early-warning series |
| `markets(id)` · `marketsHistory(id)` | `PublicMarketData \| null` · `PublicMarketData[]` | stock-market reading (EOD/live) + series |
| `dataCompleteness(id, { lag? })` | `DataCompletenessResponse` | per-engine self-check completeness |
| `authenticity(id)` | `AuthenticitySummary` | creator-tier authenticity sub-signal |
| `cohort(id)` | `EntityCohortResponse` | cohorts this entity is in + its position |
| `cohortRankings(cohortId, { dimension? })` | `CohortRankingsResponse` | ranked cohort leaderboard |
| `get<T>(path, params)` · `post<T>(path, body)` | `T` | low-level escape hatch for any `/v1` endpoint |

All methods return the unwrapped `data` payload, or throw `EntidexApiError` (with `code`, `status`, and the full `errors[]`). Endpoints whose record may be absent return an `available: false` union arm (e.g. `decisionSurvival`, `consensusMap`, `ecosystem`, `dataCompleteness`); `markets`/`xSentiment` return `null` when there's no reading; `coreIntelligence` throws `404` when never run.

```ts
import { EntidexApiError } from '@entidex/sdk';

try {
  const record = await entidex.complete('unknown-entity');
} catch (err) {
  if (err instanceof EntidexApiError) {
    console.error(err.code, err.status, err.message);
  }
}
```

Every type in the v1 contract is exported (`EntityComplete`, `Score`, `DriftEvent`, `EntityCategorization`, …) so you can build fully-typed pipelines on top of the record.

## Links

- API reference: <https://entidex.com/api>
- Developer hub: <https://entidex.com/developers>
- MCP server: <https://entidex.com/developers/mcp>

## License

MIT © ENTIDEX LTD
