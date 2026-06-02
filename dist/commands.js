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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDebtCommand = runDebtCommand;
exports.runLearnCommand = runLearnCommand;
exports.runExplainCommand = runExplainCommand;
exports.runModeCommand = runModeCommand;
exports.runScoreCommand = runScoreCommand;
exports.runAuditCommand = runAuditCommand;
exports.runDecideCommand = runDecideCommand;
exports.runDecisionsCommand = runDecisionsCommand;
exports.runDecisionCommand = runDecisionCommand;
exports.runHeatmapCommand = runHeatmapCommand;
exports.runArchetypeCommand = runArchetypeCommand;
exports.runPracticeCommand = runPracticeCommand;
exports.runPromptCommand = runPromptCommand;
exports.runWeeklyCommand = runWeeklyCommand;
const fs = __importStar(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const storage_1 = require("./storage");
const format_1 = require("./format");
const report_1 = require("./report");
const thinking_1 = require("./thinking");
const LEARNING_OPTION_KEYS = {
    whatIUnderstood: 'understood',
    whatAiHelpedWith: 'ai-helped',
    whatIMayHaveOutsourcedToAi: 'outsourced',
    whatIStillDoNotFullyUnderstand: 'unclear',
    reusablePattern: 'pattern',
    explainBackQuestion: 'question',
    nextLearningAction: 'next',
};
function parseArgs(args) {
    const positionals = [];
    const options = {};
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg.startsWith('--')) {
            const [rawKey, rawValue] = arg.slice(2).split('=', 2);
            if (rawValue !== undefined) {
                options[rawKey] = rawValue;
                continue;
            }
            const next = args[index + 1];
            if (next && !next.startsWith('-')) {
                options[rawKey] = next;
                index += 1;
            }
            else {
                options[rawKey] = true;
            }
            continue;
        }
        if (arg === '-o') {
            const next = args[index + 1];
            if (!next) {
                throw new Error('Missing value for -o');
            }
            options.output = next;
            index += 1;
            continue;
        }
        positionals.push(arg);
    }
    return { positionals, options };
}
function stringOption(options, key) {
    const value = options[key];
    return typeof value === 'string' ? value : undefined;
}
function booleanOption(options, key) {
    return options[key] === true;
}
function parseTags(value) {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean);
}
function parseList(value) {
    if (!value) {
        return [];
    }
    return value
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);
}
function parseYesNo(value, label) {
    if (!value) {
        throw new Error(`${label} is required`);
    }
    const normalized = value.toLowerCase();
    if (['yes', 'y', 'true', '1'].includes(normalized)) {
        return true;
    }
    if (['no', 'n', 'false', '0'].includes(normalized)) {
        return false;
    }
    throw new Error(`${label} must be yes or no`);
}
function parseDateOption(value, label) {
    const date = requireText(value, label);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
        throw new Error(`${label} must use YYYY-MM-DD`);
    }
    return date;
}
function parseScoreList(value) {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((value) => !Number.isNaN(value));
}
function requireId(id, usage) {
    if (!id) {
        throw new Error(`Missing id. Usage: ${usage}`);
    }
    return id;
}
function requireText(value, label) {
    if (!value?.trim()) {
        throw new Error(`${label} is required`);
    }
    return value.trim();
}
async function promptDebtTitle(existingTitle) {
    if (existingTitle?.trim()) {
        return existingTitle.trim();
    }
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What do you still not fully understand?',
            validate: (answer) => answer.trim() ? true : 'Please describe the comprehension debt.',
        },
    ]);
    return answers.title;
}
async function runDebtCommand(args) {
    const [action, ...rest] = args;
    const parsed = parseArgs(rest);
    if (!action || action === 'list') {
        const status = booleanOption(parsed.options, 'all')
            ? 'all'
            : booleanOption(parsed.options, 'resolved')
                ? 'resolved'
                : 'open';
        let items = (0, storage_1.listDebtItems)(status);
        const project = stringOption(parsed.options, 'project');
        const tag = stringOption(parsed.options, 'tag')?.replace(/^#/, '');
        if (project) {
            items = items.filter((item) => item.project === project);
        }
        if (tag) {
            items = items.filter((item) => item.tags.includes(tag));
        }
        console.log((0, format_1.formatDebtList)(items));
        return;
    }
    if (action === 'add') {
        const titleFromArgs = stringOption(parsed.options, 'title') ?? parsed.positionals.join(' ');
        const title = await promptDebtTitle(titleFromArgs);
        const item = (0, storage_1.createDebtItem)({
            title,
            context: stringOption(parsed.options, 'context'),
            project: stringOption(parsed.options, 'project'),
            tags: parseTags(stringOption(parsed.options, 'tags')),
            sourceReflection: stringOption(parsed.options, 'source-reflection'),
        });
        (0, storage_1.addDebtItem)(item);
        console.log(`Added comprehension debt ${item.id}: ${item.title}`);
        return;
    }
    if (action === 'resolve') {
        const id = requireId(parsed.positionals[0], 'reflection debt resolve <id>');
        const item = (0, storage_1.resolveDebtItem)(id);
        console.log(`Resolved comprehension debt ${item.id}: ${item.title}`);
        return;
    }
    if (action === 'show') {
        const id = requireId(parsed.positionals[0], 'reflection debt show <id>');
        const item = (0, storage_1.getDebtItem)(id);
        if (!item) {
            throw new Error(`No comprehension debt item found with id "${id}"`);
        }
        console.log((0, format_1.formatDebtItem)(item));
        return;
    }
    throw new Error(`Unknown debt command: ${action}`);
}
function sectionsFromOptions(options) {
    const values = Object.entries(LEARNING_OPTION_KEYS).reduce((sections, [sectionKey, optionKey]) => {
        const value = stringOption(options, optionKey);
        if (value) {
            return { ...sections, [sectionKey]: value };
        }
        return sections;
    }, {});
    const hasAllSections = Object.keys(LEARNING_OPTION_KEYS).every((sectionKey) => Boolean(values[sectionKey]));
    return hasAllSections ? values : null;
}
async function promptLearningSections(defaults = {}) {
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'whatIUnderstood',
            message: 'What I understood',
            default: defaults.whatIUnderstood,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'whatAiHelpedWith',
            message: 'What AI helped with',
            default: defaults.whatAiHelpedWith,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'whatIMayHaveOutsourcedToAi',
            message: 'What I may have outsourced to AI',
            default: defaults.whatIMayHaveOutsourcedToAi,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'whatIStillDoNotFullyUnderstand',
            message: 'What I still do not fully understand',
            default: defaults.whatIStillDoNotFullyUnderstand,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'reusablePattern',
            message: 'Reusable pattern',
            default: defaults.reusablePattern,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'explainBackQuestion',
            message: 'Explain-back question',
            default: defaults.explainBackQuestion,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'nextLearningAction',
            message: 'Next learning action',
            default: defaults.nextLearningAction,
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
    ]);
    return answers;
}
async function runLearnCommand(args) {
    const parsed = parseArgs(args);
    const filePath = stringOption(parsed.options, 'from');
    const defaults = {};
    if (filePath) {
        defaults.whatIUnderstood = fs.readFileSync(filePath, 'utf-8').trim();
    }
    const sections = sectionsFromOptions(parsed.options) ?? (await promptLearningSections(defaults));
    const entry = (0, storage_1.createLearningEntry)({
        project: stringOption(parsed.options, 'project'),
        source: filePath ?? stringOption(parsed.options, 'source'),
        sections,
    });
    (0, storage_1.addLearningEntry)(entry);
    console.log((0, format_1.formatLearningEntry)(entry));
}
function parseAssessment(value) {
    if (!value) {
        return null;
    }
    if (value === 'strong' || value === 'incomplete' || value === 'weak') {
        return value;
    }
    throw new Error('Assessment must be one of: strong, incomplete, weak');
}
async function promptExplainBack(options) {
    const assessment = parseAssessment(stringOption(options, 'assessment'));
    const hasAllFlags = stringOption(options, 'topic') &&
        stringOption(options, 'without-code') &&
        stringOption(options, 'tradeoff') &&
        stringOption(options, 'changed-assumption') &&
        stringOption(options, 'explain-to-developer') &&
        assessment;
    if (hasAllFlags) {
        return {
            topic: requireText(stringOption(options, 'topic'), 'Topic'),
            canExplainWithoutCode: requireText(stringOption(options, 'without-code'), 'Can explain without code'),
            tradeoff: requireText(stringOption(options, 'tradeoff'), 'Tradeoff'),
            changedAssumption: requireText(stringOption(options, 'changed-assumption'), 'Changed assumption'),
            explanationForDeveloper: requireText(stringOption(options, 'explain-to-developer'), 'Explanation for another developer'),
            assessment,
            shouldCreateDebt: booleanOption(options, 'create-debt'),
        };
    }
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'topic',
            message: 'What do you want to explain back?',
            default: stringOption(options, 'topic'),
            validate: (answer) => (answer.trim() ? true : 'Topic is required.'),
        },
        {
            type: 'input',
            name: 'canExplainWithoutCode',
            message: 'Can you explain this without looking at the code?',
            default: stringOption(options, 'without-code'),
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'tradeoff',
            message: 'What tradeoff did you make?',
            default: stringOption(options, 'tradeoff'),
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'changedAssumption',
            message: 'What would break if this assumption changed?',
            default: stringOption(options, 'changed-assumption'),
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'input',
            name: 'explanationForDeveloper',
            message: 'How would you explain this to another developer?',
            default: stringOption(options, 'explain-to-developer'),
            validate: (answer) => (answer.trim() ? true : 'This is required.'),
        },
        {
            type: 'list',
            name: 'assessment',
            message: 'How strong is this explanation?',
            choices: ['strong', 'incomplete', 'weak'],
            default: assessment ?? 'strong',
        },
        {
            type: 'confirm',
            name: 'shouldCreateDebt',
            message: 'Create a comprehension debt item for this?',
            default: true,
            when: (currentAnswers) => currentAnswers.assessment !== 'strong',
        },
    ]);
    return {
        topic: answers.topic,
        canExplainWithoutCode: answers.canExplainWithoutCode,
        tradeoff: answers.tradeoff,
        changedAssumption: answers.changedAssumption,
        explanationForDeveloper: answers.explanationForDeveloper,
        assessment: answers.assessment,
        shouldCreateDebt: Boolean(answers.shouldCreateDebt),
    };
}
async function runExplainCommand(args) {
    const parsed = parseArgs(args);
    const answers = await promptExplainBack(parsed.options);
    let createdDebtId;
    if (answers.assessment !== 'strong' && answers.shouldCreateDebt) {
        const debt = (0, storage_1.createDebtItem)({
            title: `Explain-back gap: ${answers.topic}`,
            context: answers.explanationForDeveloper,
            project: stringOption(parsed.options, 'project'),
            tags: ['explain-back'],
        });
        (0, storage_1.addDebtItem)(debt);
        createdDebtId = debt.id;
    }
    const entry = (0, storage_1.createExplainBackEntry)({
        topic: answers.topic,
        project: stringOption(parsed.options, 'project'),
        canExplainWithoutCode: answers.canExplainWithoutCode,
        tradeoff: answers.tradeoff,
        changedAssumption: answers.changedAssumption,
        explanationForDeveloper: answers.explanationForDeveloper,
        assessment: answers.assessment,
        createdDebtId,
    });
    (0, storage_1.addExplainBackEntry)(entry);
    console.log((0, format_1.formatExplainBackEntry)(entry));
}
async function runModeCommand(args) {
    const parsed = parseArgs(args);
    let goal = stringOption(parsed.options, 'goal') ?? parsed.positionals.join(' ');
    if (!goal.trim()) {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'goal',
                message: 'What are you trying to do with AI right now?',
                validate: (answer) => (answer.trim() ? true : 'Goal is required.'),
            },
        ]);
        goal = answers.goal;
    }
    const recommendation = (0, thinking_1.recommendThinkingMode)(goal);
    const session = (0, storage_1.createThinkingModeSession)({
        project: stringOption(parsed.options, 'project'),
        goal,
        recommendedMode: recommendation.mode,
        reason: recommendation.reason,
        prompts: recommendation.prompts,
        saved: !booleanOption(parsed.options, 'no-save'),
    });
    if (!booleanOption(parsed.options, 'no-save')) {
        (0, storage_1.addThinkingModeSession)(session);
    }
    console.log((0, format_1.formatThinkingModeSession)(session));
}
async function collectScoreAnswers(options) {
    const fromFlags = thinking_1.SCORE_DIMENSIONS.reduce((result, dimension) => {
        result[dimension] = parseScoreList(stringOption(options, dimension));
        return result;
    }, {});
    if (thinking_1.SCORE_DIMENSIONS.every((dimension) => fromFlags[dimension].length > 0)) {
        return fromFlags;
    }
    const answers = await inquirer_1.default.prompt(thinking_1.SCORE_DIMENSIONS.flatMap((dimension) => [
        {
            type: 'number',
            name: `${dimension}1`,
            message: `${dimension}: how strong was this today? (1-5)`,
            validate: (answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5
                ? true
                : 'Enter an integer from 1 to 5.',
        },
        {
            type: 'number',
            name: `${dimension}2`,
            message: `${dimension}: how consistently did you apply it? (1-5)`,
            validate: (answer) => Number.isInteger(answer) && answer >= 1 && answer <= 5
                ? true
                : 'Enter an integer from 1 to 5.',
        },
    ]));
    return thinking_1.SCORE_DIMENSIONS.reduce((result, dimension) => {
        result[dimension] = [answers[`${dimension}1`], answers[`${dimension}2`]];
        return result;
    }, {});
}
async function runScoreCommand(args) {
    const parsed = parseArgs(args);
    const score = (0, thinking_1.calculateThinkingScore)(await collectScoreAnswers(parsed.options));
    const entry = (0, storage_1.createThinkingScoreEntry)({
        project: stringOption(parsed.options, 'project'),
        ...score,
    });
    (0, storage_1.addThinkingScoreEntry)(entry);
    console.log((0, format_1.formatThinkingScore)(entry));
}
async function collectAuditAnswers(options) {
    const keys = [
        'aiGenerated',
        'verifiedOutput',
        'canExplain',
        'testedEdgeCases',
        'comparedAlternatives',
        'challengedSuggestion',
    ];
    const flagNames = {
        aiGenerated: 'ai-generated',
        verifiedOutput: 'verified',
        canExplain: 'can-explain',
        testedEdgeCases: 'edge-cases',
        comparedAlternatives: 'alternatives',
        challengedSuggestion: 'challenged',
    };
    if (keys.every((key) => stringOption(options, flagNames[key]))) {
        return keys.reduce((result, key) => {
            result[key] = parseYesNo(stringOption(options, flagNames[key]), flagNames[key]);
            return result;
        }, {});
    }
    const answers = await inquirer_1.default.prompt([
        { type: 'confirm', name: 'aiGenerated', message: 'Did AI generate code or architecture?' },
        { type: 'confirm', name: 'verifiedOutput', message: 'Did you verify the output?' },
        { type: 'confirm', name: 'canExplain', message: 'Can you explain why it works?' },
        { type: 'confirm', name: 'testedEdgeCases', message: 'Did you test edge cases?' },
        { type: 'confirm', name: 'comparedAlternatives', message: 'Did you compare alternatives?' },
        {
            type: 'confirm',
            name: 'challengedSuggestion',
            message: "Did you modify or challenge the AI's suggestion?",
        },
    ]);
    return answers;
}
async function runAuditCommand(args) {
    const parsed = parseArgs(args);
    const answers = await collectAuditAnswers(parsed.options);
    const risk = (0, thinking_1.calculateOutsourcingRisk)(answers);
    let createdExplainBackId;
    let createdDebtId;
    if (booleanOption(parsed.options, 'create-explain')) {
        const explain = (0, storage_1.createExplainBackEntry)({
            topic: 'AI outsourcing audit follow-up',
            project: stringOption(parsed.options, 'project'),
            canExplainWithoutCode: answers.canExplain ? 'Yes' : 'Not yet',
            tradeoff: 'Used AI assistance while preserving developer judgment.',
            changedAssumption: 'If the AI suggestion is wrong, verification and explanation need to catch it.',
            explanationForDeveloper: risk.suggestedNextAction,
            assessment: answers.canExplain ? 'strong' : 'incomplete',
        });
        (0, storage_1.addExplainBackEntry)(explain);
        createdExplainBackId = explain.id;
    }
    if (booleanOption(parsed.options, 'create-debt') && risk.risk !== 'Low') {
        const debt = (0, storage_1.createDebtItem)({
            title: `AI outsourcing risk: ${risk.riskAreas[0]}`,
            context: risk.suggestedNextAction,
            project: stringOption(parsed.options, 'project'),
            tags: ['ai-outsourcing'],
        });
        (0, storage_1.addDebtItem)(debt);
        createdDebtId = debt.id;
    }
    const entry = (0, storage_1.createOutsourcingAuditEntry)({
        project: stringOption(parsed.options, 'project'),
        answers,
        ...risk,
        createdExplainBackId,
        createdDebtId,
    });
    (0, storage_1.addOutsourcingAuditEntry)(entry);
    console.log((0, format_1.formatOutsourcingAudit)(entry));
}
async function collectDecisionInput(options) {
    const hasFlags = stringOption(options, 'title') &&
        stringOption(options, 'context') &&
        stringOption(options, 'options') &&
        stringOption(options, 'chosen') &&
        stringOption(options, 'reasoning') &&
        stringOption(options, 'tradeoffs') &&
        stringOption(options, 'expected') &&
        stringOption(options, 'review-date');
    if (hasFlags) {
        return {
            title: requireText(stringOption(options, 'title'), 'Decision title'),
            context: requireText(stringOption(options, 'context'), 'Context'),
            optionsConsidered: parseList(stringOption(options, 'options')),
            chosenOption: requireText(stringOption(options, 'chosen'), 'Chosen option'),
            reasoning: requireText(stringOption(options, 'reasoning'), 'Reasoning'),
            tradeoffs: requireText(stringOption(options, 'tradeoffs'), 'Tradeoffs'),
            expectedOutcome: requireText(stringOption(options, 'expected'), 'Expected outcome'),
            reviewDate: parseDateOption(stringOption(options, 'review-date'), 'Review date'),
        };
    }
    const answers = await inquirer_1.default.prompt([
        { type: 'input', name: 'title', message: 'Decision title', validate: requirePromptText },
        { type: 'input', name: 'context', message: 'Context', validate: requirePromptText },
        {
            type: 'input',
            name: 'optionsConsidered',
            message: 'Options considered (separate with |)',
            validate: requirePromptText,
        },
        { type: 'input', name: 'chosenOption', message: 'Chosen option', validate: requirePromptText },
        { type: 'input', name: 'reasoning', message: 'Reasoning', validate: requirePromptText },
        { type: 'input', name: 'tradeoffs', message: 'Tradeoffs', validate: requirePromptText },
        {
            type: 'input',
            name: 'expectedOutcome',
            message: 'Expected outcome',
            validate: requirePromptText,
        },
        {
            type: 'input',
            name: 'reviewDate',
            message: 'Review date (YYYY-MM-DD)',
            validate: (answer) => (/^\d{4}-\d{2}-\d{2}$/.test(answer) ? true : 'Use YYYY-MM-DD.'),
        },
    ]);
    return {
        ...answers,
        optionsConsidered: parseList(answers.optionsConsidered),
    };
}
function requirePromptText(answer) {
    return answer.trim() ? true : 'This is required.';
}
async function runDecideCommand(args) {
    const parsed = parseArgs(args);
    const input = await collectDecisionInput(parsed.options);
    const entry = (0, storage_1.createDecisionEntry)({
        project: stringOption(parsed.options, 'project'),
        tags: parseTags(stringOption(parsed.options, 'tags')),
        ...input,
    });
    (0, storage_1.addDecisionEntry)(entry);
    console.log((0, format_1.formatDecision)(entry));
}
async function runDecisionsCommand(args) {
    const parsed = parseArgs(args);
    let entries = (0, storage_1.listDecisionEntries)();
    const project = stringOption(parsed.options, 'project');
    if (project) {
        entries = entries.filter((entry) => entry.project === project);
    }
    console.log((0, format_1.formatDecisionList)(entries));
}
async function collectDecisionReview(options) {
    const hasFlags = stringOption(options, 'what-happened') &&
        stringOption(options, 'was-good') &&
        stringOption(options, 'what-changed') &&
        stringOption(options, 'same-again') &&
        stringOption(options, 'lessons');
    if (hasFlags) {
        return {
            reviewedAt: new Date().toISOString(),
            whatHappened: requireText(stringOption(options, 'what-happened'), 'What happened'),
            wasGoodDecision: requireText(stringOption(options, 'was-good'), 'Was good decision'),
            whatChanged: requireText(stringOption(options, 'what-changed'), 'What changed'),
            chooseSameAgain: requireText(stringOption(options, 'same-again'), 'Choose same again'),
            lessonsLearned: requireText(stringOption(options, 'lessons'), 'Lessons learned'),
        };
    }
    const answers = await inquirer_1.default.prompt([
        { type: 'input', name: 'whatHappened', message: 'What happened?', validate: requirePromptText },
        {
            type: 'input',
            name: 'wasGoodDecision',
            message: 'Was the decision good?',
            validate: requirePromptText,
        },
        { type: 'input', name: 'whatChanged', message: 'What changed?', validate: requirePromptText },
        {
            type: 'input',
            name: 'chooseSameAgain',
            message: 'Would you choose the same option again?',
            validate: requirePromptText,
        },
        {
            type: 'input',
            name: 'lessonsLearned',
            message: 'Lessons learned',
            validate: requirePromptText,
        },
    ]);
    return {
        reviewedAt: new Date().toISOString(),
        ...answers,
    };
}
async function runDecisionCommand(args) {
    const [action, id, ...rest] = args;
    const parsed = parseArgs(rest);
    if (action === 'show') {
        const entry = (0, storage_1.getDecisionEntry)(requireId(id, 'reflection decision show <id>'));
        if (!entry) {
            throw new Error(`No decision found with id "${id}"`);
        }
        console.log((0, format_1.formatDecision)(entry));
        return;
    }
    if (action === 'review') {
        const entry = (0, storage_1.addDecisionReview)(requireId(id, 'reflection decision review <id>'), await collectDecisionReview(parsed.options));
        console.log((0, format_1.formatDecision)(entry));
        return;
    }
    throw new Error(`Unknown decision command: ${action ?? ''}`);
}
function parseHeatmapScores(value) {
    if (!value) {
        return [];
    }
    return value.split(',').map((item) => {
        const [area, rawScore] = item.split(':');
        const score = Number(rawScore);
        if (!area || Number.isNaN(score)) {
            throw new Error('Heatmap scores must look like "Frontend:4,Backend:3"');
        }
        return { area: area.trim(), score };
    });
}
async function collectHeatmapScores(options) {
    const scale = Number(stringOption(options, 'scale') ?? '5');
    const fromFlag = parseHeatmapScores(stringOption(options, 'scores'));
    if (fromFlag.length > 0) {
        return { scale, areas: fromFlag };
    }
    const answers = await inquirer_1.default.prompt(thinking_1.DEFAULT_HEATMAP_AREAS.map((area) => ({
        type: 'number',
        name: area,
        message: `${area} understanding (1-${scale})`,
        validate: (answer) => Number.isInteger(answer) && answer >= 1 && answer <= scale
            ? true
            : `Enter an integer from 1 to ${scale}.`,
    })));
    return {
        scale,
        areas: thinking_1.DEFAULT_HEATMAP_AREAS.map((area) => ({ area, score: answers[area] })),
    };
}
async function runHeatmapCommand(args) {
    const [action, ...rest] = args;
    const parsed = parseArgs(action === 'update' || action === 'report' ? rest : args);
    const project = stringOption(parsed.options, 'project');
    if (!action || action === 'update') {
        const input = await collectHeatmapScores(parsed.options);
        const analysis = (0, thinking_1.analyzeHeatmap)(input.areas, input.scale);
        const snapshot = (0, storage_1.createHeatmapSnapshot)({ project, scale: input.scale, ...analysis });
        (0, storage_1.addHeatmapSnapshot)(snapshot);
        console.log((0, format_1.formatHeatmap)(snapshot));
        return;
    }
    if (action === 'report') {
        const snapshot = (0, storage_1.getLatestHeatmapSnapshot)(project);
        if (!snapshot) {
            console.log('No heatmap snapshots recorded yet.');
            return;
        }
        console.log((0, format_1.formatHeatmap)(snapshot));
        return;
    }
    throw new Error(`Unknown heatmap command: ${action}`);
}
async function collectArchetypeAnswers(options) {
    const fromFlag = parseList(stringOption(options, 'answers'));
    if (fromFlag.length > 0) {
        return fromFlag;
    }
    const choices = [
        { name: 'I often accept AI output quickly.', value: 'AI Autopilot' },
        { name: 'I use AI mostly to execute my plan.', value: 'AI Assistant' },
        { name: 'I ask AI to critique or challenge me.', value: 'AI Challenger' },
        { name: 'I use AI strategically while owning direction.', value: 'AI Architect' },
    ];
    const answers = await inquirer_1.default.prompt([1, 2, 3, 4, 5].map((index) => ({
        type: 'list',
        name: `q${index}`,
        message: `AI collaboration pattern ${index}`,
        choices,
    })));
    return [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5];
}
async function runArchetypeCommand(args) {
    const parsed = parseArgs(args);
    const result = (0, thinking_1.scoreArchetype)(await collectArchetypeAnswers(parsed.options));
    const entry = (0, storage_1.createArchetypeResult)({
        project: stringOption(parsed.options, 'project'),
        ...result,
    });
    (0, storage_1.addArchetypeResult)(entry);
    console.log((0, format_1.formatArchetype)(entry));
}
async function runPracticeCommand(_args) {
    console.log((0, format_1.formatPractice)((0, thinking_1.generatePractice)((0, storage_1.readLog)())));
}
async function collectPromptReflection(options) {
    const hasFlags = stringOption(options, 'prompt') &&
        stringOption(options, 'goal') &&
        stringOption(options, 'output') &&
        stringOption(options, 'worked') &&
        stringOption(options, 'unclear') &&
        stringOption(options, 'assumptions') &&
        stringOption(options, 'lessons');
    if (hasFlags) {
        const promptUsed = requireText(stringOption(options, 'prompt'), 'Prompt');
        const goal = requireText(stringOption(options, 'goal'), 'Goal');
        const unclear = requireText(stringOption(options, 'unclear'), 'Unclear');
        const hiddenAssumptions = requireText(stringOption(options, 'assumptions'), 'Assumptions');
        return {
            promptUsed,
            goal,
            aiOutput: requireText(stringOption(options, 'output'), 'AI output'),
            worked: requireText(stringOption(options, 'worked'), 'What worked'),
            unclear,
            hiddenAssumptions,
            improvedPrompt: stringOption(options, 'improved') ??
                (0, thinking_1.improvePrompt)({ promptUsed, goal, hiddenAssumptions, unclear }),
            lessonsLearned: requireText(stringOption(options, 'lessons'), 'Lessons learned'),
        };
    }
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'promptUsed',
            message: 'What prompt did you use?',
            validate: requirePromptText,
        },
        {
            type: 'input',
            name: 'goal',
            message: 'What were you trying to achieve?',
            validate: requirePromptText,
        },
        {
            type: 'input',
            name: 'aiOutput',
            message: 'What did AI produce?',
            validate: requirePromptText,
        },
        { type: 'input', name: 'worked', message: 'What worked?', validate: requirePromptText },
        { type: 'input', name: 'unclear', message: 'What was unclear?', validate: requirePromptText },
        {
            type: 'input',
            name: 'hiddenAssumptions',
            message: 'What hidden assumptions were in the prompt?',
            validate: requirePromptText,
        },
        {
            type: 'input',
            name: 'lessonsLearned',
            message: 'How would you improve it?',
            validate: requirePromptText,
        },
    ]);
    return {
        ...answers,
        improvedPrompt: (0, thinking_1.improvePrompt)({
            promptUsed: answers.promptUsed,
            goal: answers.goal,
            hiddenAssumptions: answers.hiddenAssumptions,
            unclear: answers.unclear,
        }),
    };
}
async function runPromptCommand(args) {
    const parsed = parseArgs(args);
    const input = await collectPromptReflection(parsed.options);
    const entry = (0, storage_1.createPromptReflectionEntry)({
        project: stringOption(parsed.options, 'project'),
        tags: parseTags(stringOption(parsed.options, 'tags')),
        ...input,
    });
    (0, storage_1.addPromptReflectionEntry)(entry);
    console.log((0, format_1.formatPromptReflection)(entry));
}
async function runWeeklyCommand(args) {
    const parsed = parseArgs(args);
    const markdown = (0, report_1.generateWeeklyReport)((0, storage_1.readLog)(), {
        since: stringOption(parsed.options, 'since'),
        until: stringOption(parsed.options, 'until'),
    });
    const output = stringOption(parsed.options, 'output');
    if (output) {
        (0, report_1.saveMarkdownReport)(output, markdown);
    }
    console.log(markdown);
    if (output) {
        console.log(`\nSaved weekly report to ${output}`);
    }
}
//# sourceMappingURL=commands.js.map