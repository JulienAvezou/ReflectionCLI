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
export interface LogStats {
    totalCommits: number;
    projectStartDate: string;
}
export interface ReflectionLog {
    version: string;
    entries: ReflectionEntry[];
    stats: LogStats;
}
export interface Question {
    key: keyof Answers;
    prompt: string;
    hint?: string;
}
//# sourceMappingURL=types.d.ts.map