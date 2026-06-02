/**
 * Storage module for persisting reflection entries to log.json
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ArchetypeResult,
  ComprehensionDebtItem,
  DecisionEntry,
  DecisionReview,
  ExplainBackEntry,
  HeatmapSnapshot,
  LearningEntry,
  OutsourcingAuditEntry,
  PromptReflectionEntry,
  ReflectionLog,
  ReflectionEntry,
  Answers,
  ThinkingModeSession,
  ThinkingScoreEntry,
} from './types';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function createDefaultLog(): ReflectionLog {
  return {
    version: '1.0',
    entries: [],
    comprehensionDebt: [],
    learningEntries: [],
    explainBackEntries: [],
    thinkingModeSessions: [],
    thinkingScores: [],
    outsourcingAudits: [],
    decisionEntries: [],
    heatmapSnapshots: [],
    archetypeResults: [],
    promptReflections: [],
    stats: {
      totalCommits: 0,
      projectStartDate: today(),
    },
  };
}

function normalizeLog(log: Partial<ReflectionLog>): ReflectionLog {
  return {
    version: log.version ?? '1.0',
    entries: Array.isArray(log.entries) ? log.entries : [],
    comprehensionDebt: Array.isArray(log.comprehensionDebt) ? log.comprehensionDebt : [],
    learningEntries: Array.isArray(log.learningEntries) ? log.learningEntries : [],
    explainBackEntries: Array.isArray(log.explainBackEntries) ? log.explainBackEntries : [],
    thinkingModeSessions: Array.isArray(log.thinkingModeSessions) ? log.thinkingModeSessions : [],
    thinkingScores: Array.isArray(log.thinkingScores) ? log.thinkingScores : [],
    outsourcingAudits: Array.isArray(log.outsourcingAudits) ? log.outsourcingAudits : [],
    decisionEntries: Array.isArray(log.decisionEntries) ? log.decisionEntries : [],
    heatmapSnapshots: Array.isArray(log.heatmapSnapshots) ? log.heatmapSnapshots : [],
    archetypeResults: Array.isArray(log.archetypeResults) ? log.archetypeResults : [],
    promptReflections: Array.isArray(log.promptReflections) ? log.promptReflections : [],
    stats: {
      totalCommits:
        log.stats?.totalCommits ?? (Array.isArray(log.entries) ? log.entries.length : 0),
      projectStartDate: log.stats?.projectStartDate ?? today(),
    },
  };
}

/**
 * Get the git-reflect directory path
 */
export function getGitReflectDir(): string {
  const gitDir = findGitDir();
  if (!gitDir) {
    throw new Error('Not inside a git repository');
  }
  return path.join(gitDir, 'git-reflect');
}

/**
 * Get the log file path
 */
export function getLogFilePath(): string {
  return path.join(getGitReflectDir(), 'log.json');
}

/**
 * Find the .git directory by traversing up the file tree
 */
export function findGitDir(): string | null {
  let current = process.cwd();
  while (current !== '/') {
    const gitPath = path.join(current, '.git');
    if (fs.existsSync(gitPath)) {
      return gitPath;
    }
    current = path.dirname(current);
  }
  return null;
}

/**
 * Ensure the git-reflect directory exists
 */
export function ensureGitReflectDir(): void {
  const dir = getGitReflectDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read the reflection log, creating it if it doesn't exist
 */
export function readLog(): ReflectionLog {
  ensureGitReflectDir();
  const logPath = getLogFilePath();

  if (!fs.existsSync(logPath)) {
    return createDefaultLog();
  }

  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const log = JSON.parse(content) as Partial<ReflectionLog>;
    return normalizeLog(log);
  } catch (error) {
    console.error('Failed to read log.json, starting fresh:', error);
    return createDefaultLog();
  }
}

/**
 * Write the reflection log to disk
 */
export function writeLog(log: ReflectionLog): void {
  ensureGitReflectDir();
  const logPath = getLogFilePath();
  const tempPath = `${logPath}.${process.pid}.${Date.now()}.tmp`;

  try {
    fs.writeFileSync(tempPath, JSON.stringify(log, null, 2), 'utf-8');
    fs.renameSync(tempPath, logPath);
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw new Error(`Failed to write log.json: ${error}`);
  }
}

/**
 * Add a new reflection entry to the log
 */
export function addEntry(entry: ReflectionEntry): void {
  const log = readLog();
  log.entries.push(entry);
  log.stats.totalCommits = log.entries.length;
  writeLog(log);
}

function nextId(prefix: string, existingIds: string[]): string {
  const max = existingIds.reduce((highest, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) {
      return highest;
    }
    return Math.max(highest, Number(match[1]));
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function createDebtItem(input: {
  title: string;
  context?: string;
  project?: string;
  tags?: string[];
  sourceReflection?: string;
}): ComprehensionDebtItem {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Debt title is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'debt',
      log.comprehensionDebt.map((item) => item.id)
    ),
    title,
    context: input.context?.trim() || undefined,
    project: input.project?.trim() || undefined,
    tags: input.tags ?? [],
    sourceReflection: input.sourceReflection?.trim() || undefined,
    status: 'open',
    createdAt: now.toISOString(),
    date: now.toISOString().split('T')[0],
  };
}

export function addDebtItem(item: ComprehensionDebtItem): void {
  const log = readLog();
  log.comprehensionDebt.push(item);
  writeLog(log);
}

export function listDebtItems(
  status: 'open' | 'resolved' | 'all' = 'open'
): ComprehensionDebtItem[] {
  const log = readLog();
  if (status === 'all') {
    return log.comprehensionDebt;
  }
  return log.comprehensionDebt.filter((item) => item.status === status);
}

export function getDebtItem(id: string): ComprehensionDebtItem | null {
  const log = readLog();
  return log.comprehensionDebt.find((item) => item.id === id) ?? null;
}

export function resolveDebtItem(id: string): ComprehensionDebtItem {
  const log = readLog();
  const item = log.comprehensionDebt.find((debt) => debt.id === id);
  if (!item) {
    throw new Error(`No comprehension debt item found with id "${id}"`);
  }
  if (item.status === 'resolved') {
    return item;
  }
  item.status = 'resolved';
  item.resolvedAt = new Date().toISOString();
  writeLog(log);
  return item;
}

export function createLearningEntry(input: {
  project?: string;
  source?: string;
  sections: LearningEntry['sections'];
}): LearningEntry {
  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'learn',
      log.learningEntries.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    source: input.source?.trim() || undefined,
    sections: input.sections,
  };
}

export function addLearningEntry(entry: LearningEntry): void {
  const log = readLog();
  log.learningEntries.push(entry);
  writeLog(log);
}

export function createExplainBackEntry(input: {
  topic: string;
  project?: string;
  canExplainWithoutCode: string;
  tradeoff: string;
  changedAssumption: string;
  explanationForDeveloper: string;
  assessment: ExplainBackEntry['assessment'];
  createdDebtId?: string;
}): ExplainBackEntry {
  const topic = input.topic.trim();
  if (!topic) {
    throw new Error('Explain-back topic is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'explain',
      log.explainBackEntries.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    topic,
    project: input.project?.trim() || undefined,
    canExplainWithoutCode: input.canExplainWithoutCode,
    tradeoff: input.tradeoff,
    changedAssumption: input.changedAssumption,
    explanationForDeveloper: input.explanationForDeveloper,
    assessment: input.assessment,
    createdDebtId: input.createdDebtId,
  };
}

export function addExplainBackEntry(entry: ExplainBackEntry): void {
  const log = readLog();
  log.explainBackEntries.push(entry);
  writeLog(log);
}

export function createThinkingModeSession(input: {
  project?: string;
  goal: string;
  recommendedMode: ThinkingModeSession['recommendedMode'];
  reason: string;
  prompts: string[];
  saved?: boolean;
}): ThinkingModeSession {
  const goal = input.goal.trim();
  if (!goal) {
    throw new Error('Thinking mode goal is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'mode',
      log.thinkingModeSessions.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    goal,
    recommendedMode: input.recommendedMode,
    reason: input.reason,
    prompts: input.prompts,
    saved: input.saved ?? true,
  };
}

export function addThinkingModeSession(entry: ThinkingModeSession): void {
  const log = readLog();
  log.thinkingModeSessions.push(entry);
  writeLog(log);
}

export function createThinkingScoreEntry(input: {
  project?: string;
  dimensions: ThinkingScoreEntry['dimensions'];
  total: number;
  strongest: ThinkingScoreEntry['strongest'];
  weakest: ThinkingScoreEntry['weakest'];
  improvementAction: string;
}): ThinkingScoreEntry {
  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'score',
      log.thinkingScores.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    dimensions: input.dimensions,
    total: input.total,
    strongest: input.strongest,
    weakest: input.weakest,
    improvementAction: input.improvementAction,
  };
}

export function addThinkingScoreEntry(entry: ThinkingScoreEntry): void {
  const log = readLog();
  log.thinkingScores.push(entry);
  writeLog(log);
}

export function createOutsourcingAuditEntry(input: {
  project?: string;
  answers: OutsourcingAuditEntry['answers'];
  risk: OutsourcingAuditEntry['risk'];
  riskAreas: string[];
  suggestedNextAction: string;
  createdExplainBackId?: string;
  createdDebtId?: string;
}): OutsourcingAuditEntry {
  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'audit',
      log.outsourcingAudits.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    answers: input.answers,
    risk: input.risk,
    riskAreas: input.riskAreas,
    suggestedNextAction: input.suggestedNextAction,
    createdExplainBackId: input.createdExplainBackId,
    createdDebtId: input.createdDebtId,
  };
}

export function addOutsourcingAuditEntry(entry: OutsourcingAuditEntry): void {
  const log = readLog();
  log.outsourcingAudits.push(entry);
  writeLog(log);
}

export function createDecisionEntry(input: {
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
}): DecisionEntry {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Decision title is required');
  }
  if (input.optionsConsidered.length === 0) {
    throw new Error('At least one option is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'decision',
      log.decisionEntries.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    tags: input.tags ?? [],
    title,
    context: input.context,
    optionsConsidered: input.optionsConsidered,
    chosenOption: input.chosenOption,
    reasoning: input.reasoning,
    tradeoffs: input.tradeoffs,
    expectedOutcome: input.expectedOutcome,
    reviewDate: input.reviewDate,
  };
}

export function addDecisionEntry(entry: DecisionEntry): void {
  const log = readLog();
  log.decisionEntries.push(entry);
  writeLog(log);
}

export function listDecisionEntries(): DecisionEntry[] {
  return readLog().decisionEntries;
}

export function getDecisionEntry(id: string): DecisionEntry | null {
  return readLog().decisionEntries.find((entry) => entry.id === id) ?? null;
}

export function addDecisionReview(id: string, review: DecisionReview): DecisionEntry {
  const log = readLog();
  const entry = log.decisionEntries.find((decision) => decision.id === id);
  if (!entry) {
    throw new Error(`No decision found with id "${id}"`);
  }
  entry.review = review;
  writeLog(log);
  return entry;
}

export function createHeatmapSnapshot(input: {
  project?: string;
  scale: HeatmapSnapshot['scale'];
  areas: HeatmapSnapshot['areas'];
  weakestAreas: HeatmapSnapshot['weakestAreas'];
  suggestedFocus: string;
}): HeatmapSnapshot {
  if (input.scale !== 5 && input.scale !== 10) {
    throw new Error('Heatmap scale must be 5 or 10');
  }
  if (input.areas.length === 0) {
    throw new Error('At least one heatmap area is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'heatmap',
      log.heatmapSnapshots.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    scale: input.scale,
    areas: input.areas,
    weakestAreas: input.weakestAreas,
    suggestedFocus: input.suggestedFocus,
  };
}

export function addHeatmapSnapshot(entry: HeatmapSnapshot): void {
  const log = readLog();
  log.heatmapSnapshots.push(entry);
  writeLog(log);
}

export function getLatestHeatmapSnapshot(project?: string): HeatmapSnapshot | null {
  const entries = readLog().heatmapSnapshots.filter((entry) =>
    project ? entry.project === project : true
  );
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

export function createArchetypeResult(input: {
  project?: string;
  scores: ArchetypeResult['scores'];
  primary: ArchetypeResult['primary'];
  secondary?: ArchetypeResult['secondary'];
  explanation: string;
  improvementActions: string[];
}): ArchetypeResult {
  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'archetype',
      log.archetypeResults.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    scores: input.scores,
    primary: input.primary,
    secondary: input.secondary,
    explanation: input.explanation,
    improvementActions: input.improvementActions,
  };
}

export function addArchetypeResult(entry: ArchetypeResult): void {
  const log = readLog();
  log.archetypeResults.push(entry);
  writeLog(log);
}

export function createPromptReflectionEntry(input: {
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
}): PromptReflectionEntry {
  const promptUsed = input.promptUsed.trim();
  if (!promptUsed) {
    throw new Error('Prompt text is required');
  }

  const log = readLog();
  const now = new Date();
  return {
    id: nextId(
      'prompt',
      log.promptReflections.map((entry) => entry.id)
    ),
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    project: input.project?.trim() || undefined,
    tags: input.tags ?? [],
    promptUsed,
    goal: input.goal,
    aiOutput: input.aiOutput,
    worked: input.worked,
    unclear: input.unclear,
    hiddenAssumptions: input.hiddenAssumptions,
    improvedPrompt: input.improvedPrompt,
    lessonsLearned: input.lessonsLearned,
  };
}

export function addPromptReflectionEntry(entry: PromptReflectionEntry): void {
  const log = readLog();
  log.promptReflections.push(entry);
  writeLog(log);
}

/**
 * Create a reflection entry
 */
export function createEntry(
  branchName: string,
  commitMessage: string,
  answers: Answers
): ReflectionEntry {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    branchName,
    commitMessage,
    answers,
  };
}

/**
 * Get the latest reflection entry
 */
export function getLatestEntry(): ReflectionEntry | null {
  const log = readLog();
  return log.entries.length > 0 ? log.entries[log.entries.length - 1] : null;
}
