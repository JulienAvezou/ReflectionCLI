"use strict";
/**
 * Pre-commit hook logic that prompts users with reflection questions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptReflections = promptReflections;
exports.runHook = runHook;
const inquirer_1 = __importDefault(require("inquirer"));
const questions_1 = require("./questions");
const storage_1 = require("./storage");
const child_process_1 = require("child_process");
/**
 * Get current git branch name
 */
function getBranchName() {
    try {
        const branch = (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf-8',
        }).trim();
        return branch;
    }
    catch {
        return 'unknown';
    }
}
/**
 * Get the commit message from git
 * Pre-commit hooks don't have the message yet, so we read it from COMMIT_EDITMSG
 */
function getCommitMessage() {
    try {
        const gitDir = (0, storage_1.findGitDir)();
        if (!gitDir)
            return 'No message available';
        // Try to read from COMMIT_EDITMSG (available during pre-commit)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const path = require('path');
        const msgPath = path.join(gitDir, 'COMMIT_EDITMSG');
        if (fs.existsSync(msgPath)) {
            const message = fs.readFileSync(msgPath, 'utf-8').trim();
            return message.split('\n')[0]; // Get first line
        }
        // Fallback: get staged files summary
        const status = (0, child_process_1.execSync)('git diff --cached --name-only', {
            encoding: 'utf-8',
        }).trim();
        return `Changes to: ${status.split('\n').slice(0, 3).join(', ')}`;
    }
    catch (_error) {
        return '[commit message]';
    }
}
/**
 * Prompt user with reflection questions
 */
async function promptReflections() {
    const questions = (0, questions_1.getQuestions)();
    console.log('\n✨ Take a moment to reflect on your changes:\n');
    const answers = await inquirer_1.default.prompt(questions.map((q) => ({
        type: 'input',
        name: q.key,
        message: q.prompt,
        prefix: '',
        validate: (answer) => {
            if (!answer || answer.trim().length === 0) {
                return 'Please provide an answer';
            }
            return true;
        },
    })));
    return answers;
}
/**
 * Run the pre-commit hook
 * This is called by the git hook and prompts for reflections before commit
 */
async function runHook() {
    try {
        const branchName = getBranchName();
        const commitMessage = getCommitMessage();
        // Prompt user for reflections
        const answers = await promptReflections();
        // Create and store the reflection entry
        const entry = (0, storage_1.createEntry)(branchName, commitMessage, answers);
        (0, storage_1.addEntry)(entry);
        console.log('\n📝 Reflection saved! Your entry has been added to .git/git-reflect/log.json\n');
        process.exit(0);
    }
    catch (_error) {
        // User cancelled (Ctrl+C)
        console.log('\n❌ Reflection cancelled. Commit aborted.\n');
        process.exit(1);
    }
}
//# sourceMappingURL=hook.js.map