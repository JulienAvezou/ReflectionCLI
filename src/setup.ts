/**
 * Setup module for installing the pre-commit hook
 */

import * as fs from 'fs';
import * as path from 'path';
import { findGitDir, ensureGitReflectDir } from './storage';

const HOOK_SCRIPT = `#!/bin/bash
# git-reflect pre-commit hook
# This hook runs before each commit to prompt reflection

# Connect to user's terminal for interactive input
# Pre-commit hooks need explicit terminal connection
exec </dev/tty
exec git-reflect --hook

exit $?
`;

/**
 * Get the path to the pre-commit hook file
 */
function getHookPath(): string {
  const gitDir = findGitDir();
  if (!gitDir) {
    throw new Error('Not inside a git repository');
  }
  return path.join(gitDir, 'hooks', 'pre-commit');
}

/**
 * Check if pre-commit hook already exists
 */
export function hookExists(): boolean {
  try {
    return fs.existsSync(getHookPath());
  } catch {
    return false;
  }
}

/**
 * Install the pre-commit hook
 */
export function installHook(): void {
  try {
    const hookPath = getHookPath();
    const hooksDir = path.dirname(hookPath);

    // Ensure hooks directory exists
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    // Check if hook already exists
    if (fs.existsSync(hookPath)) {
      console.log(
        '⚠️  Pre-commit hook already exists. Backing up to pre-commit.backup'
      );
      fs.copyFileSync(hookPath, `${hookPath}.backup`);
    }

    // Write the new hook
    fs.writeFileSync(hookPath, HOOK_SCRIPT, 'utf-8');
    fs.chmodSync(hookPath, 0o755); // Make executable

    // Ensure git-reflect directory exists
    ensureGitReflectDir();

    console.log('✅ git-reflect hook installed successfully!');
    console.log(
      '📝 Next time you commit, you will be prompted with reflection questions.'
    );
  } catch (error) {
    throw new Error(`Failed to install hook: ${error}`);
  }
}

/**
 * Uninstall the pre-commit hook
 */
export function uninstallHook(): void {
  try {
    const hookPath = getHookPath();
    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      console.log('✅ git-reflect hook uninstalled.');
    } else {
      console.log('ℹ️  No git-reflect hook found.');
    }
  } catch (error) {
    throw new Error(`Failed to uninstall hook: ${error}`);
  }
}

/**
 * Verify the hook is installed and executable
 */
export function verifyHook(): boolean {
  try {
    const hookPath = getHookPath();
    if (!fs.existsSync(hookPath)) {
      return false;
    }
    const stats = fs.statSync(hookPath);
    // Check if executable (mode & 0o111 != 0)
    return (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}
