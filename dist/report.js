"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyReport = generateWeeklyReport;
exports.saveMarkdownReport = saveMarkdownReport;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseDate(value) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
    }
    return date;
}
function toDateString(date) {
    return date.toISOString().split('T')[0];
}
function defaultSince() {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 6);
    return toDateString(date);
}
function isInRange(date, since, until) {
    return date >= since && date <= until;
}
function unique(values) {
    return Array.from(new Set(values.filter((value) => Boolean(value?.trim()))));
}
function bulletList(values, emptyMessage) {
    if (values.length === 0) {
        return `- ${emptyMessage}`;
    }
    return values.map((value) => `- ${value}`).join('\n');
}
function topRecurring(values) {
    const counts = new Map();
    values
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([value, count]) => `${value}${count > 1 ? ` (${count}x)` : ''}`);
}
function generateWeeklyReport(log, options = {}) {
    const since = options.since ?? defaultSince();
    const until = options.until ?? toDateString(new Date());
    parseDate(since);
    parseDate(until);
    if (since > until) {
        throw new Error('Since date must be before or equal to until date.');
    }
    const reflections = log.entries.filter((entry) => isInRange(entry.date, since, until));
    const learningEntries = log.learningEntries.filter((entry) => isInRange(entry.date, since, until));
    const explainBackEntries = log.explainBackEntries.filter((entry) => isInRange(entry.date, since, until));
    const debtItems = log.comprehensionDebt.filter((item) => isInRange(item.date, since, until));
    const openDebt = log.comprehensionDebt.filter((item) => item.status === 'open');
    const resolvedDebt = log.comprehensionDebt.filter((item) => item.status === 'resolved' &&
        Boolean(item.resolvedAt) &&
        isInRange(item.resolvedAt.split('T')[0], since, until));
    const projects = unique([
        ...learningEntries.map((entry) => entry.project),
        ...explainBackEntries.map((entry) => entry.project),
        ...debtItems.map((item) => item.project),
        ...reflections.map((entry) => entry.branchName),
    ]);
    const mainTopics = unique([
        ...debtItems.flatMap((item) => item.tags),
        ...learningEntries.map((entry) => entry.sections.reusablePattern),
        ...explainBackEntries.map((entry) => entry.topic),
    ]);
    const learned = unique([
        ...reflections.map((entry) => entry.answers.learned),
        ...learningEntries.map((entry) => entry.sections.whatIUnderstood),
    ]);
    const aiUsage = unique([
        ...learningEntries.map((entry) => entry.sections.whatAiHelpedWith),
        ...learningEntries.map((entry) => entry.sections.whatIMayHaveOutsourcedToAi),
    ]);
    const recurringGaps = topRecurring([
        ...openDebt.flatMap((item) => (item.tags.length > 0 ? item.tags : [item.title])),
        ...learningEntries.map((entry) => entry.sections.whatIStillDoNotFullyUnderstand),
        ...explainBackEntries
            .filter((entry) => entry.assessment !== 'strong')
            .map((entry) => entry.topic),
    ]);
    const questions = unique([
        ...learningEntries.map((entry) => entry.sections.explainBackQuestion),
        ...openDebt.map((item) => item.title),
    ]);
    const suggestedFocus = recurringGaps[0] ??
        openDebt[0]?.title ??
        learningEntries[0]?.sections.nextLearningAction ??
        'Keep capturing reflections after meaningful coding sessions.';
    return [
        '# Weekly Thinking Report',
        '',
        `Period: ${since} to ${until}`,
        '',
        '## Projects worked on',
        bulletList(projects, 'No projects captured this week.'),
        '',
        '## Main topics',
        bulletList(mainTopics, 'No topics captured this week.'),
        '',
        '## What I learned',
        bulletList(learned, 'No learning entries captured this week.'),
        '',
        '## Open comprehension debt',
        bulletList(openDebt.map((item) => `${item.id}: ${item.title}`), 'No open comprehension debt.'),
        '',
        '## Resolved comprehension debt',
        bulletList(resolvedDebt.map((item) => `${item.id}: ${item.title}`), 'No comprehension debt resolved this week.'),
        '',
        '## AI usage reflections',
        bulletList(aiUsage, 'No AI usage reflections captured this week.'),
        '',
        '## Recurring gaps',
        bulletList(recurringGaps, 'No recurring gaps detected yet.'),
        '',
        '## Questions to revisit',
        bulletList(questions, 'No questions to revisit yet.'),
        '',
        '## Suggested focus for next week',
        `- ${suggestedFocus}`,
    ].join('\n');
}
function saveMarkdownReport(outputPath, markdown) {
    const resolvedPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, `${markdown}\n`, 'utf-8');
}
//# sourceMappingURL=report.js.map