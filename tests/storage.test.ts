/**
 * Tests for storage module
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  readLog,
  writeLog,
  addEntry,
  createEntry,
  findGitDir,
  ensureGitReflectDir,
  getLogFilePath,
  getGitReflectDir,
  getLatestEntry,
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
    expect(log.stats.totalCommits).toBe(0);
  });

  test('should write and read log', () => {
    const testLog: ReflectionLog = {
      version: '1.0',
      entries: [],
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
});
