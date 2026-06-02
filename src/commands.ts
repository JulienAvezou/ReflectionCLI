import * as fs from 'fs';
import inquirer from 'inquirer';
import {
  addArchetypeResult,
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
  createExplainBackEntry,
  createHeatmapSnapshot,
  createLearningEntry,
  createOutsourcingAuditEntry,
  createPromptReflectionEntry,
  createThinkingModeSession,
  createThinkingScoreEntry,
  getDecisionEntry,
  getDebtItem,
  getLatestHeatmapSnapshot,
  listDecisionEntries,
  listDebtItems,
  readLog,
  resolveDebtItem,
} from './storage';
import {
  formatArchetype,
  formatDecision,
  formatDecisionList,
  formatDebtItem,
  formatDebtList,
  formatExplainBackEntry,
  formatHeatmap,
  formatLearningEntry,
  formatOutsourcingAudit,
  formatPractice,
  formatPromptReflection,
  formatThinkingModeSession,
  formatThinkingScore,
} from './format';
import { saveMarkdownReport, generateWeeklyReport } from './report';
import {
  CognitiveArchetype,
  DecisionReview,
  ExplainBackAssessment,
  HeatmapAreaScore,
  LearningSections,
  OutsourcingAuditEntry,
  ThinkingScoreDimension,
} from './types';
import {
  analyzeHeatmap,
  calculateOutsourcingRisk,
  calculateThinkingScore,
  DEFAULT_HEATMAP_AREAS,
  generatePractice,
  improvePrompt,
  recommendThinkingMode,
  scoreArchetype,
  SCORE_DIMENSIONS,
} from './thinking';

type OptionValue = string | boolean;

interface ParsedArgs {
  positionals: string[];
  options: Record<string, OptionValue>;
}

const LEARNING_OPTION_KEYS: Record<keyof LearningSections, string> = {
  whatIUnderstood: 'understood',
  whatAiHelpedWith: 'ai-helped',
  whatIMayHaveOutsourcedToAi: 'outsourced',
  whatIStillDoNotFullyUnderstand: 'unclear',
  reusablePattern: 'pattern',
  explainBackQuestion: 'question',
  nextLearningAction: 'next',
};

function parseArgs(args: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, OptionValue> = {};

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
      } else {
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

function stringOption(options: Record<string, OptionValue>, key: string): string | undefined {
  const value = options[key];
  return typeof value === 'string' ? value : undefined;
}

function booleanOption(options: Record<string, OptionValue>, key: string): boolean {
  return options[key] === true;
}

function parseTags(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
}

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseYesNo(value: string | undefined, label: string): boolean {
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

function parseDateOption(value: string | undefined, label: string): string {
  const date = requireText(value, label);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
    throw new Error(`${label} must use YYYY-MM-DD`);
  }
  return date;
}

function parseScoreList(value: string | undefined): number[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => !Number.isNaN(value));
}

function requireId(id: string | undefined, usage: string): string {
  if (!id) {
    throw new Error(`Missing id. Usage: ${usage}`);
  }
  return id;
}

function requireText(value: string | undefined, label: string): string {
  if (!value?.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

async function promptDebtTitle(existingTitle?: string): Promise<string> {
  if (existingTitle?.trim()) {
    return existingTitle.trim();
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'What do you still not fully understand?',
      validate: (answer: string) =>
        answer.trim() ? true : 'Please describe the comprehension debt.',
    },
  ]);
  return answers.title;
}

export async function runDebtCommand(args: string[]): Promise<void> {
  const [action, ...rest] = args;
  const parsed = parseArgs(rest);

  if (!action || action === 'list') {
    const status = booleanOption(parsed.options, 'all')
      ? 'all'
      : booleanOption(parsed.options, 'resolved')
        ? 'resolved'
        : 'open';
    let items = listDebtItems(status);
    const project = stringOption(parsed.options, 'project');
    const tag = stringOption(parsed.options, 'tag')?.replace(/^#/, '');

    if (project) {
      items = items.filter((item) => item.project === project);
    }
    if (tag) {
      items = items.filter((item) => item.tags.includes(tag));
    }

    console.log(formatDebtList(items));
    return;
  }

  if (action === 'add') {
    const titleFromArgs = stringOption(parsed.options, 'title') ?? parsed.positionals.join(' ');
    const title = await promptDebtTitle(titleFromArgs);
    const item = createDebtItem({
      title,
      context: stringOption(parsed.options, 'context'),
      project: stringOption(parsed.options, 'project'),
      tags: parseTags(stringOption(parsed.options, 'tags')),
      sourceReflection: stringOption(parsed.options, 'source-reflection'),
    });
    addDebtItem(item);
    console.log(`Added comprehension debt ${item.id}: ${item.title}`);
    return;
  }

  if (action === 'resolve') {
    const id = requireId(parsed.positionals[0], 'reflection debt resolve <id>');
    const item = resolveDebtItem(id);
    console.log(`Resolved comprehension debt ${item.id}: ${item.title}`);
    return;
  }

  if (action === 'show') {
    const id = requireId(parsed.positionals[0], 'reflection debt show <id>');
    const item = getDebtItem(id);
    if (!item) {
      throw new Error(`No comprehension debt item found with id "${id}"`);
    }
    console.log(formatDebtItem(item));
    return;
  }

  throw new Error(`Unknown debt command: ${action}`);
}

function sectionsFromOptions(options: Record<string, OptionValue>): LearningSections | null {
  const values = Object.entries(LEARNING_OPTION_KEYS).reduce(
    (sections, [sectionKey, optionKey]) => {
      const value = stringOption(options, optionKey);
      if (value) {
        return { ...sections, [sectionKey]: value };
      }
      return sections;
    },
    {} as Partial<LearningSections>
  );

  const hasAllSections = Object.keys(LEARNING_OPTION_KEYS).every((sectionKey) =>
    Boolean(values[sectionKey as keyof LearningSections])
  );

  return hasAllSections ? (values as LearningSections) : null;
}

async function promptLearningSections(
  defaults: Partial<LearningSections> = {}
): Promise<LearningSections> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'whatIUnderstood',
      message: 'What I understood',
      default: defaults.whatIUnderstood,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'whatAiHelpedWith',
      message: 'What AI helped with',
      default: defaults.whatAiHelpedWith,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'whatIMayHaveOutsourcedToAi',
      message: 'What I may have outsourced to AI',
      default: defaults.whatIMayHaveOutsourcedToAi,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'whatIStillDoNotFullyUnderstand',
      message: 'What I still do not fully understand',
      default: defaults.whatIStillDoNotFullyUnderstand,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'reusablePattern',
      message: 'Reusable pattern',
      default: defaults.reusablePattern,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'explainBackQuestion',
      message: 'Explain-back question',
      default: defaults.explainBackQuestion,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'nextLearningAction',
      message: 'Next learning action',
      default: defaults.nextLearningAction,
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
  ]);

  return answers as LearningSections;
}

export async function runLearnCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const filePath = stringOption(parsed.options, 'from');
  const defaults: Partial<LearningSections> = {};

  if (filePath) {
    defaults.whatIUnderstood = fs.readFileSync(filePath, 'utf-8').trim();
  }

  const sections = sectionsFromOptions(parsed.options) ?? (await promptLearningSections(defaults));
  const entry = createLearningEntry({
    project: stringOption(parsed.options, 'project'),
    source: filePath ?? stringOption(parsed.options, 'source'),
    sections,
  });

  addLearningEntry(entry);
  console.log(formatLearningEntry(entry));
}

function parseAssessment(value: string | undefined): ExplainBackAssessment | null {
  if (!value) {
    return null;
  }
  if (value === 'strong' || value === 'incomplete' || value === 'weak') {
    return value;
  }
  throw new Error('Assessment must be one of: strong, incomplete, weak');
}

async function promptExplainBack(options: Record<string, OptionValue>): Promise<{
  topic: string;
  canExplainWithoutCode: string;
  tradeoff: string;
  changedAssumption: string;
  explanationForDeveloper: string;
  assessment: ExplainBackAssessment;
  shouldCreateDebt: boolean;
}> {
  const assessment = parseAssessment(stringOption(options, 'assessment'));
  const hasAllFlags =
    stringOption(options, 'topic') &&
    stringOption(options, 'without-code') &&
    stringOption(options, 'tradeoff') &&
    stringOption(options, 'changed-assumption') &&
    stringOption(options, 'explain-to-developer') &&
    assessment;

  if (hasAllFlags) {
    return {
      topic: requireText(stringOption(options, 'topic'), 'Topic'),
      canExplainWithoutCode: requireText(
        stringOption(options, 'without-code'),
        'Can explain without code'
      ),
      tradeoff: requireText(stringOption(options, 'tradeoff'), 'Tradeoff'),
      changedAssumption: requireText(
        stringOption(options, 'changed-assumption'),
        'Changed assumption'
      ),
      explanationForDeveloper: requireText(
        stringOption(options, 'explain-to-developer'),
        'Explanation for another developer'
      ),
      assessment,
      shouldCreateDebt: booleanOption(options, 'create-debt'),
    };
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'topic',
      message: 'What do you want to explain back?',
      default: stringOption(options, 'topic'),
      validate: (answer: string) => (answer.trim() ? true : 'Topic is required.'),
    },
    {
      type: 'input',
      name: 'canExplainWithoutCode',
      message: 'Can you explain this without looking at the code?',
      default: stringOption(options, 'without-code'),
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'tradeoff',
      message: 'What tradeoff did you make?',
      default: stringOption(options, 'tradeoff'),
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'changedAssumption',
      message: 'What would break if this assumption changed?',
      default: stringOption(options, 'changed-assumption'),
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
    },
    {
      type: 'input',
      name: 'explanationForDeveloper',
      message: 'How would you explain this to another developer?',
      default: stringOption(options, 'explain-to-developer'),
      validate: (answer: string) => (answer.trim() ? true : 'This is required.'),
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

export async function runExplainCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const answers = await promptExplainBack(parsed.options);
  let createdDebtId: string | undefined;

  if (answers.assessment !== 'strong' && answers.shouldCreateDebt) {
    const debt = createDebtItem({
      title: `Explain-back gap: ${answers.topic}`,
      context: answers.explanationForDeveloper,
      project: stringOption(parsed.options, 'project'),
      tags: ['explain-back'],
    });
    addDebtItem(debt);
    createdDebtId = debt.id;
  }

  const entry = createExplainBackEntry({
    topic: answers.topic,
    project: stringOption(parsed.options, 'project'),
    canExplainWithoutCode: answers.canExplainWithoutCode,
    tradeoff: answers.tradeoff,
    changedAssumption: answers.changedAssumption,
    explanationForDeveloper: answers.explanationForDeveloper,
    assessment: answers.assessment,
    createdDebtId,
  });

  addExplainBackEntry(entry);
  console.log(formatExplainBackEntry(entry));
}

export async function runModeCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  let goal = stringOption(parsed.options, 'goal') ?? parsed.positionals.join(' ');

  if (!goal.trim()) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'goal',
        message: 'What are you trying to do with AI right now?',
        validate: (answer: string) => (answer.trim() ? true : 'Goal is required.'),
      },
    ]);
    goal = answers.goal;
  }

  const recommendation = recommendThinkingMode(goal);
  const session = createThinkingModeSession({
    project: stringOption(parsed.options, 'project'),
    goal,
    recommendedMode: recommendation.mode,
    reason: recommendation.reason,
    prompts: recommendation.prompts,
    saved: !booleanOption(parsed.options, 'no-save'),
  });

  if (!booleanOption(parsed.options, 'no-save')) {
    addThinkingModeSession(session);
  }

  console.log(formatThinkingModeSession(session));
}

async function collectScoreAnswers(
  options: Record<string, OptionValue>
): Promise<Record<ThinkingScoreDimension, number[]>> {
  const fromFlags = SCORE_DIMENSIONS.reduce(
    (result, dimension) => {
      result[dimension] = parseScoreList(stringOption(options, dimension));
      return result;
    },
    {} as Record<ThinkingScoreDimension, number[]>
  );

  if (SCORE_DIMENSIONS.every((dimension) => fromFlags[dimension].length > 0)) {
    return fromFlags;
  }

  const answers = await inquirer.prompt(
    SCORE_DIMENSIONS.flatMap((dimension) => [
      {
        type: 'number',
        name: `${dimension}1`,
        message: `${dimension}: how strong was this today? (1-5)`,
        validate: (answer: number) =>
          Number.isInteger(answer) && answer >= 1 && answer <= 5
            ? true
            : 'Enter an integer from 1 to 5.',
      },
      {
        type: 'number',
        name: `${dimension}2`,
        message: `${dimension}: how consistently did you apply it? (1-5)`,
        validate: (answer: number) =>
          Number.isInteger(answer) && answer >= 1 && answer <= 5
            ? true
            : 'Enter an integer from 1 to 5.',
      },
    ])
  );

  return SCORE_DIMENSIONS.reduce(
    (result, dimension) => {
      result[dimension] = [answers[`${dimension}1`], answers[`${dimension}2`]];
      return result;
    },
    {} as Record<ThinkingScoreDimension, number[]>
  );
}

export async function runScoreCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const score = calculateThinkingScore(await collectScoreAnswers(parsed.options));
  const entry = createThinkingScoreEntry({
    project: stringOption(parsed.options, 'project'),
    ...score,
  });
  addThinkingScoreEntry(entry);
  console.log(formatThinkingScore(entry));
}

async function collectAuditAnswers(
  options: Record<string, OptionValue>
): Promise<OutsourcingAuditEntry['answers']> {
  const keys: Array<keyof OutsourcingAuditEntry['answers']> = [
    'aiGenerated',
    'verifiedOutput',
    'canExplain',
    'testedEdgeCases',
    'comparedAlternatives',
    'challengedSuggestion',
  ];
  const flagNames: Record<keyof OutsourcingAuditEntry['answers'], string> = {
    aiGenerated: 'ai-generated',
    verifiedOutput: 'verified',
    canExplain: 'can-explain',
    testedEdgeCases: 'edge-cases',
    comparedAlternatives: 'alternatives',
    challengedSuggestion: 'challenged',
  };

  if (keys.every((key) => stringOption(options, flagNames[key]))) {
    return keys.reduce(
      (result, key) => {
        result[key] = parseYesNo(stringOption(options, flagNames[key]), flagNames[key]);
        return result;
      },
      {} as OutsourcingAuditEntry['answers']
    );
  }

  const answers = await inquirer.prompt([
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

  return answers as OutsourcingAuditEntry['answers'];
}

export async function runAuditCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const answers = await collectAuditAnswers(parsed.options);
  const risk = calculateOutsourcingRisk(answers);
  let createdExplainBackId: string | undefined;
  let createdDebtId: string | undefined;

  if (booleanOption(parsed.options, 'create-explain')) {
    const explain = createExplainBackEntry({
      topic: 'AI outsourcing audit follow-up',
      project: stringOption(parsed.options, 'project'),
      canExplainWithoutCode: answers.canExplain ? 'Yes' : 'Not yet',
      tradeoff: 'Used AI assistance while preserving developer judgment.',
      changedAssumption:
        'If the AI suggestion is wrong, verification and explanation need to catch it.',
      explanationForDeveloper: risk.suggestedNextAction,
      assessment: answers.canExplain ? 'strong' : 'incomplete',
    });
    addExplainBackEntry(explain);
    createdExplainBackId = explain.id;
  }

  if (booleanOption(parsed.options, 'create-debt') && risk.risk !== 'Low') {
    const debt = createDebtItem({
      title: `AI outsourcing risk: ${risk.riskAreas[0]}`,
      context: risk.suggestedNextAction,
      project: stringOption(parsed.options, 'project'),
      tags: ['ai-outsourcing'],
    });
    addDebtItem(debt);
    createdDebtId = debt.id;
  }

  const entry = createOutsourcingAuditEntry({
    project: stringOption(parsed.options, 'project'),
    answers,
    ...risk,
    createdExplainBackId,
    createdDebtId,
  });
  addOutsourcingAuditEntry(entry);
  console.log(formatOutsourcingAudit(entry));
}

async function collectDecisionInput(options: Record<string, OptionValue>) {
  const hasFlags =
    stringOption(options, 'title') &&
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

  const answers = await inquirer.prompt([
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
      validate: (answer: string) => (/^\d{4}-\d{2}-\d{2}$/.test(answer) ? true : 'Use YYYY-MM-DD.'),
    },
  ]);

  return {
    ...answers,
    optionsConsidered: parseList(answers.optionsConsidered),
  };
}

function requirePromptText(answer: string): true | string {
  return answer.trim() ? true : 'This is required.';
}

export async function runDecideCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const input = await collectDecisionInput(parsed.options);
  const entry = createDecisionEntry({
    project: stringOption(parsed.options, 'project'),
    tags: parseTags(stringOption(parsed.options, 'tags')),
    ...input,
  });
  addDecisionEntry(entry);
  console.log(formatDecision(entry));
}

export async function runDecisionsCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  let entries = listDecisionEntries();
  const project = stringOption(parsed.options, 'project');
  if (project) {
    entries = entries.filter((entry) => entry.project === project);
  }
  console.log(formatDecisionList(entries));
}

async function collectDecisionReview(
  options: Record<string, OptionValue>
): Promise<DecisionReview> {
  const hasFlags =
    stringOption(options, 'what-happened') &&
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

  const answers = await inquirer.prompt([
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
  } as DecisionReview;
}

export async function runDecisionCommand(args: string[]): Promise<void> {
  const [action, id, ...rest] = args;
  const parsed = parseArgs(rest);

  if (action === 'show') {
    const entry = getDecisionEntry(requireId(id, 'reflection decision show <id>'));
    if (!entry) {
      throw new Error(`No decision found with id "${id}"`);
    }
    console.log(formatDecision(entry));
    return;
  }

  if (action === 'review') {
    const entry = addDecisionReview(
      requireId(id, 'reflection decision review <id>'),
      await collectDecisionReview(parsed.options)
    );
    console.log(formatDecision(entry));
    return;
  }

  throw new Error(`Unknown decision command: ${action ?? ''}`);
}

function parseHeatmapScores(value: string | undefined): HeatmapAreaScore[] {
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

async function collectHeatmapScores(options: Record<string, OptionValue>): Promise<{
  scale: 5 | 10;
  areas: HeatmapAreaScore[];
}> {
  const scale = Number(stringOption(options, 'scale') ?? '5') as 5 | 10;
  const fromFlag = parseHeatmapScores(stringOption(options, 'scores'));
  if (fromFlag.length > 0) {
    return { scale, areas: fromFlag };
  }

  const answers = await inquirer.prompt(
    DEFAULT_HEATMAP_AREAS.map((area) => ({
      type: 'number',
      name: area,
      message: `${area} understanding (1-${scale})`,
      validate: (answer: number) =>
        Number.isInteger(answer) && answer >= 1 && answer <= scale
          ? true
          : `Enter an integer from 1 to ${scale}.`,
    }))
  );

  return {
    scale,
    areas: DEFAULT_HEATMAP_AREAS.map((area) => ({ area, score: answers[area] })),
  };
}

export async function runHeatmapCommand(args: string[]): Promise<void> {
  const [action, ...rest] = args;
  const parsed = parseArgs(action === 'update' || action === 'report' ? rest : args);
  const project = stringOption(parsed.options, 'project');

  if (!action || action === 'update') {
    const input = await collectHeatmapScores(parsed.options);
    const analysis = analyzeHeatmap(input.areas, input.scale);
    const snapshot = createHeatmapSnapshot({ project, scale: input.scale, ...analysis });
    addHeatmapSnapshot(snapshot);
    console.log(formatHeatmap(snapshot));
    return;
  }

  if (action === 'report') {
    const snapshot = getLatestHeatmapSnapshot(project);
    if (!snapshot) {
      console.log('No heatmap snapshots recorded yet.');
      return;
    }
    console.log(formatHeatmap(snapshot));
    return;
  }

  throw new Error(`Unknown heatmap command: ${action}`);
}

async function collectArchetypeAnswers(
  options: Record<string, OptionValue>
): Promise<CognitiveArchetype[]> {
  const fromFlag = parseList(stringOption(options, 'answers')) as CognitiveArchetype[];
  if (fromFlag.length > 0) {
    return fromFlag;
  }

  const choices: Array<{ name: string; value: CognitiveArchetype }> = [
    { name: 'I often accept AI output quickly.', value: 'AI Autopilot' },
    { name: 'I use AI mostly to execute my plan.', value: 'AI Assistant' },
    { name: 'I ask AI to critique or challenge me.', value: 'AI Challenger' },
    { name: 'I use AI strategically while owning direction.', value: 'AI Architect' },
  ];

  const answers = await inquirer.prompt(
    [1, 2, 3, 4, 5].map((index) => ({
      type: 'list',
      name: `q${index}`,
      message: `AI collaboration pattern ${index}`,
      choices,
    }))
  );

  return [answers.q1, answers.q2, answers.q3, answers.q4, answers.q5];
}

export async function runArchetypeCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const result = scoreArchetype(await collectArchetypeAnswers(parsed.options));
  const entry = createArchetypeResult({
    project: stringOption(parsed.options, 'project'),
    ...result,
  });
  addArchetypeResult(entry);
  console.log(formatArchetype(entry));
}

export async function runPracticeCommand(_args: string[]): Promise<void> {
  console.log(formatPractice(generatePractice(readLog())));
}

async function collectPromptReflection(options: Record<string, OptionValue>) {
  const hasFlags =
    stringOption(options, 'prompt') &&
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
      improvedPrompt:
        stringOption(options, 'improved') ??
        improvePrompt({ promptUsed, goal, hiddenAssumptions, unclear }),
      lessonsLearned: requireText(stringOption(options, 'lessons'), 'Lessons learned'),
    };
  }

  const answers = await inquirer.prompt([
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
    improvedPrompt: improvePrompt({
      promptUsed: answers.promptUsed,
      goal: answers.goal,
      hiddenAssumptions: answers.hiddenAssumptions,
      unclear: answers.unclear,
    }),
  };
}

export async function runPromptCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const input = await collectPromptReflection(parsed.options);
  const entry = createPromptReflectionEntry({
    project: stringOption(parsed.options, 'project'),
    tags: parseTags(stringOption(parsed.options, 'tags')),
    ...input,
  });
  addPromptReflectionEntry(entry);
  console.log(formatPromptReflection(entry));
}

export async function runWeeklyCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);
  const markdown = generateWeeklyReport(readLog(), {
    since: stringOption(parsed.options, 'since'),
    until: stringOption(parsed.options, 'until'),
  });
  const output = stringOption(parsed.options, 'output');

  if (output) {
    saveMarkdownReport(output, markdown);
  }

  console.log(markdown);
  if (output) {
    console.log(`\nSaved weekly report to ${output}`);
  }
}
