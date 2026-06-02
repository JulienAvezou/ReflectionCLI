"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTags = formatTags;
exports.formatDebtList = formatDebtList;
exports.formatDebtItem = formatDebtItem;
exports.formatLearningEntry = formatLearningEntry;
exports.formatExplainBackEntry = formatExplainBackEntry;
exports.formatThinkingModeSession = formatThinkingModeSession;
exports.formatThinkingScore = formatThinkingScore;
exports.formatOutsourcingAudit = formatOutsourcingAudit;
exports.formatDecisionList = formatDecisionList;
exports.formatDecision = formatDecision;
exports.formatHeatmap = formatHeatmap;
exports.formatArchetype = formatArchetype;
exports.formatPractice = formatPractice;
exports.formatPromptReflection = formatPromptReflection;
function formatTags(tags) {
    return tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : 'none';
}
function formatDebtList(items) {
    if (items.length === 0) {
        return 'No comprehension debt items found.';
    }
    return items
        .map((item) => {
        const project = item.project ? ` [${item.project}]` : '';
        const tags = item.tags.length > 0 ? ` ${formatTags(item.tags)}` : '';
        return `${item.id} ${item.status.toUpperCase()}${project} ${item.title}${tags}`;
    })
        .join('\n');
}
function formatDebtItem(item) {
    const lines = [
        `# ${item.title}`,
        '',
        `ID: ${item.id}`,
        `Status: ${item.status}`,
        `Created: ${item.date}`,
        `Project: ${item.project ?? 'none'}`,
        `Tags: ${formatTags(item.tags)}`,
        `Source reflection: ${item.sourceReflection ?? 'none'}`,
    ];
    if (item.resolvedAt) {
        lines.push(`Resolved: ${item.resolvedAt}`);
    }
    if (item.context) {
        lines.push('', 'Context:', item.context);
    }
    return lines.join('\n');
}
function formatLearningEntry(entry) {
    return [
        `# Learning Entry ${entry.id}`,
        '',
        `Project: ${entry.project ?? 'none'}`,
        `Source: ${entry.source ?? 'none'}`,
        '',
        '## What I understood',
        entry.sections.whatIUnderstood,
        '',
        '## What AI helped with',
        entry.sections.whatAiHelpedWith,
        '',
        '## What I may have outsourced to AI',
        entry.sections.whatIMayHaveOutsourcedToAi,
        '',
        '## What I still do not fully understand',
        entry.sections.whatIStillDoNotFullyUnderstand,
        '',
        '## Reusable pattern',
        entry.sections.reusablePattern,
        '',
        '## Explain-back question',
        entry.sections.explainBackQuestion,
        '',
        '## Next learning action',
        entry.sections.nextLearningAction,
    ].join('\n');
}
function formatExplainBackEntry(entry) {
    const lines = [
        `# Explain-Back Entry ${entry.id}`,
        '',
        `Topic: ${entry.topic}`,
        `Project: ${entry.project ?? 'none'}`,
        `Assessment: ${entry.assessment}`,
    ];
    if (entry.createdDebtId) {
        lines.push(`Created debt: ${entry.createdDebtId}`);
    }
    lines.push('', '## Can you explain this without looking at the code?', entry.canExplainWithoutCode, '', '## What tradeoff did you make?', entry.tradeoff, '', '## What would break if this assumption changed?', entry.changedAssumption, '', '## How would you explain this to another developer?', entry.explanationForDeveloper);
    return lines.join('\n');
}
function formatThinkingModeSession(entry) {
    return [
        `# Thinking Mode: ${entry.recommendedMode}`,
        '',
        `Goal: ${entry.goal}`,
        `Project: ${entry.project ?? 'none'}`,
        '',
        '## Why this mode fits',
        entry.reason,
        '',
        '## Useful prompts',
        ...entry.prompts.map((prompt) => `- ${prompt}`),
    ].join('\n');
}
function dimensionLabel(value) {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}
function formatThinkingScore(entry) {
    return [
        `# Thinking Score ${entry.id}`,
        '',
        `Total: ${entry.total}/50`,
        '',
        '## Dimensions',
        ...Object.entries(entry.dimensions).map(([dimension, score]) => `- ${dimensionLabel(dimension)}: ${score}/10`),
        '',
        `Strongest: ${dimensionLabel(entry.strongest)}`,
        `Weakest: ${dimensionLabel(entry.weakest)}`,
        '',
        '## Improvement action',
        entry.improvementAction,
    ].join('\n');
}
function formatOutsourcingAudit(entry) {
    const linked = [
        entry.createdExplainBackId ? `Created explain-back: ${entry.createdExplainBackId}` : undefined,
        entry.createdDebtId ? `Created debt: ${entry.createdDebtId}` : undefined,
    ].filter(Boolean);
    return [
        `# AI Outsourcing Audit ${entry.id}`,
        '',
        `Outsourcing Risk: ${entry.risk}`,
        '',
        '## Main risk areas',
        ...entry.riskAreas.map((area) => `- ${area}`),
        '',
        '## Suggested next action',
        entry.suggestedNextAction,
        ...(linked.length > 0 ? ['', ...linked] : []),
    ].join('\n');
}
function formatDecisionList(entries) {
    if (entries.length === 0) {
        return 'No decisions recorded yet.';
    }
    return entries
        .map((entry) => {
        const project = entry.project ? ` [${entry.project}]` : '';
        const reviewed = entry.review ? 'reviewed' : `review:${entry.reviewDate}`;
        return `${entry.id}${project} ${entry.title} -> ${entry.chosenOption} (${reviewed})`;
    })
        .join('\n');
}
function formatDecision(entry) {
    const lines = [
        `# Decision ${entry.id}: ${entry.title}`,
        '',
        `Project: ${entry.project ?? 'none'}`,
        `Tags: ${formatTags(entry.tags)}`,
        `Review date: ${entry.reviewDate}`,
        '',
        '## Context',
        entry.context,
        '',
        '## Options considered',
        ...entry.optionsConsidered.map((option) => `- ${option}`),
        '',
        '## Chosen option',
        entry.chosenOption,
        '',
        '## Reasoning',
        entry.reasoning,
        '',
        '## Tradeoffs',
        entry.tradeoffs,
        '',
        '## Expected outcome',
        entry.expectedOutcome,
    ];
    if (entry.review) {
        lines.push('', '## Review', `Reviewed: ${entry.review.reviewedAt}`, '', 'What happened:', entry.review.whatHappened, '', 'Was the decision good:', entry.review.wasGoodDecision, '', 'What changed:', entry.review.whatChanged, '', 'Choose same again:', entry.review.chooseSameAgain, '', 'Lessons learned:', entry.review.lessonsLearned);
    }
    return lines.join('\n');
}
function formatHeatmap(snapshot) {
    const width = 10;
    const bars = snapshot.areas.map((item) => {
        const filled = Math.round((item.score / snapshot.scale) * width);
        return `${item.area.padEnd(16)} [${'#'.repeat(filled).padEnd(width, '.')}] ${item.score}/${snapshot.scale}`;
    });
    return [
        `# System Comprehension Heatmap ${snapshot.id}`,
        '',
        `Project: ${snapshot.project ?? 'none'}`,
        '',
        ...bars,
        '',
        '## Weakest areas',
        ...snapshot.weakestAreas.map((item) => `- ${item.area}: ${item.score}/${snapshot.scale}`),
        '',
        '## Suggested focus',
        snapshot.suggestedFocus,
    ].join('\n');
}
function formatArchetype(result) {
    return [
        `# Cognitive Archetype ${result.id}`,
        '',
        `Primary: ${result.primary}`,
        `Secondary: ${result.secondary ?? 'none'}`,
        '',
        '## Scores',
        ...Object.entries(result.scores).map(([name, score]) => `- ${name}: ${score}`),
        '',
        '## What this means',
        result.explanation,
        '',
        '## Improvement actions',
        ...result.improvementActions.map((action) => `- ${action}`),
    ].join('\n');
}
function formatPractice(practice) {
    const lines = [
        `# Practice: ${practice.title}`,
        '',
        '## Why this practice matters',
        practice.why,
        '',
        '## Steps',
        ...practice.steps.map((step, index) => `${index + 1}. ${step}`),
        '',
        '## Reflection question',
        practice.reflectionQuestion,
    ];
    if (practice.followUpCommand) {
        lines.push('', '## Optional follow-up command', practice.followUpCommand);
    }
    return lines.join('\n');
}
function formatPromptReflection(entry) {
    return [
        `# Prompt Reflection ${entry.id}`,
        '',
        `Project: ${entry.project ?? 'none'}`,
        `Tags: ${formatTags(entry.tags)}`,
        '',
        '## Prompt quality reflection',
        `Goal: ${entry.goal}`,
        '',
        'What worked:',
        entry.worked,
        '',
        'What was unclear:',
        entry.unclear,
        '',
        'Hidden assumptions:',
        entry.hiddenAssumptions,
        '',
        '## Improved prompt version',
        entry.improvedPrompt,
        '',
        '## Lessons learned',
        entry.lessonsLearned,
    ].join('\n');
}
//# sourceMappingURL=format.js.map