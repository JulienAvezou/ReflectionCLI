import * as fs from 'fs';
import * as path from 'path';
import { ReflectionLog } from './types';

export interface WeeklyReportOptions {
  since?: string;
  until?: string;
}

function parseDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
  }
  return date;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function defaultSince(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 6);
  return toDateString(date);
}

function isInRange(date: string, since: string, until: string): boolean {
  return date >= since && date <= until;
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function bulletList(values: string[], emptyMessage: string): string {
  if (values.length === 0) {
    return `- ${emptyMessage}`;
  }
  return values.map((value) => `- ${value}`).join('\n');
}

function topRecurring(values: string[]): string[] {
  const counts = new Map<string, number>();
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([value, count]) => `${value}${count > 1 ? ` (${count}x)` : ''}`);
}

export function generateWeeklyReport(
  log: ReflectionLog,
  options: WeeklyReportOptions = {}
): string {
  const since = options.since ?? defaultSince();
  const until = options.until ?? toDateString(new Date());

  parseDate(since);
  parseDate(until);
  if (since > until) {
    throw new Error('Since date must be before or equal to until date.');
  }

  const reflections = log.entries.filter((entry) => isInRange(entry.date, since, until));
  const learningEntries = log.learningEntries.filter((entry) =>
    isInRange(entry.date, since, until)
  );
  const explainBackEntries = log.explainBackEntries.filter((entry) =>
    isInRange(entry.date, since, until)
  );
  const debtItems = log.comprehensionDebt.filter((item) => isInRange(item.date, since, until));
  const openDebt = log.comprehensionDebt.filter((item) => item.status === 'open');
  const resolvedDebt = log.comprehensionDebt.filter(
    (item) =>
      item.status === 'resolved' &&
      Boolean(item.resolvedAt) &&
      isInRange(item.resolvedAt!.split('T')[0], since, until)
  );

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

  const suggestedFocus =
    recurringGaps[0] ??
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
    bulletList(
      openDebt.map((item) => `${item.id}: ${item.title}`),
      'No open comprehension debt.'
    ),
    '',
    '## Resolved comprehension debt',
    bulletList(
      resolvedDebt.map((item) => `${item.id}: ${item.title}`),
      'No comprehension debt resolved this week.'
    ),
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

export function saveMarkdownReport(outputPath: string, markdown: string): void {
  const resolvedPath = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${markdown}\n`, 'utf-8');
}
