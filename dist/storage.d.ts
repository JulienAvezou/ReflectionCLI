/**
 * Storage module for persisting reflection entries to log.json
 */
import { ReflectionLog, ReflectionEntry, Answers } from './types';
/**
 * Get the git-reflect directory path
 */
export declare function getGitReflectDir(): string;
/**
 * Get the log file path
 */
export declare function getLogFilePath(): string;
/**
 * Find the .git directory by traversing up the file tree
 */
export declare function findGitDir(): string | null;
/**
 * Ensure the git-reflect directory exists
 */
export declare function ensureGitReflectDir(): void;
/**
 * Read the reflection log, creating it if it doesn't exist
 */
export declare function readLog(): ReflectionLog;
/**
 * Write the reflection log to disk
 */
export declare function writeLog(log: ReflectionLog): void;
/**
 * Add a new reflection entry to the log
 */
export declare function addEntry(entry: ReflectionEntry): void;
/**
 * Create a reflection entry
 */
export declare function createEntry(branchName: string, commitMessage: string, answers: Answers): ReflectionEntry;
/**
 * Get the latest reflection entry
 */
export declare function getLatestEntry(): ReflectionEntry | null;
//# sourceMappingURL=storage.d.ts.map