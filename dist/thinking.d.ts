import { ArchetypeResult, CognitiveArchetype, HeatmapAreaScore, OutsourcingAuditEntry, OutsourcingRisk, ReflectionLog, ThinkingMode, ThinkingScoreDimension, ThinkingScoreEntry } from './types';
export declare const THINKING_MODE_PROMPTS: Record<ThinkingMode, string[]>;
export declare function recommendThinkingMode(goal: string): {
    mode: ThinkingMode;
    reason: string;
    prompts: string[];
};
export declare const SCORE_DIMENSIONS: ThinkingScoreDimension[];
export declare function calculateThinkingScore(answers: Record<ThinkingScoreDimension, number[]>): Omit<ThinkingScoreEntry, 'id' | 'timestamp' | 'date' | 'project'>;
export declare function calculateOutsourcingRisk(answers: OutsourcingAuditEntry['answers']): {
    risk: OutsourcingRisk;
    riskAreas: string[];
    suggestedNextAction: string;
};
export declare const DEFAULT_HEATMAP_AREAS: string[];
export declare function analyzeHeatmap(areas: HeatmapAreaScore[], scale: 5 | 10): {
    areas: HeatmapAreaScore[];
    weakestAreas: HeatmapAreaScore[];
    suggestedFocus: string;
};
export declare function scoreArchetype(answers: CognitiveArchetype[]): Omit<ArchetypeResult, 'id' | 'timestamp' | 'date' | 'project'>;
export declare function improvePrompt(input: {
    promptUsed: string;
    goal: string;
    hiddenAssumptions: string;
    unclear: string;
}): string;
export declare function generatePractice(log: ReflectionLog): {
    title: string;
    why: string;
    steps: string[];
    reflectionQuestion: string;
    followUpCommand?: string;
};
//# sourceMappingURL=thinking.d.ts.map