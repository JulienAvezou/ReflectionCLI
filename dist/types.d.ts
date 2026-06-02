/**
 * Core type definitions for git-reflect
 */
export interface Answer {
    question: string;
    answer: string;
}
export interface Answers {
    intent: string;
    problemSolved: string;
    learned: string;
    wouldDoDifferently: string;
    confidence: string;
    testing: string;
    technicalDebt: string;
}
export interface ReflectionEntry {
    timestamp: string;
    date: string;
    branchName: string;
    commitMessage: string;
    answers: Answers;
}
export type DebtStatus = 'open' | 'resolved';
export interface ComprehensionDebtItem {
    id: string;
    title: string;
    context?: string;
    project?: string;
    tags: string[];
    sourceReflection?: string;
    status: DebtStatus;
    createdAt: string;
    date: string;
    resolvedAt?: string;
}
export interface LearningSections {
    whatIUnderstood: string;
    whatAiHelpedWith: string;
    whatIMayHaveOutsourcedToAi: string;
    whatIStillDoNotFullyUnderstand: string;
    reusablePattern: string;
    explainBackQuestion: string;
    nextLearningAction: string;
}
export interface LearningEntry {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    source?: string;
    sections: LearningSections;
}
export type ExplainBackAssessment = 'strong' | 'incomplete' | 'weak';
export interface ExplainBackEntry {
    id: string;
    timestamp: string;
    date: string;
    topic: string;
    project?: string;
    canExplainWithoutCode: string;
    tradeoff: string;
    changedAssumption: string;
    explanationForDeveloper: string;
    assessment: ExplainBackAssessment;
    createdDebtId?: string;
}
export type ThinkingMode = 'Explore' | 'Challenge' | 'Decide' | 'Audit' | 'Reflect';
export interface ThinkingModeSession {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    goal: string;
    recommendedMode: ThinkingMode;
    reason: string;
    prompts: string[];
    saved: boolean;
}
export type ThinkingScoreDimension = 'understanding' | 'verification' | 'reflection' | 'decisionQuality' | 'aiDependency';
export interface ThinkingScoreEntry {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    dimensions: Record<ThinkingScoreDimension, number>;
    total: number;
    strongest: ThinkingScoreDimension;
    weakest: ThinkingScoreDimension;
    improvementAction: string;
}
export type OutsourcingRisk = 'Low' | 'Medium' | 'High';
export interface OutsourcingAuditEntry {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    answers: {
        aiGenerated: boolean;
        verifiedOutput: boolean;
        canExplain: boolean;
        testedEdgeCases: boolean;
        comparedAlternatives: boolean;
        challengedSuggestion: boolean;
    };
    risk: OutsourcingRisk;
    riskAreas: string[];
    suggestedNextAction: string;
    createdExplainBackId?: string;
    createdDebtId?: string;
}
export interface DecisionReview {
    reviewedAt: string;
    whatHappened: string;
    wasGoodDecision: string;
    whatChanged: string;
    chooseSameAgain: string;
    lessonsLearned: string;
}
export interface DecisionEntry {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    tags: string[];
    title: string;
    context: string;
    optionsConsidered: string[];
    chosenOption: string;
    reasoning: string;
    tradeoffs: string;
    expectedOutcome: string;
    reviewDate: string;
    review?: DecisionReview;
}
export interface HeatmapAreaScore {
    area: string;
    score: number;
}
export interface HeatmapSnapshot {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    scale: 5 | 10;
    areas: HeatmapAreaScore[];
    weakestAreas: HeatmapAreaScore[];
    suggestedFocus: string;
}
export type CognitiveArchetype = 'AI Autopilot' | 'AI Assistant' | 'AI Challenger' | 'AI Architect';
export interface ArchetypeResult {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    scores: Record<CognitiveArchetype, number>;
    primary: CognitiveArchetype;
    secondary?: CognitiveArchetype;
    explanation: string;
    improvementActions: string[];
}
export interface PromptReflectionEntry {
    id: string;
    timestamp: string;
    date: string;
    project?: string;
    tags: string[];
    promptUsed: string;
    goal: string;
    aiOutput: string;
    worked: string;
    unclear: string;
    hiddenAssumptions: string;
    improvedPrompt: string;
    lessonsLearned: string;
}
export interface LogStats {
    totalCommits: number;
    projectStartDate: string;
}
export interface ReflectionLog {
    version: string;
    entries: ReflectionEntry[];
    comprehensionDebt: ComprehensionDebtItem[];
    learningEntries: LearningEntry[];
    explainBackEntries: ExplainBackEntry[];
    thinkingModeSessions: ThinkingModeSession[];
    thinkingScores: ThinkingScoreEntry[];
    outsourcingAudits: OutsourcingAuditEntry[];
    decisionEntries: DecisionEntry[];
    heatmapSnapshots: HeatmapSnapshot[];
    archetypeResults: ArchetypeResult[];
    promptReflections: PromptReflectionEntry[];
    stats: LogStats;
}
export interface Question {
    key: keyof Answers;
    prompt: string;
    hint?: string;
}
//# sourceMappingURL=types.d.ts.map