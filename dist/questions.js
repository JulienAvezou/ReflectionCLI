"use strict";
/**
 * Reflection questions that guide developers to think deeply about their changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFLECTION_QUESTIONS = void 0;
exports.getQuestions = getQuestions;
exports.getQuestion = getQuestion;
exports.REFLECTION_QUESTIONS = [
    {
        key: 'intent',
        prompt: '🎯 What was the intent of these changes?',
        hint: 'What goal or problem were you trying to address?',
    },
    {
        key: 'problemSolved',
        prompt: '🔧 What problem did you solve?',
        hint: 'Describe the issue or bug you fixed, or feature you added.',
    },
    {
        key: 'learned',
        prompt: '📚 What did you learn while making these changes?',
        hint: 'Any new insights, patterns, or techniques you discovered?',
    },
    {
        key: 'wouldDoDifferently',
        prompt: '🤔 What would you do differently if you rewrote this?',
        hint: 'Critical reflection on your implementation approach.',
    },
    {
        key: 'confidence',
        prompt: '💪 How confident are you in this code? Why?',
        hint: 'Rate your confidence and explain your reasoning.',
    },
    {
        key: 'testing',
        prompt: '✅ What testing did you do?',
        hint: 'Unit tests, manual testing, integration tests?',
    },
    {
        key: 'technicalDebt',
        prompt: '⚠️  Any technical debt or TODOs introduced?',
        hint: 'Shortcuts, edge cases, or future improvements?',
    },
];
/**
 * Get all reflection questions
 */
function getQuestions() {
    return exports.REFLECTION_QUESTIONS;
}
/**
 * Get a single question by key
 */
function getQuestion(key) {
    return exports.REFLECTION_QUESTIONS.find((q) => q.key === key);
}
//# sourceMappingURL=questions.js.map