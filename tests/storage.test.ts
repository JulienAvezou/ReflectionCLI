/**
 * Tests for storage module
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readLog,
  writeLog,
  addArchetypeResult,
  addEntry,
  addDebtItem,
  addDecisionEntry,
  addDecisionReview,
  addExplainBackEntry,
  addHeatmapSnapshot,
  addLearningEntry,
  addOutsourcingAuditEntry,
  addPromptReflectionEntry,
  addThinkingModeSession,
  addThinkingScoreEntry,
  createArchetypeResult,
  createDebtItem,
  createDecisionEntry,
  createEntry,
  createExplainBackEntry,
  createHeatmapSnapshot,
  createLearningEntry,
  createOutsourcingAuditEntry,
  createPromptReflectionEntry,
  createThinkingModeSession,
  createThinkingScoreEntry,
  findGitDir,
  ensureGitReflectDir,
  getDecisionEntry,
  getDebtItem,
  getLatestHeatmapSnapshot,
  getLogFilePath,
  getGitReflectDir,
  getLatestEntry,
  listDecisionEntries,
  listDebtItems,
  resolveDebtItem,
} from '../src/storage';
import { ReflectionLog, Answers } from '../src/types';

describe('Storage Module', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-reflect-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Initialize a git repo
    const gitDir = path.join(testDir, '.git');
    fs.mkdirSync(gitDir);
  });

  afterEach(() => {
    // Clean up
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true });
  });

  test('should find git directory', () => {
    const gitDir = findGitDir();
    expect(gitDir).toBeDefined();
    expect(gitDir).toContain('.git');
  });

  test('should ensure git-reflect directory is created', () => {
    ensureGitReflectDir();
    const dir = getGitReflectDir();
    expect(fs.existsSync(dir)).toBe(true);
  });

  test('should read log and return default structure if not exists', () => {
    const log = readLog();
    expect(log.version).toBe('1.0');
    expect(log.entries).toEqual([]);
    expect(log.comprehensionDebt).toEqual([]);
    expect(log.learningEntries).toEqual([]);
    expect(log.explainBackEntries).toEqual([]);
    expect(log.thinkingModeSessions).toEqual([]);
    expect(log.thinkingScores).toEqual([]);
    expect(log.outsourcingAudits).toEqual([]);
    expect(log.decisionEntries).toEqual([]);
    expect(log.heatmapSnapshots).toEqual([]);
    expect(log.archetypeResults).toEqual([]);
    expect(log.promptReflections).toEqual([]);
    expect(log.stats.totalCommits).toBe(0);
  });

  test('should write and read log', () => {
    const testLog: ReflectionLog = {
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
      stats: { totalCommits: 0, projectStartDate: '2026-02-13' },
    };

    writeLog(testLog);
    const readResult = readLog();

    expect(readResult).toEqual(testLog);
  });

  test('should create reflection entry with correct structure', () => {
    const answers: Answers = {
      intent: 'Test intent',
      problemSolved: 'Test problem',
      learned: 'Test learning',
      wouldDoDifferently: 'Test differently',
      confidence: 'High',
      testing: 'Unit tests',
      technicalDebt: 'None',
    };

    const entry = createEntry('main', 'Test commit', answers);

    expect(entry.branchName).toBe('main');
    expect(entry.commitMessage).toBe('Test commit');
    expect(entry.answers).toEqual(answers);
    expect(entry.timestamp).toBeDefined();
    expect(entry.date).toBeDefined();
  });

  test('should add entry to log', () => {
    const answers: Answers = {
      intent: 'Test',
      problemSolved: 'Test',
      learned: 'Test',
      wouldDoDifferently: 'Test',
      confidence: 'Test',
      testing: 'Test',
      technicalDebt: 'Test',
    };

    const entry = createEntry('main', 'Test', answers);
    addEntry(entry);

    const log = readLog();
    expect(log.entries).toHaveLength(1);
    expect(log.stats.totalCommits).toBe(1);
  });

  test('should add and list open comprehension debt', () => {
    const item = createDebtItem({
      title: 'Understand cache invalidation',
      context: 'AI wrote the invalidation rules',
      project: 'api',
      tags: ['cache', 'ai'],
      sourceReflection: 'commit-1',
    });
    addDebtItem(item);

    const items = listDebtItems();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'debt-001',
      title: 'Understand cache invalidation',
      context: 'AI wrote the invalidation rules',
      project: 'api',
      tags: ['cache', 'ai'],
      sourceReflection: 'commit-1',
      status: 'open',
    });
  });

  test('should resolve comprehension debt', () => {
    const item = createDebtItem({ title: 'Understand auth middleware' });
    addDebtItem(item);

    const resolved = resolveDebtItem(item.id);

    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeDefined();
    expect(listDebtItems()).toHaveLength(0);
    expect(listDebtItems('resolved')).toHaveLength(1);
  });

  test('should show a specific comprehension debt item', () => {
    const item = createDebtItem({ title: 'Understand TypeScript generics' });
    addDebtItem(item);

    const found = getDebtItem(item.id);

    expect(found?.title).toBe('Understand TypeScript generics');
  });

  test('should throw helpful errors for invalid debt input', () => {
    expect(() => createDebtItem({ title: '   ' })).toThrow('Debt title is required');
    expect(() => resolveDebtItem('missing')).toThrow(
      'No comprehension debt item found with id "missing"'
    );
  });

  test('should add a learning extraction entry', () => {
    const entry = createLearningEntry({
      project: 'cli',
      source: 'manual',
      sections: {
        whatIUnderstood: 'The command parser is simple.',
        whatAiHelpedWith: 'AI drafted tests.',
        whatIMayHaveOutsourcedToAi: 'Edge case discovery.',
        whatIStillDoNotFullyUnderstand: 'Prompt ergonomics.',
        reusablePattern: 'Keep storage pure and commands thin.',
        explainBackQuestion: 'Can I explain the storage shape?',
        nextLearningAction: 'Review command parsing tradeoffs.',
      },
    });
    addLearningEntry(entry);

    const log = readLog();

    expect(log.learningEntries).toHaveLength(1);
    expect(log.learningEntries[0].id).toBe('learn-001');
    expect(log.learningEntries[0].sections.nextLearningAction).toContain('Review command parsing');
  });

  test('should add an explain-back entry', () => {
    const entry = createExplainBackEntry({
      topic: 'Local JSON storage',
      project: 'cli',
      canExplainWithoutCode: 'Yes, it reads and normalizes log.json.',
      tradeoff: 'Simple files over a database.',
      changedAssumption: 'Concurrent writes would need locking.',
      explanationForDeveloper: 'The log is a project-local knowledge store.',
      assessment: 'strong',
    });
    addExplainBackEntry(entry);

    const log = readLog();

    expect(log.explainBackEntries).toHaveLength(1);
    expect(log.explainBackEntries[0].id).toBe('explain-001');
    expect(log.explainBackEntries[0].topic).toBe('Local JSON storage');
  });

  test('should add thinking mode and score history', () => {
    const mode = createThinkingModeSession({
      goal: 'choose between two implementations',
      recommendedMode: 'Decide',
      reason: 'Options need tradeoff analysis.',
      prompts: ['What tradeoff matters most?'],
    });
    addThinkingModeSession(mode);

    const score = createThinkingScoreEntry({
      dimensions: {
        understanding: 8,
        verification: 4,
        reflection: 7,
        decisionQuality: 6,
        aiDependency: 9,
      },
      total: 34,
      strongest: 'aiDependency',
      weakest: 'verification',
      improvementAction: 'Add one edge-case test.',
    });
    addThinkingScoreEntry(score);

    const log = readLog();

    expect(log.thinkingModeSessions[0].id).toBe('mode-001');
    expect(log.thinkingScores[0].id).toBe('score-001');
  });

  test('should add outsourcing audit entries', () => {
    const entry = createOutsourcingAuditEntry({
      answers: {
        aiGenerated: true,
        verifiedOutput: false,
        canExplain: false,
        testedEdgeCases: false,
        comparedAlternatives: false,
        challengedSuggestion: false,
      },
      risk: 'High',
      riskAreas: ['Cannot explain why it works'],
      suggestedNextAction: 'Run explain-back.',
    });
    addOutsourcingAuditEntry(entry);

    expect(readLog().outsourcingAudits[0].risk).toBe('High');
  });

  test('should create and review decisions', () => {
    const entry = createDecisionEntry({
      title: 'Use local JSON storage',
      context: 'Keep the app local-first.',
      optionsConsidered: ['SQLite', 'JSON'],
      chosenOption: 'JSON',
      reasoning: 'Simple and readable.',
      tradeoffs: 'No rich querying.',
      expectedOutcome: 'Easy manual inspection.',
      reviewDate: '2026-06-09',
      tags: ['storage'],
    });
    addDecisionEntry(entry);

    const reviewed = addDecisionReview(entry.id, {
      reviewedAt: '2026-06-10T00:00:00.000Z',
      whatHappened: 'The file stayed easy to inspect.',
      wasGoodDecision: 'Yes',
      whatChanged: 'More arrays were added.',
      chooseSameAgain: 'Yes for now.',
      lessonsLearned: 'Normalize old schemas.',
    });

    expect(listDecisionEntries()).toHaveLength(1);
    expect(getDecisionEntry(entry.id)?.chosenOption).toBe('JSON');
    expect(reviewed.review?.lessonsLearned).toContain('Normalize');
  });

  test('should create heatmap snapshots and return latest', () => {
    const snapshot = createHeatmapSnapshot({
      project: 'cli',
      scale: 5,
      areas: [
        { area: 'Frontend', score: 4 },
        { area: 'Backend', score: 2 },
      ],
      weakestAreas: [{ area: 'Backend', score: 2 }],
      suggestedFocus: 'Map Backend.',
    });
    addHeatmapSnapshot(snapshot);

    expect(getLatestHeatmapSnapshot('cli')?.id).toBe('heatmap-001');
  });

  test('should add archetype and prompt reflection entries', () => {
    const archetype = createArchetypeResult({
      scores: {
        'AI Autopilot': 0,
        'AI Assistant': 1,
        'AI Challenger': 3,
        'AI Architect': 1,
      },
      primary: 'AI Challenger',
      secondary: 'AI Assistant',
      explanation: 'Uses AI for critique.',
      improvementActions: ['Keep challenging plans.'],
    });
    addArchetypeResult(archetype);

    const prompt = createPromptReflectionEntry({
      promptUsed: 'Write tests',
      goal: 'Improve coverage',
      aiOutput: 'Test cases',
      worked: 'Found edge cases',
      unclear: 'Mocks',
      hiddenAssumptions: 'Test runner exists',
      improvedPrompt: 'Write tests with edge cases and assumptions.',
      lessonsLearned: 'Specify constraints.',
      tags: ['prompt'],
    });
    addPromptReflectionEntry(prompt);

    const log = readLog();

    expect(log.archetypeResults[0].primary).toBe('AI Challenger');
    expect(log.promptReflections[0].id).toBe('prompt-001');
  });

  test('should get latest entry', () => {
    const answers: Answers = {
      intent: 'Test 1',
      problemSolved: 'Test',
      learned: 'Test',
      wouldDoDifferently: 'Test',
      confidence: 'Test',
      testing: 'Test',
      technicalDebt: 'Test',
    };

    const entry1 = createEntry('main', 'First', answers);
    addEntry(entry1);

    answers.intent = 'Test 2';
    const entry2 = createEntry('main', 'Second', answers);
    addEntry(entry2);

    const latest = getLatestEntry();
    expect(latest?.commitMessage).toBe('Second');
    expect(latest?.answers.intent).toBe('Test 2');
  });

  test('should handle corrupted log gracefully', () => {
    ensureGitReflectDir();
    const logPath = getLogFilePath();
    fs.writeFileSync(logPath, 'invalid json {', 'utf-8');

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    const log = readLog();

    console.error = originalError;

    expect(log.version).toBe('1.0');
    expect(Array.isArray(log.entries)).toBe(true);
  });

  test('should normalize old logs with missing storage arrays', () => {
    ensureGitReflectDir();
    fs.writeFileSync(
      getLogFilePath(),
      JSON.stringify({
        version: '1.0',
        entries: [],
        stats: { totalCommits: 0, projectStartDate: '2026-02-13' },
      }),
      'utf-8'
    );

    const log = readLog();

    expect(log.comprehensionDebt).toEqual([]);
    expect(log.learningEntries).toEqual([]);
    expect(log.explainBackEntries).toEqual([]);
    expect(log.thinkingModeSessions).toEqual([]);
    expect(log.thinkingScores).toEqual([]);
    expect(log.outsourcingAudits).toEqual([]);
    expect(log.decisionEntries).toEqual([]);
    expect(log.heatmapSnapshots).toEqual([]);
    expect(log.archetypeResults).toEqual([]);
    expect(log.promptReflections).toEqual([]);
  });
});
