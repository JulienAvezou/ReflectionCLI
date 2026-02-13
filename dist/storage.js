"use strict";
/**
 * Storage module for persisting reflection entries to log.json
 */
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
exports.getGitReflectDir = getGitReflectDir;
exports.getLogFilePath = getLogFilePath;
exports.findGitDir = findGitDir;
exports.ensureGitReflectDir = ensureGitReflectDir;
exports.readLog = readLog;
exports.writeLog = writeLog;
exports.addEntry = addEntry;
exports.createEntry = createEntry;
exports.getLatestEntry = getLatestEntry;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_LOG = {
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
function getGitReflectDir() {
    const gitDir = findGitDir();
    if (!gitDir) {
        throw new Error('Not inside a git repository');
    }
    return path.join(gitDir, 'git-reflect');
}
/**
 * Get the log file path
 */
function getLogFilePath() {
    return path.join(getGitReflectDir(), 'log.json');
}
/**
 * Find the .git directory by traversing up the file tree
 */
function findGitDir() {
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
function ensureGitReflectDir() {
    const dir = getGitReflectDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
/**
 * Read the reflection log, creating it if it doesn't exist
 */
function readLog() {
    ensureGitReflectDir();
    const logPath = getLogFilePath();
    if (!fs.existsSync(logPath)) {
        return DEFAULT_LOG;
    }
    try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const log = JSON.parse(content);
        return log;
    }
    catch (error) {
        console.error('Failed to read log.json, starting fresh:', error);
        return DEFAULT_LOG;
    }
}
/**
 * Write the reflection log to disk
 */
function writeLog(log) {
    ensureGitReflectDir();
    const logPath = getLogFilePath();
    try {
        fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to write log.json: ${error}`);
    }
}
/**
 * Add a new reflection entry to the log
 */
function addEntry(entry) {
    const log = readLog();
    log.entries.push(entry);
    log.stats.totalCommits = log.entries.length;
    writeLog(log);
}
/**
 * Create a reflection entry
 */
function createEntry(branchName, commitMessage, answers) {
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
function getLatestEntry() {
    const log = readLog();
    return log.entries.length > 0 ? log.entries[log.entries.length - 1] : null;
}
//# sourceMappingURL=storage.js.map