/**
 * @entidex/sdk — official TypeScript client for the Entidex entity-intelligence API.
 *
 * Zero runtime dependencies (uses the platform `fetch`). The star method is
 * {@link EntidexClient.complete}, which returns the complete, categorized
 * intelligence record for an entity in a single call — identity,
 * categorization, headline signals, surface coverage, scores, perception,
 * derived insights, drift, lifecycle, relationships, decision survival and
 * cohort. Depth widens with your API tier; withheld sections are listed in
 * `meta.withheld`.
 *
 * @example
 * ```ts
 * import { EntidexClient } from '@entidex/sdk';
 * const entidex = new EntidexClient({ apiKey: process.env.ENTIDEX_API_KEY });
 * const record = await entidex.complete('tesla');
 * console.log(record.headline.aiVisibility, record.categorization.lifecycleStage);
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirror the frozen Entidex /v1 contract (additive optional fields only)
// ─────────────────────────────────────────────────────────────────────────────

export type ApiTier =
  | 'free'
  | 'layer_0_discovery'
  | 'layer_1_profile'
  | 'layer_2_insight'
  | 'layer_3_drift'
  | 'layer_4_cohort';

export type EntityType =
  | 'organization'
  | 'person'
  | 'product'
  | 'location'
  | 'event'
  | 'concept'
  | 'podcast';

export type ScoreDimension =
  | 'completeness'
  | 'visibility'
  | 'sentiment'
  | 'shareOfVoice'
  | 'trustStack'
  | 'narrativeCoverage'
  | 'maturity';

export type Trajectory =
  | 'improving'
  | 'stable'
  | 'declining'
  | 'volatile'
  | 'accelerating'
  | 'decelerating'
  | 'recovering';

/** Canonical set documented at https://entidex.com/api — kept open for forward-compat. */
export type SourceSurface = string;
export type DriftType = string;
export type DriftPattern = string | null;
export type Severity = 'low' | 'moderate' | 'high' | 'critical';

export interface EntityIdentifiers {
  wikidataQid?: string | null;
  companiesHouseNumber?: string | null;
  linkedinSlug?: string | null;
  domain?: string | null;
  duns?: string | null;
  [key: string]: string | null | undefined;
}

export interface NeighbourhoodEdge {
  entityId: string;
  edgeType: string;
  weight: number;
  lastObservedAt: string;
}

export interface ScoreConfidence {
  interval95?: [number, number];
  variance?: number | null;
  sampleSize?: number;
  probeRunIds?: string[];
  lastObservedAt?: string;
  version?: string;
}

export interface ScoreBreakdown {
  key: string;
  value: number;
  confidence: number;
  observationCount: number;
  weight: number;
}

export interface ScoreWindow {
  start: string;
  end: string;
  label: string;
}

export interface Score {
  dimension: ScoreDimension;
  scope: string;
  value: number;
  valueRange: [number, number];
  confidence: number;
  confidenceLayer?: ScoreConfidence;
  window: ScoreWindow;
  breakdown: ScoreBreakdown[];
  explanation: string;
  computedAt: string;
  previousValue: number | null;
  delta30d: number | null;
  delta90d: number | null;
  trajectory: Trajectory;
}

export interface DriftSignal {
  surface: SourceSurface;
  metric: string;
  value: number | string | string[];
  baseline?: number | null;
  zScore: number | null;
  observationCount: number;
}

export interface DriftProjection {
  horizon: string;
  expectedDirection: string;
  expectedDeltaRange: [number, number];
  confidence: number;
}

export interface DriftEvent {
  id: string;
  entityId: string;
  type: DriftType;
  pattern: DriftPattern;
  severity: Severity;
  direction: 'positive' | 'negative' | 'neutral';
  detectedAt: string;
  windowStart: string;
  windowEnd: string;
  confidence: number;
  signals: DriftSignal[];
  explanation: string;
  relatedClaimChanges: string[];
  projectedTrajectory?: DriftProjection | null;
}

export interface Entity {
  id: string;
  type: EntityType;
  subtype: string | null;
  canonicalName: string;
  identifiers: EntityIdentifiers;
  primaryMarket: string | null;
  lastObservedAt: string | null;
  // The fields below are present on the full profile (layer_1_profile+) but
  // omitted by the free-tier lite projection — `getEntity`/`resolve` on a free
  // key return identity + identifiers + cached headline signals only (CANON
  // 1.22). Optional so the type is honest about both shapes.
  aliases?: string[];
  markets?: string[];
  neighbourhood?: NeighbourhoodEdge[];
  createdAt?: string;
  lastResolvedAt?: string | null;
}

export interface Observation {
  id: string;
  entityId: string;
  sourceSurface: SourceSurface;
  sourceProvider: string;
  sourceUrl: string | null;
  sourceTitle: string | null;
  snippet: string | null;
  observedAt: string;
  publishedAt: string | null;
  sentimentScore: number | null;
  sentimentConfidence: number | null;
  extractedClaims: string[];
  extractedEntities: string[];
}

// ── EntityComplete family (the single categorized record) ────────────────────

export type DecompositionModel = 'commercial' | 'person' | 'organisation' | 'mixed';

export interface EntityCohortMembership {
  id: string;
  name: string;
}

export interface EntityCategorization {
  category: string | null;
  primaryType: EntityType;
  subtype: string | null;
  decompositionModel: DecompositionModel | null;
  entityClass: string | null;
  lifecycleStage: string | null;
  surfacesPresent: string[];
  topics: string[];
  cohorts: EntityCohortMembership[];
}

export interface EntityCompleteHeadline {
  aiVisibility: number | null;
  sentiment: number | null;
  shareOfVoice: number | null;
  trustStack: number | null;
}

export interface PerceptionSurfaceSummary {
  surface: SourceSurface;
  label: string;
  value: number;
  sampleSize: number;
}

export interface EntityCompletePerception {
  consensusScore: number | null;
  divergenceScore: number | null;
  surfaces: PerceptionSurfaceSummary[];
}

export interface DerivedInsightSummary {
  id: string;
  label: string;
  value: number;
  confidence: number;
  contributingSources: string[];
}

export interface EntityCompleteLifecycle {
  stage: string | null;
  label: string | null;
  confidence: number | null;
  drivers: string[];
  predictedNext?: { stage: string; label: string; confidence: number } | null;
}

export interface SurfaceCoverageSummary {
  surface: SourceSurface;
  observationCount: number;
  lastObservedAt: string | null;
}

export interface EntityCompleteCoverage {
  /**
   * Discovery-layer observation rows in signals.observations
   * (Reddit / press / SERP / owned-content / registry). Does NOT
   * include AI-engine probes — see `aiEngineProbes`.
   */
  totalObservations: number;
  /**
   * AI-engine probe passes captured on entity.platformSignals
   * (one per queried engine on the last pass). Additive with
   * `totalObservations` — together they give the full "how much
   * do we know about this entity" number.
   */
  aiEngineProbes: number;
  surfaces: SurfaceCoverageSummary[];
}

export interface CohortPositionSummary {
  cohortId: string;
  cohortName: string;
  rank: number;
  /** Normalised rank position 0–1 (1 = top) — not a statistical percentile. */
  percentile: number;
  /** Signed delta vs cohort median; null when the cohort has no value for the dimension. */
  visibilityDelta: number | null;
  sentimentDelta: number | null;
  entityCount: number;
}

export interface GatedSection<T> {
  available: boolean;
  requiresTier?: ApiTier;
  data?: T;
}

export interface WithheldSection {
  section: string;
  requiresTier: ApiTier;
}

export interface EntityCompleteMeta {
  assembledAt: string;
  tier: ApiTier;
  recordVersion: string;
  withheld: WithheldSection[];
  upgrade?: string;
}

// ── Additive sections (recordVersion 1.1.0) ──────────────────────────────────

export interface EntityEcosystemEngineSummary {
  engine: string;
  label: string;
  maker: string | null;
  fit: number;
  mentionRate: number | null;
  recommendationRate: number | null;
  citationRate: number | null;
  sentiment: string | null;
  confidence: number;
  lastObservedAt: string | null;
}
export interface EntityEcosystemSummary {
  influenceScore: number | null;
  coherenceScore: number | null;
  engines: EntityEcosystemEngineSummary[];
}

export interface AuthenticitySummary {
  available: boolean;
  reason?: 'creator_type_only' | 'no_signal_yet';
  entityClass?: string;
  score?: number;
  sampleSize?: number;
  lastObservedAt?: string;
}

export interface TypedRelationshipSummary {
  entityId: string;
  name: string;
  type: string;
  label: string;
  direction: 'forward' | 'inverse';
  strength: number | null;
  confidence: number;
  sourceSurface: string | null;
  observedAt: string;
}

export interface TruthGapSummary {
  aspect: string;
  divergence: number;
  computedAt: string;
}

export interface SelfCheckEngineSummary {
  engine: string;
  completenessPct: number | null;
  truthGapPct: number | null;
}
export interface SelfCheckSummary {
  lastComputedAt: string;
  schemaConformant: boolean;
  perEngine: SelfCheckEngineSummary[];
  topGaps: string[];
}

export interface EntityYouTubeSummary {
  channel: {
    subscriberCount: number | null;
    totalViewCount: number | null;
    videoCount: number | null;
    fetchedAt: string | null;
  } | null;
  episodeCount: number;
  commentsAnalysed: number;
  topIntent: string | null;
  intentDistributionPct: {
    praise: number;
    question: number;
    complaint: number;
    suggestion: number;
    neutral: number;
  };
  lastFetchedAt: string | null;
}

/** Stock-market reading for an entity (CANON Amendment 21). */
export interface PublicMarketData {
  found: true;
  symbol: string | null;
  exchange: string | null;
  price: number | null;
  currency: string | null;
  changePct: number | null;
  marketCapUsd: number | null;
  /** ISO timestamp the quote reflects. */
  asOf: string | null;
  /** true = near-real-time, false = end-of-day / delayed. */
  live: boolean;
  /** Quote freshness class — provider names are internal. */
  source: 'real-time' | 'delayed' | null;
  /** Set when the reading comes from a public owner/parent, not the entity itself. */
  viaPublicOwner: { ownerSlug: string; relationship: string } | null;
  /** 0–100 confidence (lower for EOD / owner-derived). */
  confidence: number;
  collectedAt: string;
}

export interface EntityComplete {
  entity: Entity;
  categorization: EntityCategorization;
  headline: EntityCompleteHeadline;
  coverage: EntityCompleteCoverage;
  scores: Score[];
  perception: EntityCompletePerception | null;
  derivedInsights: DerivedInsightSummary[];
  lifecycle: EntityCompleteLifecycle;
  drift: DriftEvent[];
  relationships: NeighbourhoodEdge[];
  typedRelationships: TypedRelationshipSummary[];
  ecosystem: EntityEcosystemSummary | null;
  authenticity: AuthenticitySummary | null;
  truthGap: TruthGapSummary[];
  selfCheck: SelfCheckSummary | null;
  youtubeIntelligence: EntityYouTubeSummary | null;
  /** Stock-market reading when the entity (or its public owner) is listed; null otherwise. */
  markets: PublicMarketData | null;
  subEntities: GatedSection<{ count: number }>;
  decisionSurvival: GatedSection<unknown>;
  cohort: GatedSection<CohortPositionSummary[]>;
  meta: EntityCompleteMeta;
}

// ── Reconciliation ───────────────────────────────────────────────────────────

export type ReconciliationBand = 'auto' | 'strong' | 'review' | 'unresolved';

export interface ReconciliationCandidate {
  entityId: string;
  canonicalName: string;
  confidence: number;
}

export interface ReconciliationResult {
  input: string;
  resolved: boolean;
  entityId: string | null;
  canonicalName: string | null;
  confidence: number;
  band: ReconciliationBand;
  candidates: ReconciliationCandidate[];
}

// ── Creator Resolution (GET /creators/resolve) ───────────────────────────────
export type CreatorResolutionBand = 'confirmed' | 'ambiguous' | 'not_found';

/** One cross-platform handle of a resolved creator, with provenance. */
export interface CreatorHandle {
  platform: string;
  handle: string;
  url: string;
  verified: boolean;
  /** Public source-tier label: self_declared / knowledge_graph / site_reference / … */
  source: string;
  confidence: number;
}

/** Cached headline KPIs (each null when no snapshot exists). */
export interface CreatorHeadline {
  aiVisibility: number | null;
  sentiment: number | null;
  shareOfVoice: number | null;
  trustStack: number | null;
}

/** The CONFIRMED creator — one canonical record, fully resolved. */
export interface ResolvedCreator {
  id: string;
  slug: string;
  name: string;
  type: string;
  descriptor?: string | null;
  confidence: number;
  qid?: string | null;
  domain?: string | null;
  handles: CreatorHandle[];
  handleCount: number;
  profileUrl: string;
  signedRecordUrl: string;
  headline: CreatorHeadline;
  lastIndexedAt: string | null;
}

/** One AMBIGUOUS candidate, for the disambiguation picker. */
export interface CreatorCandidate {
  name: string;
  type: string;
  descriptor?: string | null;
  slug?: string | null;
  confidence: number;
  existing: boolean;
  sources: string[];
}

/** Resolve-and-show result: NAME or LINK → the one canonical creator. */
export interface CreatorResolutionResult {
  band: CreatorResolutionBand;
  query: string;
  inputKind: 'name' | 'link';
  creator?: ResolvedCreator;
  candidates?: CreatorCandidate[];
  usedAcquisition?: boolean;
}

// ── Response envelope ────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Standalone endpoint response shapes — typed twins for every read dataset.
// These mirror the public /v1 JSON each route emits (additive optional fields
// only). Absence of a record is surfaced either as an in-body `available:false`
// union arm (decision-survival, consensus-map, ecosystem, data-completeness) or
// as a thrown EntidexApiError (404) — documented per helper.
// ─────────────────────────────────────────────────────────────────────────────

// ── Score history (GET /entities/{id}/score-history) ─────────────────────────
export interface ScoreHistoryPoint {
  date: string;
  value: number;
}
export interface ScoreHistoryDimension {
  history: ScoreHistoryPoint[];
  current: number | null;
  previous: number | null;
  delta: number | null;
  trend: 'up' | 'down' | 'stable' | 'no_data';
}
export interface ScoreHistoryResponse {
  entityId: string;
  days: number;
  dimensions: Partial<Record<ScoreDimension, ScoreHistoryDimension>>;
}

// ── Trajectory (GET /entities/{id}/trajectory) ───────────────────────────────
export interface TrajectoryDimension {
  value: number;
  momentum: number;
  acceleration: number;
  trajectory: Trajectory;
  sparkline: number[];
}
export interface TrajectoryResponse {
  entityId: string;
  computedAt: string;
  dimensions: Partial<Record<ScoreDimension, TrajectoryDimension>>;
  activePatterns: string[];
  neighbourhoodVolatility: number;
  summary: string;
}

// ── Lifecycle (GET /entities/{id}/lifecycle) ─────────────────────────────────
export type LifecycleStage =
  | 'emergence'
  | 'breakout'
  | 'expansion'
  | 'consolidation'
  | 'fragmentation'
  | 'acquisition'
  | 'rebrand'
  | 'decline'
  | 'resurrection';
export interface LifecycleDriver {
  kind:
    | 'momentum_positive'
    | 'momentum_negative'
    | 'low_sample'
    | 'high_variance'
    | 'recovery_arc'
    | 'rebrand_event'
    | 'acquisition_event'
    | 'stable_range';
  weight: number;
  detail: string;
}
export interface LifecycleView {
  stage: LifecycleStage;
  label: string;
  confidence: number;
  drivers: LifecycleDriver[];
  predictedNext?: LifecycleStage;
  predictedNextLabel?: string;
  predictedNextConfidence?: number;
  computedAt: string;
  algorithmVersion: string;
  source: 'persisted' | 'live';
}

// ── Timeline (GET /entities/{id}/timeline) ───────────────────────────────────
export type TimelineEventKind =
  | 'score'
  | 'drift'
  | 'lifecycle'
  | 'x'
  | 'truthGap'
  | 'response'
  | 'googleAi';
export type TimelineTone = 'positive' | 'negative' | 'risk' | 'neutral';
/** One AI-engine reply excerpt attached to a `response` timeline event. */
export interface TimelineResponseExcerpt {
  engine: string;
  label: string;
  text: string;
  at: string;
  mentionedEntity?: boolean;
}
/** One verified/observed fact row attached to a `truthGap` event. */
export interface TimelineFactRow { label: string; value: string }
/** Optional expandable evidence panel — responses, facts, deep-dive links. */
export interface TimelineEvidence {
  responses?: TimelineResponseExcerpt[];
  facts?: TimelineFactRow[];
  links?: { label: string; href: string }[];
  note?: string;
}
export interface TimelineEvent {
  id: string;
  at: string;
  kind: TimelineEventKind;
  title: string;
  detail: string;
  tone: TimelineTone;
  dimension?: ScoreDimension;
  magnitude?: number;
  severity?: string;
  evidence?: TimelineEvidence;
}
export interface EntityTimeline {
  events: TimelineEvent[];
  windowDays: number;
  generatedAt: string;
  counts: {
    score: number;
    drift: number;
    lifecycle: number;
    x: number;
    truthGap: number;
    response: number;
    /** Google AI answers run summaries + mention/citation churn (CANON 1.93). */
    googleAi: number;
  };
}

// ── Consensus map (GET /entities/{id}/consensus-map) ─────────────────────────
export type GapTrend = 'converging' | 'diverging' | 'stable';
export interface SurfaceLeadLag {
  leaderLabel: string;
  followerLabel: string;
  lagDays: number;
  coMovementAtLag: number;
}
export interface SurfacePairConcordance {
  surfaceA: string;
  labelA: string;
  surfaceB: string;
  labelB: string;
  coMovement: number;
  concordance: number;
  meanGap: number;
  gapSlope: number;
  trend: GapTrend;
  sampleSize: number;
  lead: SurfaceLeadLag | null;
}
export interface SurfaceCorrelationMatrix {
  entitySlug: string;
  windowDays: number;
  computedAt: string;
  surfaces: { surface: string; label: string }[];
  pairs: SurfacePairConcordance[];
  aiEnginesPairs: SurfacePairConcordance[];
  overall: { meanConcordance: number; meanGapSlope: number; trend: GapTrend };
  snapshots: number;
}
export interface ConsensusMapSurface {
  surface: string;
  label: string;
  value: number;
  sampleSize: number;
  delta7d?: number;
}
export type ConsensusMapResponse =
  | {
      available: true;
      consensusScore: number;
      divergenceScore: number;
      surfaces: ConsensusMapSurface[];
      spread: { min: number; max: number; range: number };
      confidence: ScoreConfidence;
      lastObservedAt: string;
      trendMatrix: SurfaceCorrelationMatrix | null;
    }
  | { available: false; reason: 'no_signal_yet' | 'insufficient_surfaces' };

// ── Decision survival (GET /entities/{id}/decision-survival) ─────────────────
export interface DisplacementTurn {
  turn: number;
  replacedBy: { entitySlug: string; mentions: number }[];
}
export interface DecisionSurvivalTranscriptTurn {
  turn: number;
  prompt: string;
  response: string;
}
export interface DecisionSurvivalEngineTranscript {
  engine: string;
  survived: boolean;
  turns: DecisionSurvivalTranscriptTurn[];
}
export interface DecisionSurvivalScore {
  entityId: string;
  scenarioKey: string;
  scenarioLabel: string;
  depth: number;
  survivalRate: number;
  enginesEvaluated: number;
  enginesSurvived: number;
  perEngine: Record<string, number>;
  displacementChain: DisplacementTurn[];
  /** Per-engine captured transcript (prompts + actual replies). Empty for legacy rows. */
  transcript?: DecisionSurvivalEngineTranscript[];
  computedAt: string;
  confidence: ScoreConfidence;
}
export type DecisionSurvivalResponse =
  | { available: true; survivalRate: number; scores: DecisionSurvivalScore[] }
  | {
      available: false;
      reason: 'no_signal_yet' | 'scenario_not_found' | 'entity_type_out_of_scope';
    };

// ── AI Ecosystem (GET /entities/{id}/ecosystem) ──────────────────────────────
export interface PublicEcosystemEngine {
  engine: string;
  label: string;
  maker: string | null;
  fit: number;
  mentionRate: number;
  recommendationRate: number;
  citationRate: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  groundedIn: 'signals' | 'llm_estimated';
  sampleSize: number;
  confidence: number;
  lastObservedAt: string;
  communicationMatch: string;
  strengths: string[];
  gaps: string[];
  advice: string;
}
export type PublicEcosystem =
  | {
      available: true;
      entityId: string;
      influenceScore: number;
      coherenceScore: number | null;
      engines: PublicEcosystemEngine[];
      feedbackLoops: { type: string; engine: string; strength: number; description: string }[];
      coherenceGaps: {
        engine: string;
        impact: 'high' | 'medium' | 'low';
        issue: string;
        recommendation: string;
      }[];
      narrative: string | null;
      priorityActions: string[];
      lastAssessedAt: string | null;
      methodology: string;
    }
  | { available: false; reason: 'not_assessed_yet' };

// ── Entity Core Intelligence (GET /entities/{id}/core-intelligence) ──────────
export interface CoreIntelligenceScores {
  clarity: number;
  authority: number;
  trust: number;
  entityGraph: number;
  topicalAuthority: number;
  recommendation: number;
  marketClarity: number;
  machineReadability: number;
  momentum: number;
  /** 0 = high reputation risk, 100 = low risk. */
  reputationSafety: number;
}
export interface CoreIntelligenceGrounding {
  status: 'active' | 'unavailable';
  groundedAt?: string;
  searchResults: number;
  newsArticles: number;
  latestSourceDate?: string;
  sources: Array<{ url: string; title: string; publishedAt?: string; kind: 'news' | 'web' }>;
  note?: string;
}
export interface CoreIntelligence {
  entityId: string;
  entityName: string;
  version: number;
  lastUpdated: string;
  runCount: number;
  summary: string;
  primaryClassification: string;
  blendedScore: number;
  scores: CoreIntelligenceScores;
  topicOwnership: Array<{ topic: string; strength: string; reason: string }>;
  strongAssociations: Array<{ name: string; type: string; relationship: string }>;
  competitors: Array<{ name: string; overlap: string }>;
  perception: { positive: string[]; neutral: string[]; negative: string[] };
  strategicActions: string[];
  grounding: CoreIntelligenceGrounding | null;
}

// ── X (social) sentiment (GET /entities/{id}/x-sentiment) ────────────────────
export type XVolumeBucket = 'none' | 'low' | 'moderate' | 'high' | 'viral';
export interface XKeyVoice {
  handle: string;
  stance: string;
  influence: string;
  cites: number[];
}
export interface XClaim {
  claim: string;
  cites: number[];
}
export interface XAuthenticitySignal {
  assessment: string;
  patterns: string[];
  confidence: 'low' | 'medium';
}
export interface XExpansionLink {
  name: string;
  kind: 'person' | 'org' | 'product' | 'outlet' | 'account' | 'topic';
  relation: string;
  narrative: string;
  linkSentiment: number;
  coMentionStrength: 'weak' | 'notable' | 'dominant';
  cites: number[];
}
export interface XTimelineEvent {
  at: string;
  event:
    | 'volume_spike'
    | 'sentiment_shift'
    | 'key_post_viral'
    | 'external_trigger'
    | 'new_claim'
    | 'notable_post';
  summary: string;
  sentimentAfter: number | null;
  cites: number[];
}
export interface XEarlyWarning {
  spikeDetected: boolean;
  note: string;
}
export interface XSource {
  url: string;
  author: string;
  postedAt: string;
  kind: 'post' | 'reply' | 'quote' | 'unknown';
}
export interface XSentimentSnapshot {
  entitySlug: string;
  found: boolean;
  /** Weighted polarity, −1..1 (matches the other social providers' scale). */
  sentimentScore: number;
  sentimentLabel: string;
  volumeBucket: XVolumeBucket;
  approxMentions: number;
  windowHours: number;
  keyVoices: XKeyVoice[];
  topPraises: XClaim[];
  topComplaints: XClaim[];
  authenticity: XAuthenticitySignal;
  narrativeContext: string;
  expansion: XExpansionLink[];
  timeline: XTimelineEvent[];
  earlyWarning: XEarlyWarning;
  sources: XSource[];
  citations: string[];
  /** 0..100 confidence in the read. */
  confidence: number;
  model: string;
  collectedAt: string;
  error?: string;
  /** Additive (latest-read only): X → Grok coupling read, when history allows. */
  grokCoupling?: XGrokCoupling;
  /** Additive (latest-read only): latest official X profile snapshot, or null while dormant. */
  xProfile?: XProfileSnapshot | null;
  /** Additive (latest-read only): latest official-API narrative read, or null while dormant. */
  xNarrative?: XNarrativeRead | null;
}

/** X → Grok coupling — day-aligned co-movement of the X conversation vs Grok's perception. */
export interface XGrokCoupling {
  available: boolean;
  /** Present when available=false. */
  reason?: 'insufficient_history';
  /** Day-aligned co-movement, −1..1. */
  coMovement?: number;
  /** 100 − mean level gap between the day-aligned series (0..100). */
  concordance?: number;
  lead?: { leader: 'x' | 'grok'; lagDays: number; coMovementAtLag: number } | null;
  sampleDays?: number;
  windowDays?: number;
  methodology?: string;
  computedAt?: string;
}

/** Official X profile snapshot (keyed-dormant collector; null until credentials exist). */
export interface XProfileSnapshot {
  entitySlug: string;
  username: string;
  userId: string;
  displayName: string;
  followers: number;
  following: number;
  postCount: number;
  listedCount: number;
  verified: boolean;
  verifiedType: string | null;
  bio: string | null;
  accountCreatedAt: string | null;
  collectedAt: string;
  source: 'x_api';
}

/** A detected amplification event in the X conversation. */
export interface XAmplificationEvent {
  kind: 'viral_post' | 'ratio' | 'pile_on' | 'volume_surge';
  summary: string;
  evidencePostId: string | null;
  direction: 'positive' | 'negative';
  /** 0..1 */
  confidence: number;
  at: string;
}

/** Official-API narrative read of the X conversation (keyed-dormant collector; null until credentials exist). */
export interface XNarrativeRead {
  entitySlug: string;
  username: string;
  sampleSize: number;
  /** Mean 0..100 polarity over the sampled posts. */
  sentimentScore: number;
  sentimentLabel: 'positive' | 'mixed' | 'negative';
  intentDistribution: {
    praise: number;
    question: number;
    complaint: number;
    suggestion: number;
    neutral: number;
  };
  emergingTopics: string[];
  amplification: XAmplificationEvent[];
  postsPerHour: number;
  windowHours: number;
  collectedAt: string;
  source: 'x_api';
}

// ── Entity Knowledge Statement (GET /entities/{id}/ground-truth) ─────────────
export interface VerifiedFact {
  field: string;
  value: string;
  source: string;
  confidence: number;
  asOf: string | null;
}
export interface KnowledgeCorrection {
  field: string;
  commonAiClaim: string | null;
  verifiedValue: string | null;
  source: string;
  status: 'contradiction' | 'ai_unaware';
  asOf: string | null;
}
export interface NarrativeCorrection {
  aspect: string;
  ownView: string;
  externalView: string;
  divergence: number;
}
export interface KnowledgeStatement {
  entity: {
    id: string;
    slug: string;
    canonicalName: string;
    type: string;
    description: string | null;
    sameAs: string[];
    identifiers: { wikidataQid: string | null; website: string | null };
  };
  verifiedFacts: VerifiedFact[];
  /** Lower-authority observations superseded by a higher-authority record. */
  confirmations?: unknown[];
  corrections: KnowledgeCorrection[];
  narrative: NarrativeCorrection[];
  accuracy: {
    evaluated: number;
    matches: number;
    mismatches: number;
    pct: number | null;
    confidence: ScoreConfidence | null;
  };
  provenance: {
    issuer: string;
    issuerId: string;
    statementUrl: string;
    methodologyUrl: string;
    license: string;
    generatedAt: string;
    note: string;
    /** JWS over the content hash when a signing key is configured. */
    proof: unknown | null;
  };
  schemaVersion?: string;
  completeness?: {
    lastComputedAt: string;
    perLlm: Array<{
      engine: string;
      completenessPct: number | null;
      weightedCompletenessPct: number | null;
      truthGapPct: number | null;
    }>;
    topGaps: Array<{ field: string; importance: number }>;
  };
}

// ── Grounding Packet (GET /entities/{id}/grounding-packet) ───────────────────
// The named, free-tier developer packaging of the Entity Knowledge Statement:
// one small, deterministic per-entity grounding payload (verified facts +
// corrections + signed provenance) fetched at the top of an agent/RAG workflow.
export interface GroundingPacketFact {
  field: string;
  value: string;
  /** Provenance label of the verified source (e.g. "Wikidata"). */
  source: string;
  /** 0–100. */
  confidence: number;
  asOf: string | null;
}
export interface GroundingPacketCorrection {
  field: string;
  /** What AI engines commonly claim (null for an `ai_unaware` gap). */
  commonAiClaim: string | null;
  verifiedValue: string | null;
  source: string;
  status: 'contradiction' | 'ai_unaware';
  asOf: string | null;
}
export interface GroundingPacket {
  packetVersion: string;
  entity: {
    id: string;
    slug: string;
    canonicalName: string;
    type: string;
    description: string | null;
    identifiers: { wikidataQid: string | null; website: string | null };
    sameAs: string[];
  };
  /** Verified facts, one per canonical field, sorted by field. */
  facts: GroundingPacketFact[];
  /** Corrections to common AI claims, sorted by field. */
  corrections: GroundingPacketCorrection[];
  accuracy: { pct: number | null; matches: number; mismatches: number; evaluated: number };
  provenance: {
    issuer: string;
    issuerId: string;
    statementUrl: string;
    methodologyUrl: string;
    license: string;
    generatedAt: string;
    /** Ed25519 JWS over the statement content hash, when signing is configured. */
    proof: unknown | null;
    note: string;
  };
  links: { knowledgeMarkdown: string; knowledgeJsonLd: string; groundTruthApi: string };
}
export interface GroundingMetadataChunk {
  web: { uri: string; title: string };
}
export interface GroundingMetadataSupport {
  segment: { startIndex: number; endIndex: number; text: string };
  groundingChunkIndices: number[];
  /** 0–1 per referenced chunk. */
  confidenceScores: number[];
}
/** GroundingMetadata-shaped projection (`?format=grounding-metadata`). */
export interface GroundingMetadataProjection {
  packetVersion: string;
  entity: { id: string; slug: string; canonicalName: string };
  /** The grounded text the supports index into (one fact line per support). */
  text: string;
  groundingChunks: GroundingMetadataChunk[];
  groundingSupports: GroundingMetadataSupport[];
  provenance: GroundingPacket['provenance'];
}

// ── LLM Knowledge Accuracy (GET /entities/{id}/knowledge-accuracy) ───────────
export interface KnowledgeAccuracyCorrection {
  /** Human-readable field label (e.g. "Headquarters"). */
  field: string;
  /** What the engine claimed (null for an `ai_unaware` gap). */
  aiClaim: string | null;
  /** The verified value the engine should hold. */
  verifiedValue: string | null;
  /** Provenance of the verified value (e.g. "Wikidata"). */
  source: string | null;
  /** `contradiction` = engine asserted a wrong value; `ai_unaware` = no claim. */
  kind: 'contradiction' | 'ai_unaware';
}
export interface EngineKnowledgeAccuracy {
  /** Canonical model label, e.g. "ChatGPT". */
  engine: string;
  /** Maker company, e.g. "OpenAI". */
  maker: string;
  /** Maker entity page, e.g. "/entity/openai". */
  makerHref: string;
  evaluated: number;
  matches: number;
  mismatches: number;
  /** Fields the engine made no claim about (coverage gap, not an accuracy miss). */
  modelNulls: number;
  /** matches + mismatches — the accuracy denominator. */
  decidable: number;
  /** matches / decidable as 0–100, or null when nothing was decidable. */
  accuracyPct: number | null;
  corrections: KnowledgeAccuracyCorrection[];
}
export interface LlmKnowledgeAccuracy {
  entityId: string;
  available: true;
  computationVersion: string;
  /** Overall accuracy across all engines — the headline %. Null when nothing decidable. */
  accuracyPct: number | null;
  evaluated: number;
  matches: number;
  mismatches: number;
  modelNulls: number;
  decidable: number;
  enginesEvaluated: number;
  /** 95% Wilson interval over matches/decidable (Amendment 7). */
  confidence: ScoreConfidence | null;
  perEngine: EngineKnowledgeAccuracy[];
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type KnowledgeAccuracyResponse =
  | LlmKnowledgeAccuracy
  | { entityId: string; available: false; reason: 'no_knowledge_probes' | 'disabled' };

// ── AI Recommendation Potential (GET /entities/{id}/recommendation-potential) ─
export interface EnginePromptClassRead {
  /** Canonical model label (e.g. "ChatGPT"). Unknown engines pass through raw. */
  engine: string;
  /** Maker company (e.g. "OpenAI") when the engine id is canonical. */
  maker: string | null;
  /** Maker entity page href (e.g. "/entity/openai") when the engine id is canonical. */
  makerHref: string | null;
  trials: number;
  survived: number;
  /** survived / trials as 0..100 (null when no trials). */
  recommendationPct: number | null;
}
export interface PromptClassRead {
  classId: string;
  /** Public label (e.g. "Discovery"). */
  label: string;
  description: string;
  /** Illustrative — the probes use canonical scenarios, not this string. */
  example: string;
  /** True when derived from stored probes; false when framework-declared and unmeasured. */
  measured: boolean;
  reading: {
    trials: number;
    survived: number;
    /** survived / trials as 0..100. */
    recommendationPct: number;
    /** 95% Wilson interval on 0..100. */
    interval95?: [number, number];
    enginesEvaluated: number;
    lastObservedAt: string | null;
    perEngine: EnginePromptClassRead[];
  } | null;
}
export interface RecommendationPotential {
  entityId: string;
  available: true;
  computationVersion: string;
  /** Weighted-mean recommendation rate across measured classes (0..100). Null when nothing measured. */
  overallPct: number | null;
  trials: number;
  survived: number;
  classesEvaluated: number;
  /** 95% Wilson interval on the overall pct (Amendment-7-shaped). */
  confidence: ScoreConfidence | null;
  classes: PromptClassRead[];
  strongestClasses: PromptClassRead[];
  weakestClasses: PromptClassRead[];
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type RecommendationPotentialResponse =
  | RecommendationPotential
  | { entityId: string; available: false; reason: 'no_signal_yet' | 'entity_out_of_scope' | 'disabled' };

// ── Guest Intelligence (GET /entities/{id}/guest-intelligence) ────────────────
export interface CastCommentQuote {
  text: string;
  authorHandle: string | null;
  likeCount: number;
  publishedAt: string | null;
  platformCommentId: string;
}
export interface CastMember {
  entityId: string;
  entitySlug: string;
  entityName: string;
  role: string;
  linkConfidence: number | null;
  sentiment: {
    sampleSize: number;
    positivePct: number | null;
    negativePct: number | null;
  };
  topPraise: CastCommentQuote[];
  topCriticism: CastCommentQuote[];
  claimVerdicts: {
    claim: string;
    verdict: string;
    verifiedPosition: string | null;
    evidenceDate: string | null;
  }[];
  conflation: { reason: string; ambiguousComments: number } | null;
}
export interface EpisodeCastRead {
  episodeId: string;
  platform: string;
  platformId: string;
  title: string | null;
  publishedAt: string | null;
  videoSentiment: {
    sampleSize: number;
    positivePct: number | null;
    negativePct: number | null;
  };
  totalComments: number;
  cast: CastMember[];
}
export interface GuestImpactRow {
  entityId: string;
  entitySlug: string;
  entityName: string;
  appearances: number;
  meanVisibilityDelta: number | null;
  meanSentimentDelta: number | null;
  latestAppearanceAt: string | null;
}
export interface GuestImpactSummary {
  windowDays: number;
  totalAppearances: number;
  guests: GuestImpactRow[];
  topLifters: GuestImpactRow[];
  topDrags: GuestImpactRow[];
}
export interface GuestIntelligence {
  entityId: string;
  available: true;
  computationVersion: string;
  computedAt: string;
  latestEpisode: EpisodeCastRead | null;
  recentEpisodes: EpisodeCastRead[];
  guestImpact: GuestImpactSummary;
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type GuestIntelligenceResponse =
  | GuestIntelligence
  | {
      entityId: string;
      available: false;
      reason: 'no_episodes' | 'no_signal_yet' | 'entity_out_of_scope' | 'disabled';
    };

// ── Episode → Engine Adoption Lag (GET /entities/{id}/episode-adoption-lag) ──
export interface EnginePerEpisodeLag {
  engine: string;
  maker: string | null;
  makerHref: string | null;
  adoptionLagDays: number | null;
  firstMentionAt: string | null;
  snapshotsInspected: number;
}
export interface EpisodeAdoptionRead {
  episodeId: string;
  platform: string;
  platformId: string;
  title: string | null;
  publishedAt: string | null;
  perEngine: EnginePerEpisodeLag[];
  meanAdoptionLagDays: number | null;
  enginesAdopted: number;
  enginesEvaluated: number;
}
export interface EngineAdoptionSummary {
  engine: string;
  maker: string | null;
  makerHref: string | null;
  episodesAdopted: number;
  episodesEvaluated: number;
  meanAdoptionLagDays: number | null;
  medianAdoptionLagDays: number | null;
}
export interface EpisodeAdoptionLag {
  entityId: string;
  available: true;
  computationVersion: string;
  computedAt: string;
  windowDays: number;
  episodes: EpisodeAdoptionRead[];
  perEngine: EngineAdoptionSummary[];
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type EpisodeAdoptionLagResponse =
  | EpisodeAdoptionLag
  | { entityId: string; available: false; reason: 'no_episodes' | 'no_signal_yet' | 'entity_out_of_scope' | 'disabled' };

// ── SERP vs AI (GET /entities/{id}/serp-vs-ai) ───────────────────────────────
export interface SerpVsAiIndexContribution {
  label: string;
  /** 0..100 space. */
  value: number;
  /** Fraction of the composite this contribution accounts for. */
  weight: number;
}
export interface SerpVsAiSideRead {
  /** 0..100 weighted composite; null when the caller has no data on that side. */
  index: number | null;
  measured: boolean;
  contributions: SerpVsAiIndexContribution[];
}
export interface SerpVsAiEngineMention {
  /** Canonical model label (e.g. "ChatGPT"). Unknown engines pass through raw. */
  engine: string;
  maker: string | null;
  makerHref: string | null;
  mentioned: boolean;
  mentionPosition: number | null;
  recommendationLevel: string;
  citedUrlCount: number;
}
export interface SerpVsAiKeyword {
  keyword: string;
  position: number;
  intent: string | null;
}
export type SerpVsAiGapClass =
  | 'serp_dominant'
  | 'ai_dominant'
  | 'aligned'
  | 'both_weak'
  | 'both_strong';
export interface SerpVsAiVerdict {
  gapClass: SerpVsAiGapClass;
  /** SERP − AI on 0..100 space (positive = SERP dominant). Null when one side unmeasured. */
  gap: number | null;
  headline: string;
  insight: string;
}
export interface SerpVsAiGoogleAiSurfacePresence {
  /** 'ai_overview' | 'ai_mode' */
  surface: string;
  /** "Google AI Overviews" | "Google AI Mode" */
  label: string;
  queries: number;
  answersPresent: number;
  mentioned: number;
  ownDomainCited: number;
}
/**
 * Google AI Overviews / AI Mode answer presence from the latest stored Google
 * AI answers run. A search-surface read alongside the five-engine table —
 * never part of either composite index.
 */
export interface SerpVsAiGoogleAiPresence {
  surfaces: SerpVsAiGoogleAiSurfacePresence[];
  collectedAt: string;
}
export interface SerpVsAi {
  entityId: string;
  available: true;
  computationVersion: string;
  serp: SerpVsAiSideRead;
  ai: SerpVsAiSideRead;
  verdict: SerpVsAiVerdict;
  engines: SerpVsAiEngineMention[];
  /** Null when the entity has no stored Google AI answers run. */
  googleAi: SerpVsAiGoogleAiPresence | null;
  llmKnowledgeAccuracyPct: number | null;
  topKeywords: SerpVsAiKeyword[];
  lastObservedAt: string | null;
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type SerpVsAiResponse =
  | SerpVsAi
  | { entityId: string; available: false; reason: 'no_signal_yet' | 'entity_not_found' | 'disabled' };

// ── Google AI Answers (GET /entities/{id}/google-ai-answers) ─────────────────
export interface GoogleAiCitation {
  domain: string | null;
  url: string | null;
  title: string | null;
  source: string | null;
  /** Website text Google's AI used to generate the answer (when returned). */
  quotedText: string | null;
}
export interface GoogleAiRead {
  /** 'ai_overview' | 'ai_mode' */
  surface: string;
  /** "Google AI Overviews" | "Google AI Mode" */
  surfaceLabel: string;
  /** 'brand' | 'evaluation' | 'discovery' */
  queryClass: string;
  query: string;
  answerPresent: boolean;
  answerText: string;
  entityMentioned: boolean;
  mentionOrder: number | null;
  /** 0–100 (50 = neutral) around the entity's mentions; null when not mentioned. */
  sentimentScore: number | null;
  citations: GoogleAiCitation[];
  citedDomains: string[];
  entityDomainCited: boolean;
  competitorsMentioned: Array<{ slug: string | null; name: string; mentionOrder: number }>;
  collectedAt: string;
}
export interface GoogleAiSurfaceSummary {
  queries: number;
  answersPresent: number;
  mentioned: number;
  ownDomainCited: number;
  meanSentiment: number | null;
  competitorsSeen: string[];
}
export interface GoogleAiAnswers {
  entityId: string;
  available: true;
  computationVersion: string;
  collectedAt: string;
  runCount: number;
  aiOverview: GoogleAiSurfaceSummary;
  aiMode: GoogleAiSurfaceSummary;
  reads: GoogleAiRead[];
  methodology: string;
  provenance: { issuer: string; methodologyUrl: string; note: string };
}
export type GoogleAiAnswersResponse =
  | GoogleAiAnswers
  | { entityId: string; available: false; reason: 'no_signal_yet' | 'disabled' };

// ── Data completeness / self-check (GET /entities/{id}/data-completeness) ─────
export interface DataCompletenessPerLlm {
  engine: string;
  completenessPct: number | null;
  weightedCompletenessPct: number | null;
  truthGapPct: number | null;
  probingHealthy: boolean;
  wants: string[];
}
export interface DataCompletenessView {
  available: true;
  entitySlug: string;
  canonicalName: string;
  lastComputedAt: string;
  schemaConformant: boolean;
  schemaViolations: number;
  perLlm: DataCompletenessPerLlm[];
  topGaps: Array<{ field: string; importance: number }>;
  /** Present only with `?lag=1`. */
  ingestionLag?: unknown;
}
export type DataCompletenessResponse =
  | DataCompletenessView
  | { available: false; reason: string };

// ── Cohort (GET /entities/{id}/cohort + /cohort/{cohortId}/rankings) ─────────
export interface EntityCohortResponse {
  cohorts: EntityCohortMembership[];
  positions: CohortPositionSummary[];
}
/** Note: the rankings endpoint returns snake_case keys, mirrored faithfully. */
export interface CohortRankingEntry {
  rank: number;
  entity_id: string;
  entity_name: string;
  entity_slug: string;
  value: number | null;
  delta: number | null;
  percentile: number | null;
}
export interface CohortRankingsResponse {
  cohort: { id: string; name: string };
  dimension: string;
  entity_count: number;
  rankings: CohortRankingEntry[];
  computed_at: string;
}

// ── Response envelope ────────────────────────────────────────────────────────

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface BillingMeta {
  creditsUsed: number;
  creditsRemaining: number | null;
  tier: ApiTier;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  apiVersion: string;
  rateLimit?: RateLimitMeta;
  billing?: BillingMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  /** Present on ENTITY_NOT_RESOLVED — ranked candidate matches for the query. */
  candidates?: Array<{
    entityId: string;
    canonicalName: string;
    score: number;
  }>;
}

export interface ApiResponse<T> {
  data: T | null;
  meta: ResponseMeta;
  errors: ApiError[];
}

// ── Grounding Check ─────────────────────────────────────────────────────────

export type GroundingVerdict = 'supported' | 'contradicted' | 'unverifiable';

export type GroundingRelationship = 'exact' | 'equivalent' | 'narrowing' | 'conflict';

export interface GroundingCitation {
  /** Deep link into the public Knowledge Statement backing the verdict. */
  url: string;
  source: string;
  asOf: string | null;
}

export interface GroundingAssertionVerdict {
  /** The clause of the statement the assertion was extracted from. */
  text: string;
  field: string | null;
  canonicalFieldId: string | null;
  claimedValue: string;
  verdict: GroundingVerdict;
  relationship: GroundingRelationship | null;
  /** 0–100 — the verified fact's stored confidence; null when unverifiable. */
  confidence: number | null;
  verifiedValue: string | null;
  citation: GroundingCitation | null;
  reason: 'field_not_in_verified_record' | 'unrecognized_assertion' | null;
}

export interface GroundingCheckResult {
  entityId: string;
  entity: string;
  available: true;
  /** Overall roll-up — worst verdict wins (contradicted > unverifiable > supported). */
  verdict: GroundingVerdict;
  confidence: number | null;
  assertions: GroundingAssertionVerdict[];
  checkedAssertions: number;
  unverifiableReason: 'no_recognized_assertion' | 'no_decidable_assertion' | null;
  computationVersion: string;
  checkedAt: string;
  provenance: { verifiedRecordUrl: string; methodologyUrl: string; note: string };
}

export interface GroundingCheckUnavailable {
  entityId: string;
  available: false;
  reason: 'disabled' | 'no_verified_record';
}

export type GroundingCheckResponse = GroundingCheckResult | GroundingCheckUnavailable;

// ─────────────────────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────────────────────

export interface EntidexClientOptions {
  /**
   * API key (`entx_…`). Required for live calls — a **free** key still unlocks
   * the free, rate-limited tier; keyless requests are rejected (every tier needs
   * a key for per-key rate-limiting + attribution, CANON 1.22). Create one at
   * https://entidex.com/developers. Optional in the type only so a mock `fetch`
   * can be injected in tests.
   */
  apiKey?: string;
  /** Override the API base URL. Default: `https://entidex.com/api/v1`. */
  baseUrl?: string;
  /** Custom fetch implementation (e.g. for Node <18 or testing). */
  fetch?: typeof fetch;
  /**
   * Per-request timeout in milliseconds. When set, a request that does not
   * resolve in time is aborted and rejects with an `EntidexApiError`
   * (`code: 'TIMEOUT'`). Unset = no client-side timeout (default).
   */
  timeoutMs?: number;
}

/** Thrown when the API returns an error envelope or a non-2xx status. */
export class EntidexApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors: ApiError[];
  constructor(message: string, code: string, status: number, errors: ApiError[]) {
    super(message);
    this.name = 'EntidexApiError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

const DEFAULT_BASE_URL = 'https://entidex.com/api/v1';

type QueryParams = Record<string, string | number | undefined>;

export class EntidexClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number | undefined;

  constructor(opts: EntidexClientOptions = {}) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    const f = opts.fetch ?? globalThis.fetch;
    if (typeof f !== 'function') {
      throw new Error('No fetch implementation available — pass `fetch` in options (Node <18).');
    }
    this.fetchImpl = f;
    this.timeoutMs = opts.timeoutMs;
  }

  /**
   * Low-level GET against any `/v1` endpoint. Returns the unwrapped `data`
   * payload, or throws {@link EntidexApiError}. Use this for endpoints without
   * a dedicated helper.
   */
  get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  /**
   * Low-level POST against any `/v1` endpoint with a JSON body. Returns the
   * unwrapped `data` payload, or throws {@link EntidexApiError}.
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, undefined, body);
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    params?: QueryParams,
    requestBody?: unknown,
  ): Promise<T> {
    const url = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`));
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    if (requestBody !== undefined) headers['Content-Type'] = 'application/json';

    // Optional client-side timeout: abort a stalled request so callers are not
    // hung indefinitely on a non-responding server/connection.
    const controller = this.timeoutMs != null ? new AbortController() : null;
    const timer = controller
      ? setTimeout(() => controller.abort(), this.timeoutMs)
      : null;

    let res: Response;
    try {
      res = await this.fetchImpl(url.toString(), {
        method,
        headers,
        ...(requestBody !== undefined ? { body: JSON.stringify(requestBody) } : {}),
        ...(controller ? { signal: controller.signal } : {}),
      });
    } catch (err) {
      if (controller?.signal.aborted) {
        throw new EntidexApiError(
          `Request timed out after ${this.timeoutMs}ms`,
          'TIMEOUT',
          0,
          [],
        );
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    let body: ApiResponse<T> | null = null;
    try {
      body = (await res.json()) as ApiResponse<T>;
    } catch {
      body = null;
    }

    const firstError = body?.errors?.[0];
    if (!res.ok || firstError) {
      throw new EntidexApiError(
        firstError?.message ?? `Entidex request failed with status ${res.status}`,
        firstError?.code ?? 'HTTP_ERROR',
        res.status,
        body?.errors ?? [],
      );
    }
    if (!body) {
      throw new EntidexApiError('Empty or non-JSON response from Entidex.', 'INVALID_RESPONSE', res.status, []);
    }
    return body.data as T;
  }

  /**
   * Resolve a raw string (name, alias, mention) to the canonical entity profile.
   * `GET /entities/resolve` returns the resolved Entity (lite on a free key, full
   * on layer_1_profile+) — NOT a reconciliation candidate set. For id + confidence
   * band + candidates over many inputs, use the batch reconciliation endpoint.
   */
  resolve(query: string): Promise<Entity> {
    return this.get<Entity>('/entities/resolve', { q: query });
  }

  /**
   * Creator Resolution: resolve a creator/podcast NAME or any one profile LINK to
   * the single canonical creator — every cross-verified platform handle with
   * provenance + confidence, the headline signals, and the signed-record link.
   * Three-state `band`: confirmed (one tracked creator) / ambiguous (a picker,
   * incl. Wikidata namesakes) / not_found. `GET /creators/resolve`. layer_1_profile+.
   */
  resolveCreator(query: string): Promise<CreatorResolutionResult> {
    return this.get<CreatorResolutionResult>('/creators/resolve', { q: query });
  }

  /**
   * Fetch the canonical entity profile. On the free tier this returns a lite
   * projection (identity + cached headline signals); paid tiers return the full
   * Entity. Pass `include` for claims / completeness / neighbourhood.
   */
  getEntity(
    idOrSlug: string,
    opts: { include?: Array<'claims' | 'completeness' | 'neighbourhood'> } = {},
  ): Promise<Entity> {
    return this.get<Entity>(
      `/entities/${encodeURIComponent(idOrSlug)}`,
      opts.include && opts.include.length > 0 ? { include: opts.include.join(',') } : undefined,
    );
  }

  /**
   * The complete, categorized intelligence record in one call. Depth widens
   * with your tier (free → identity + categorization + headline + coverage;
   * higher tiers add scores, perception, derived insights, drift, lifecycle,
   * relationships, decision survival, cohort). Withheld sections are listed in
   * `record.meta.withheld`.
   */
  complete(idOrSlug: string): Promise<EntityComplete> {
    return this.get<EntityComplete>(`/entities/${encodeURIComponent(idOrSlug)}/complete`);
  }

  /** All score dimensions (AI Visibility, Sentiment, Share of Voice, Trust Stack, …). Requires an insight-tier key. */
  insights(idOrSlug: string): Promise<Partial<Record<ScoreDimension, Score>>> {
    return this.get<Partial<Record<ScoreDimension, Score>>>(`/entities/${encodeURIComponent(idOrSlug)}/insights`);
  }

  // ── Composable read datasets — one typed helper per /v1 endpoint ───────────

  /** Detected drift events, newest first. Requires layer_2_insight+. */
  drift(idOrSlug: string, opts: { limit?: number; days?: number } = {}): Promise<DriftEvent[]> {
    return this.get<DriftEvent[]>(`/entities/${encodeURIComponent(idOrSlug)}/drift`, {
      limit: opts.limit,
      days: opts.days,
    });
  }

  /** Latest stock-market reading, or `null` when the entity (or its public owner) is unlisted. */
  markets(idOrSlug: string): Promise<PublicMarketData | null> {
    return this.get<PublicMarketData | null>(`/entities/${encodeURIComponent(idOrSlug)}/markets`);
  }

  /** Stored end-of-day market-reading series. */
  marketsHistory(idOrSlug: string): Promise<PublicMarketData[]> {
    return this.get<PublicMarketData[]>(`/entities/${encodeURIComponent(idOrSlug)}/markets`, {
      history: 'true',
    });
  }

  /** Time-series score history with per-dimension deltas + trend. layer_1_profile+. */
  scoreHistory(
    idOrSlug: string,
    opts: { dimension?: ScoreDimension | 'all'; days?: number } = {},
  ): Promise<ScoreHistoryResponse> {
    return this.get<ScoreHistoryResponse>(`/entities/${encodeURIComponent(idOrSlug)}/score-history`, {
      dimension: opts.dimension,
      days: opts.days,
    });
  }

  /** Momentum / acceleration / trajectory per dimension, with sparklines. */
  trajectory(idOrSlug: string): Promise<TrajectoryResponse> {
    return this.get<TrajectoryResponse>(`/entities/${encodeURIComponent(idOrSlug)}/trajectory`);
  }

  /** Lifecycle stage (nine-state classifier) with drivers + predicted next. layer_1_profile+. */
  lifecycle(idOrSlug: string): Promise<LifecycleView> {
    return this.get<LifecycleView>(`/entities/${encodeURIComponent(idOrSlug)}/lifecycle`);
  }

  /**
   * Unified chronological timeline — score movements, drift events, lifecycle
   * transitions, X inflection/amplification, Claim Truth transitions +
   * narrative divergence, and captured AI-engine responses + Decision Survival
   * runs — interleaved into one dated stream (newest first), each with cause
   * attribution and an optional `evidence` panel (reply excerpts / facts /
   * deep-dive links). layer_2_insight+.
   */
  timeline(
    idOrSlug: string,
    opts: { days?: number; limit?: number } = {},
  ): Promise<EntityTimeline> {
    return this.get<EntityTimeline>(`/entities/${encodeURIComponent(idOrSlug)}/timeline`, {
      days: opts.days,
      limit: opts.limit,
    });
  }

  /** Cross-surface consensus / divergence, plus the over-time trend matrix. */
  consensusMap(idOrSlug: string): Promise<ConsensusMapResponse> {
    return this.get<ConsensusMapResponse>(`/entities/${encodeURIComponent(idOrSlug)}/consensus-map`);
  }

  /** Decision Survival Score across multi-turn AI conversations. layer_2_insight+. */
  decisionSurvival(
    idOrSlug: string,
    opts: { scenario?: string } = {},
  ): Promise<DecisionSurvivalResponse> {
    return this.get<DecisionSurvivalResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/decision-survival`,
      { scenario: opts.scenario },
    );
  }

  /** AI Ecosystem read — per-engine grounded fit + strategic narrative. layer_1_profile+. */
  ecosystem(idOrSlug: string): Promise<PublicEcosystem> {
    return this.get<PublicEcosystem>(`/entities/${encodeURIComponent(idOrSlug)}/ecosystem`);
  }

  /** Entity Core Intelligence — ten authority/readability scores + live-web grounding. layer_2_insight+. Throws 404 when never run. */
  coreIntelligence(idOrSlug: string): Promise<CoreIntelligence> {
    return this.get<CoreIntelligence>(`/entities/${encodeURIComponent(idOrSlug)}/core-intelligence`);
  }

  /** Latest X (social surface) sentiment read, or `null`. layer_2_insight+. */
  xSentiment(idOrSlug: string): Promise<XSentimentSnapshot | null> {
    return this.get<XSentimentSnapshot | null>(`/entities/${encodeURIComponent(idOrSlug)}/x-sentiment`);
  }

  /** Stored X-sentiment series (the early-warning curve). */
  xSentimentHistory(idOrSlug: string): Promise<XSentimentSnapshot[]> {
    return this.get<XSentimentSnapshot[]>(`/entities/${encodeURIComponent(idOrSlug)}/x-sentiment`, {
      history: 'true',
    });
  }

  /** Entity Knowledge Statement — verified facts + AI-engine corrections + accuracy. layer_1_profile+. */
  knowledge(idOrSlug: string): Promise<KnowledgeStatement> {
    return this.get<KnowledgeStatement>(`/entities/${encodeURIComponent(idOrSlug)}/ground-truth`);
  }

  /** Alias of {@link knowledge} — the underlying endpoint is `/ground-truth`. */
  groundTruth(idOrSlug: string): Promise<KnowledgeStatement> {
    return this.knowledge(idOrSlug);
  }

  /**
   * Grounding Packet — the named, free-tier grounding payload over the verified
   * record: deterministic facts + corrections + Ed25519-signed provenance.
   * Fetch at the top of any agent/RAG workflow that answers about the entity.
   * Free tier.
   */
  groundingPacket(idOrSlug: string): Promise<GroundingPacket> {
    return this.get<GroundingPacket>(
      `/entities/${encodeURIComponent(idOrSlug)}/grounding-packet`,
    );
  }

  /**
   * GroundingMetadata-shaped projection of the Grounding Packet
   * (groundingChunks / groundingSupports) — drop-in for pipelines built
   * against Google Vertex grounding shapes. Free tier.
   */
  groundingMetadata(idOrSlug: string): Promise<GroundingMetadataProjection> {
    return this.get<GroundingMetadataProjection>(
      `/entities/${encodeURIComponent(idOrSlug)}/grounding-packet`,
      { format: 'grounding-metadata' },
    );
  }

  /**
   * LLM Knowledge Accuracy — how accurately each AI engine knows the entity vs
   * the verified record: an overall accuracy % (95% Wilson CI) plus a per-engine
   * breakdown and the exact fields each engine gets wrong. layer_1_profile+.
   */
  knowledgeAccuracy(idOrSlug: string): Promise<KnowledgeAccuracyResponse> {
    return this.get<KnowledgeAccuracyResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/knowledge-accuracy`,
    );
  }

  /**
   * AI Recommendation Potential — per-prompt-class breakdown of how likely AI
   * engines are to recommend the entity, projected from stored Decision Survival
   * probes onto the canonical prompt-class taxonomy. layer_1_profile+.
   */
  recommendationPotential(idOrSlug: string): Promise<RecommendationPotentialResponse> {
    return this.get<RecommendationPotentialResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/recommendation-potential`,
    );
  }

  /**
   * Guest Intelligence — per-episode multi-role read (video sentiment, per-cast
   * sentiment, top praise + criticism, Claim Truth verdicts, conflation warnings)
   * + Guest Impact roll-up (which guest appearances moved AI Visibility). Coded
   * reduction over stored comment / episode / score / claim-truth stores.
   * layer_1_profile+.
   */
  guestIntelligence(idOrSlug: string): Promise<GuestIntelligenceResponse> {
    return this.get<GuestIntelligenceResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/guest-intelligence`,
    );
  }

  /**
   * Grounding Check — POST a statement about the entity and get coded verdicts
   * (supported | contradicted | unverifiable) with confidence and citations
   * against the signed verified record. Granularity differences ("Austin" vs
   * "Austin, Texas") are supported; out-of-record assertions are unverifiable,
   * never guessed. Free tier (rate-limited) — the guardrail hook.
   */
  groundingCheck(idOrSlug: string, statement: string): Promise<GroundingCheckResponse> {
    return this.post<GroundingCheckResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/grounding-check`,
      { statement },
    );
  }

  /**
   * Episode → Engine Adoption Lag — for each recent episode a show/creator
   * publishes, how long until each of the five canonical AI engines can name
   * it. Coded text-scan over stored knowledge-probe snapshots. Zero LLM cost.
   * layer_1_profile+.
   */
  episodeAdoptionLag(idOrSlug: string): Promise<EpisodeAdoptionLagResponse> {
    return this.get<EpisodeAdoptionLagResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/episode-adoption-lag`,
    );
  }

  /**
   * SERP vs AI — how the entity performs in traditional search (SEO health,
   * domain rank, organic keywords + traffic, top ranked keywords) compared with
   * how AI engines actually surface it (headline AI Visibility, Share of Voice,
   * per-engine mention breakdown, LLM Knowledge Accuracy). Coded reducer over
   * the SEO/GEO audit + score snapshots + platformSignals + LLM Knowledge
   * Accuracy. Zero LLM cost. layer_1_profile+.
   */
  serpVsAi(idOrSlug: string): Promise<SerpVsAiResponse> {
    return this.get<SerpVsAiResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/serp-vs-ai`,
    );
  }

  /**
   * Google AI Answers — what Google AI Overviews + Google AI Mode say about
   * the entity per query class: the generated-answer text, every citation
   * (source, domain, URL, quoted text), mention + order, sentiment around the
   * mentions, competitor mentions, and own-domain-cited status. Deterministic
   * extraction over stored runs — zero LLM cost. layer_1_profile+.
   */
  googleAiAnswers(idOrSlug: string): Promise<GoogleAiAnswersResponse> {
    return this.get<GoogleAiAnswersResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/google-ai-answers`,
    );
  }

  /** Per-engine data-completeness / self-check view. layer_2_insight+. */
  dataCompleteness(
    idOrSlug: string,
    opts: { lag?: boolean } = {},
  ): Promise<DataCompletenessResponse> {
    return this.get<DataCompletenessResponse>(
      `/entities/${encodeURIComponent(idOrSlug)}/data-completeness`,
      { lag: opts.lag ? 1 : undefined },
    );
  }

  /** Authenticity sub-signal (creator / social-account types only). */
  authenticity(idOrSlug: string): Promise<AuthenticitySummary> {
    return this.get<AuthenticitySummary>(`/entities/${encodeURIComponent(idOrSlug)}/authenticity`);
  }

  /** Cohorts this entity belongs to + its CohortPosition in each. Agency / layer_4_cohort. */
  cohort(idOrSlug: string): Promise<EntityCohortResponse> {
    return this.get<EntityCohortResponse>(`/entities/${encodeURIComponent(idOrSlug)}/cohort`);
  }

  /** Ranked leaderboard for a cohort. Agency / layer_4_cohort. */
  cohortRankings(
    cohortId: string,
    opts: { dimension?: 'visibility' | 'sentiment' | 'shareOfVoice' } = {},
  ): Promise<CohortRankingsResponse> {
    return this.get<CohortRankingsResponse>(`/cohort/${encodeURIComponent(cohortId)}/rankings`, {
      dimension: opts.dimension,
    });
  }
}

export default EntidexClient;
