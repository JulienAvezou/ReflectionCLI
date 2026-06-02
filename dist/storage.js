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
exports.createDebtItem = createDebtItem;
exports.addDebtItem = addDebtItem;
exports.listDebtItems = listDebtItems;
exports.getDebtItem = getDebtItem;
exports.resolveDebtItem = resolveDebtItem;
exports.createLearningEntry = createLearningEntry;
exports.addLearningEntry = addLearningEntry;
exports.createExplainBackEntry = createExplainBackEntry;
exports.addExplainBackEntry = addExplainBackEntry;
exports.createThinkingModeSession = createThinkingModeSession;
exports.addThinkingModeSession = addThinkingModeSession;
exports.createThinkingScoreEntry = createThinkingScoreEntry;
exports.addThinkingScoreEntry = addThinkingScoreEntry;
exports.createOutsourcingAuditEntry = createOutsourcingAuditEntry;
exports.addOutsourcingAuditEntry = addOutsourcingAuditEntry;
exports.createDecisionEntry = createDecisionEntry;
exports.addDecisionEntry = addDecisionEntry;
exports.listDecisionEntries = listDecisionEntries;
exports.getDecisionEntry = getDecisionEntry;
exports.addDecisionReview = addDecisionReview;
exports.createHeatmapSnapshot = createHeatmapSnapshot;
exports.addHeatmapSnapshot = addHeatmapSnapshot;
exports.getLatestHeatmapSnapshot = getLatestHeatmapSnapshot;
exports.createArchetypeResult = createArchetypeResult;
exports.addArchetypeResult = addArchetypeResult;
exports.createPromptReflectionEntry = createPromptReflectionEntry;
exports.addPromptReflectionEntry = addPromptReflectionEntry;
exports.createEntry = createEntry;
exports.getLatestEntry = getLatestEntry;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function today() {
    return new Date().toISOString().split('T')[0];
}
function createDefaultLog() {
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
function normalizeLog(log) {
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
            totalCommits: log.stats?.totalCommits ?? (Array.isArray(log.entries) ? log.entries.length : 0),
            projectStartDate: log.stats?.projectStartDate ?? today(),
        },
    };
}
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
        return createDefaultLog();
    }
    try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const log = JSON.parse(content);
        return normalizeLog(log);
    }
    catch (error) {
        console.error('Failed to read log.json, starting fresh:', error);
        return createDefaultLog();
    }
}
/**
 * Write the reflection log to disk
 */
function writeLog(log) {
    ensureGitReflectDir();
    const logPath = getLogFilePath();
    const tempPath = `${logPath}.${process.pid}.${Date.now()}.tmp`;
    try {
        fs.writeFileSync(tempPath, JSON.stringify(log, null, 2), 'utf-8');
        fs.renameSync(tempPath, logPath);
    }
    catch (error) {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
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
function nextId(prefix, existingIds) {
    const max = existingIds.reduce((highest, id) => {
        const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
        if (!match) {
            return highest;
        }
        return Math.max(highest, Number(match[1]));
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}
function createDebtItem(input) {
    const title = input.title.trim();
    if (!title) {
        throw new Error('Debt title is required');
    }
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('debt', log.comprehensionDebt.map((item) => item.id)),
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
function addDebtItem(item) {
    const log = readLog();
    log.comprehensionDebt.push(item);
    writeLog(log);
}
function listDebtItems(status = 'open') {
    const log = readLog();
    if (status === 'all') {
        return log.comprehensionDebt;
    }
    return log.comprehensionDebt.filter((item) => item.status === status);
}
function getDebtItem(id) {
    const log = readLog();
    return log.comprehensionDebt.find((item) => item.id === id) ?? null;
}
function resolveDebtItem(id) {
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
function createLearningEntry(input) {
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('learn', log.learningEntries.map((entry) => entry.id)),
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        project: input.project?.trim() || undefined,
        source: input.source?.trim() || undefined,
        sections: input.sections,
    };
}
function addLearningEntry(entry) {
    const log = readLog();
    log.learningEntries.push(entry);
    writeLog(log);
}
function createExplainBackEntry(input) {
    const topic = input.topic.trim();
    if (!topic) {
        throw new Error('Explain-back topic is required');
    }
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('explain', log.explainBackEntries.map((entry) => entry.id)),
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
function addExplainBackEntry(entry) {
    const log = readLog();
    log.explainBackEntries.push(entry);
    writeLog(log);
}
function createThinkingModeSession(input) {
    const goal = input.goal.trim();
    if (!goal) {
        throw new Error('Thinking mode goal is required');
    }
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('mode', log.thinkingModeSessions.map((entry) => entry.id)),
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
function addThinkingModeSession(entry) {
    const log = readLog();
    log.thinkingModeSessions.push(entry);
    writeLog(log);
}
function createThinkingScoreEntry(input) {
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('score', log.thinkingScores.map((entry) => entry.id)),
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
function addThinkingScoreEntry(entry) {
    const log = readLog();
    log.thinkingScores.push(entry);
    writeLog(log);
}
function createOutsourcingAuditEntry(input) {
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('audit', log.outsourcingAudits.map((entry) => entry.id)),
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
function addOutsourcingAuditEntry(entry) {
    const log = readLog();
    log.outsourcingAudits.push(entry);
    writeLog(log);
}
function createDecisionEntry(input) {
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
        id: nextId('decision', log.decisionEntries.map((entry) => entry.id)),
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
function addDecisionEntry(entry) {
    const log = readLog();
    log.decisionEntries.push(entry);
    writeLog(log);
}
function listDecisionEntries() {
    return readLog().decisionEntries;
}
function getDecisionEntry(id) {
    return readLog().decisionEntries.find((entry) => entry.id === id) ?? null;
}
function addDecisionReview(id, review) {
    const log = readLog();
    const entry = log.decisionEntries.find((decision) => decision.id === id);
    if (!entry) {
        throw new Error(`No decision found with id "${id}"`);
    }
    entry.review = review;
    writeLog(log);
    return entry;
}
function createHeatmapSnapshot(input) {
    if (input.scale !== 5 && input.scale !== 10) {
        throw new Error('Heatmap scale must be 5 or 10');
    }
    if (input.areas.length === 0) {
        throw new Error('At least one heatmap area is required');
    }
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('heatmap', log.heatmapSnapshots.map((entry) => entry.id)),
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        project: input.project?.trim() || undefined,
        scale: input.scale,
        areas: input.areas,
        weakestAreas: input.weakestAreas,
        suggestedFocus: input.suggestedFocus,
    };
}
function addHeatmapSnapshot(entry) {
    const log = readLog();
    log.heatmapSnapshots.push(entry);
    writeLog(log);
}
function getLatestHeatmapSnapshot(project) {
    const entries = readLog().heatmapSnapshots.filter((entry) => project ? entry.project === project : true);
    return entries.length > 0 ? entries[entries.length - 1] : null;
}
function createArchetypeResult(input) {
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('archetype', log.archetypeResults.map((entry) => entry.id)),
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
function addArchetypeResult(entry) {
    const log = readLog();
    log.archetypeResults.push(entry);
    writeLog(log);
}
function createPromptReflectionEntry(input) {
    const promptUsed = input.promptUsed.trim();
    if (!promptUsed) {
        throw new Error('Prompt text is required');
    }
    const log = readLog();
    const now = new Date();
    return {
        id: nextId('prompt', log.promptReflections.map((entry) => entry.id)),
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
function addPromptReflectionEntry(entry) {
    const log = readLog();
    log.promptReflections.push(entry);
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