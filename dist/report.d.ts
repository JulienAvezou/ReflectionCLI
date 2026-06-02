import { ReflectionLog } from './types';
export interface WeeklyReportOptions {
    since?: string;
    until?: string;
}
export declare function generateWeeklyReport(log: ReflectionLog, options?: WeeklyReportOptions): string;
export declare function saveMarkdownReport(outputPath: string, markdown: string): void;
//# sourceMappingURL=report.d.ts.map