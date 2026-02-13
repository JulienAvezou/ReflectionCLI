/**
 * Pre-commit hook logic that prompts users with reflection questions
 */
import { Answers } from './types';
/**
 * Prompt user with reflection questions
 */
export declare function promptReflections(): Promise<Answers>;
/**
 * Run the pre-commit hook
 * This is called by the git hook and prompts for reflections before commit
 */
export declare function runHook(): Promise<void>;
//# sourceMappingURL=hook.d.ts.map