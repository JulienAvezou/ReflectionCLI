/**
 * Pre-commit hook logic that prompts users with reflection questions
 */

import inquirer from 'inquirer';
import { getQuestions } from './questions';
import { addEntry, createEntry, findGitDir } from './storage';
import { Answers } from './types';
import { execSync } from 'child_process';

/**
 * Get current git branch name
 */
function getBranchName(): string {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Ignore stderr to suppress errors
    }).trim();
    return branch;
  } catch {
    // On initial commit, HEAD doesn't exist - use current branch or master
    try {
      const branch = execSync('git branch --show-current', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      return branch || 'initial-commit';
    } catch {
      return 'initial-commit';
    }
  }
}

/**
 * Get the commit message from git
 * Pre-commit hooks don't have the message yet, so we read it from COMMIT_EDITMSG
 */
function getCommitMessage(): string {
  try {
    const gitDir = findGitDir();
    if (!gitDir) return 'No message available';

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
    const status = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
    }).trim();
    return `Changes to: ${status.split('\n').slice(0, 3).join(', ')}`;
  } catch (_error) {
    return '[commit message]';
  }
}

/**
 * Prompt user with reflection questions
 */
export async function promptReflections(): Promise<Answers> {
  const questions = getQuestions();

  console.log('\n✨ Take a moment to reflect on your changes:\n');

  const answers = await inquirer.prompt(
    questions.map((q) => ({
      type: 'input',
      name: q.key,
      message: q.prompt,
      prefix: '',
      validate: (answer: string) => {
        if (!answer || answer.trim().length === 0) {
          return 'Please provide an answer';
        }
        return true;
      },
    }))
  );

  return answers as Answers;
}

/**
 * Run the pre-commit hook
 * This is called by the git hook and prompts for reflections before commit
 */
export async function runHook(): Promise<void> {
  try {
    const branchName = getBranchName();
    const commitMessage = getCommitMessage();

    // Prompt user for reflections
    const answers = await promptReflections();

    // Create and store the reflection entry
    const entry = createEntry(branchName, commitMessage, answers);
    addEntry(entry);

    console.log(
      '\n📝 Reflection saved! Your entry has been added to .git/git-reflect/log.json\n'
    );
    process.exit(0);
  } catch (_error) {
    // User cancelled (Ctrl+C)
    console.log('\n❌ Reflection cancelled. Commit aborted.\n');
    process.exit(1);
  }
}
