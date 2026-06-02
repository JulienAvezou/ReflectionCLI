/**
 * Main CLI entry point for git-reflect
 */

import { runHook } from './hook';
import { installHook, uninstallHook, verifyHook } from './setup';
import {
  runArchetypeCommand,
  runAuditCommand,
  runDecideCommand,
  runDecisionCommand,
  runDecisionsCommand,
  runDebtCommand,
  runExplainCommand,
  runHeatmapCommand,
  runLearnCommand,
  runModeCommand,
  runPracticeCommand,
  runPromptCommand,
  runScoreCommand,
  runWeeklyCommand,
} from './commands';

const VERSION = '0.1.0';

const HELP_TEXT = `
reflection ${VERSION}
A local-first thinking tool for AI-assisted developers

USAGE
  reflection <command> [options]
  git-reflect <command> [options]

COMMANDS
  debt add [title]      Add comprehension debt
  debt list             List open comprehension debt
  debt resolve <id>     Mark comprehension debt as resolved
  debt show <id>        Show one comprehension debt item
  learn                 Extract learning from a coding session
  explain               Run explain-back mode
  weekly                Generate a weekly thinking report
  mode                  Recommend a thinking mode before using AI
  score                 Self-assess thinking quality
  audit                 Audit AI outsourcing risk
  decide                Record a technical decision
  decisions             List recorded decisions
  decision show <id>    Show a decision
  decision review <id>  Review a decision outcome
  heatmap               Create a system comprehension heatmap
  heatmap update        Update a heatmap
  heatmap report        Show latest heatmap report
  archetype             Assess AI collaboration archetype
  practice              Generate a weekly thinking practice
  prompt                Reflect on an AI prompt
  install              Install the pre-commit hook
  uninstall            Remove the pre-commit hook
  --help, -h           Show this help message
  --version, -v        Show version

EXAMPLES
  reflection debt add "I do not fully understand the caching layer" --project api --tags caching,ai
  reflection debt list
  reflection learn
  reflection explain
  reflection weekly --output weekly-thinking-report.md
  reflection mode --goal "choose between two cache designs"
  reflection audit
  reflection practice
  git-reflect install

For more information, visit: https://github.com/JulienAvezou/ReflectionCLI
`;

/**
 * Parse CLI arguments and execute command
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (!command || command === '--help' || command === '-h') {
      console.log(HELP_TEXT);
      process.exit(0);
    }

    if (command === '--version' || command === '-v') {
      console.log(`git-reflect ${VERSION}`);
      process.exit(0);
    }

    if (command === 'install') {
      installHook();
      process.exit(0);
    }

    if (command === 'uninstall') {
      uninstallHook();
      process.exit(0);
    }

    if (command === '--hook') {
      // Internal: called by the git hook
      await runHook();
      process.exit(0);
    }

    if (command === 'verify') {
      // Internal: verify hook is installed
      const isVerified = verifyHook();
      if (isVerified) {
        console.log('✅ git-reflect hook is installed and executable');
        process.exit(0);
      } else {
        console.log('❌ git-reflect hook is not installed or not executable');
        process.exit(1);
      }
    }

    if (command === 'debt') {
      await runDebtCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'learn') {
      await runLearnCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'explain') {
      await runExplainCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'weekly') {
      await runWeeklyCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'mode') {
      await runModeCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'score') {
      await runScoreCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'audit') {
      await runAuditCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'decide') {
      await runDecideCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'decisions') {
      await runDecisionsCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'decision') {
      await runDecisionCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'heatmap') {
      await runHeatmapCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'archetype') {
      await runArchetypeCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'practice') {
      await runPracticeCommand(args.slice(1));
      process.exit(0);
    }

    if (command === 'prompt') {
      await runPromptCommand(args.slice(1));
      process.exit(0);
    }

    console.log(`Unknown command: ${command}`);
    console.log(HELP_TEXT);
    process.exit(1);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
