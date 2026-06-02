/**
 * Storage module for persisting reflection entries to log.json
 */
import { ArchetypeResult, ComprehensionDebtItem, DecisionEntry, DecisionReview, ExplainBackEntry, HeatmapSnapshot, LearningEntry, OutsourcingAuditEntry, PromptReflectionEntry, ReflectionLog, ReflectionEntry, Answers, ThinkingModeSession, ThinkingScoreEntry } from './types';
/**
 * Get the git-reflect directory path
 */
export declare function getGitReflectDir(): string;
/**
 * Get the log file path
 */
export declare function getLogFilePath(): string;
/**
 * Find the .git directory by traversing up the file tree
 */
export declare function findGitDir(): string | null;
/**
 * Ensure the git-reflect directory exists
 */
export declare function ensureGitReflectDir(): void;
/**
 * Read the reflection log, creating it if it doesn't exist
 */
export declare function readLog(): ReflectionLog;
/**
 * Write the reflection log to disk
 */
export declare function writeLog(log: ReflectionLog): void;
/**
 * Add a new reflection entry to the log
 */
export declare function addEntry(entry: ReflectionEntry): void;
export declare function createDebtItem(input: {
    title: string;
    context?: string;
    project?: string;
    tags?: string[];
    sourceReflection?: string;
}): ComprehensionDebtItem;
export declare function addDebtItem(item: ComprehensionDebtItem): void;
export declare function listDebtItems(status?: 'open' | 'resolved' | 'all'): ComprehensionDebtItem[];
export declare function getDebtItem(id: string): ComprehensionDebtItem | null;
export declare function resolveDebtItem(id: string): ComprehensionDebtItem;
export declare function createLearningEntry(input: {
    project?: string;
    source?: string;
    sections: LearningEntry['sections'];
}): LearningEntry;
export declare function addLearningEntry(entry: LearningEntry): void;
export declare function createExplainBackEntry(input: {
    topic: string;
    project?: string;
    canExplainWithoutCode: string;
    tradeoff: string;
    changedAssumption: string;
    explanationForDeveloper: string;
    assessment: ExplainBackEntry['assessment'];
    createdDebtId?: string;
}): ExplainBackEntry;
export declare function addExplainBackEntry(entry: ExplainBackEntry): void;
export declare function createThinkingModeSession(input: {
    project?: string;
    goal: string;
    recommendedMode: ThinkingModeSession['recommendedMode'];
    reason: string;
    prompts: string[];
    saved?: boolean;
}): ThinkingModeSession;
export declare function addThinkingModeSession(entry: ThinkingModeSession): void;
export declare function createThinkingScoreEntry(input: {
    project?: string;
    dimensions: ThinkingScoreEntry['dimensions'];
    total: number;
    strongest: ThinkingScoreEntry['strongest'];
    weakest: ThinkingScoreEntry['weakest'];
    improvementAction: string;
}): ThinkingScoreEntry;
export declare function addThinkingScoreEntry(entry: ThinkingScoreEntry): void;
export declare function createOutsourcingAuditEntry(input: {
    project?: string;
    answers: OutsourcingAuditEntry['answers'];
    risk: OutsourcingAuditEntry['risk'];
    riskAreas: string[];
    suggestedNextAction: string;
    createdExplainBackId?: string;
    createdDebtId?: string;
}): OutsourcingAuditEntry;
export declare function addOutsourcingAuditEntry(entry: OutsourcingAuditEntry): void;
export declare function createDecisionEntry(input: {
    project?: string;
    tags?: string[];
    title: string;
    context: string;
    optionsConsidered: string[];
    chosenOption: string;
    reasoning: string;
    tradeoffs: string;
    expectedOutcome: string;
    reviewDate: string;
}): DecisionEntry;
export declare function addDecisionEntry(entry: DecisionEntry): void;
export declare function listDecisionEntries(): DecisionEntry[];
export declare function getDecisionEntry(id: string): DecisionEntry | null;
export declare function addDecisionReview(id: string, review: DecisionReview): DecisionEntry;
export declare function createHeatmapSnapshot(input: {
    project?: string;
    scale: HeatmapSnapshot['scale'];
    areas: HeatmapSnapshot['areas'];
    weakestAreas: HeatmapSnapshot['weakestAreas'];
    suggestedFocus: string;
}): HeatmapSnapshot;
export declare function addHeatmapSnapshot(entry: HeatmapSnapshot): void;
export declare function getLatestHeatmapSnapshot(project?: string): HeatmapSnapshot | null;
export declare function createArchetypeResult(input: {
    project?: string;
    scores: ArchetypeResult['scores'];
    primary: ArchetypeResult['primary'];
    secondary?: ArchetypeResult['secondary'];
    explanation: string;
    improvementActions: string[];
}): ArchetypeResult;
export declare function addArchetypeResult(entry: ArchetypeResult): void;
export declare function createPromptReflectionEntry(input: {
    project?: string;
    tags?: string[];
    promptUsed: string;
    goal: string;
    aiOutput: string;
    worked: string;
    unclear: string;
    hiddenAssumptions: string;
    improvedPrompt: string;
    lessonsLearned: string;
}): PromptReflectionEntry;
export declare function addPromptReflectionEntry(entry: PromptReflectionEntry): void;
/**
 * Create a reflection entry
 */
export declare function createEntry(branchName: string, commitMessage: string, answers: Answers): ReflectionEntry;
/**
 * Get the latest reflection entry
 */
export declare function getLatestEntry(): ReflectionEntry | null;
//# sourceMappingURL=storage.d.ts.map