import { ArchetypeResult, ComprehensionDebtItem, DecisionEntry, ExplainBackEntry, HeatmapSnapshot, LearningEntry, OutsourcingAuditEntry, PromptReflectionEntry, ThinkingModeSession, ThinkingScoreEntry } from './types';
export declare function formatTags(tags: string[]): string;
export declare function formatDebtList(items: ComprehensionDebtItem[]): string;
export declare function formatDebtItem(item: ComprehensionDebtItem): string;
export declare function formatLearningEntry(entry: LearningEntry): string;
export declare function formatExplainBackEntry(entry: ExplainBackEntry): string;
export declare function formatThinkingModeSession(entry: ThinkingModeSession): string;
export declare function formatThinkingScore(entry: ThinkingScoreEntry): string;
export declare function formatOutsourcingAudit(entry: OutsourcingAuditEntry): string;
export declare function formatDecisionList(entries: DecisionEntry[]): string;
export declare function formatDecision(entry: DecisionEntry): string;
export declare function formatHeatmap(snapshot: HeatmapSnapshot): string;
export declare function formatArchetype(result: ArchetypeResult): string;
export declare function formatPractice(practice: {
    title: string;
    why: string;
    steps: string[];
    reflectionQuestion: string;
    followUpCommand?: string;
}): string;
export declare function formatPromptReflection(entry: PromptReflectionEntry): string;
//# sourceMappingURL=format.d.ts.map