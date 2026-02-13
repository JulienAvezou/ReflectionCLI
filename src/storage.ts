/**
 * Storage module for persisting reflection entries to log.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { ReflectionLog, ReflectionEntry, LogStats, Answers } from './types';

const DEFAULT_LOG: ReflectionLog = {
  version: '1.0',
  entries: [],
  stats: {
    totalCommits: 0,
    projectStartDate: new Date().toISOString().split('T')[0],
  },
};

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
    return DEFAULT_LOG;
  }

  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const log = JSON.parse(content) as ReflectionLog;
    return log;
  } catch (error) {
    console.error('Failed to read log.json, starting fresh:', error);
    return DEFAULT_LOG;
  }
}

/**
 * Write the reflection log to disk
 */
export function writeLog(log: ReflectionLog): void {
  ensureGitReflectDir();
  const logPath = getLogFilePath();

  try {
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
  } catch (error) {
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
