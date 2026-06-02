"use strict";
/**
 * Main CLI entry point for git-reflect
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hook_1 = require("./hook");
const setup_1 = require("./setup");
const commands_1 = require("./commands");
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
async function main() {
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
            (0, setup_1.installHook)();
            process.exit(0);
        }
        if (command === 'uninstall') {
            (0, setup_1.uninstallHook)();
            process.exit(0);
        }
        if (command === '--hook') {
            // Internal: called by the git hook
            await (0, hook_1.runHook)();
            process.exit(0);
        }
        if (command === 'verify') {
            // Internal: verify hook is installed
            const isVerified = (0, setup_1.verifyHook)();
            if (isVerified) {
                console.log('✅ git-reflect hook is installed and executable');
                process.exit(0);
            }
            else {
                console.log('❌ git-reflect hook is not installed or not executable');
                process.exit(1);
            }
        }
        if (command === 'debt') {
            await (0, commands_1.runDebtCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'learn') {
            await (0, commands_1.runLearnCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'explain') {
            await (0, commands_1.runExplainCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'weekly') {
            await (0, commands_1.runWeeklyCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'mode') {
            await (0, commands_1.runModeCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'score') {
            await (0, commands_1.runScoreCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'audit') {
            await (0, commands_1.runAuditCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'decide') {
            await (0, commands_1.runDecideCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'decisions') {
            await (0, commands_1.runDecisionsCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'decision') {
            await (0, commands_1.runDecisionCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'heatmap') {
            await (0, commands_1.runHeatmapCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'archetype') {
            await (0, commands_1.runArchetypeCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'practice') {
            await (0, commands_1.runPracticeCommand)(args.slice(1));
            process.exit(0);
        }
        if (command === 'prompt') {
            await (0, commands_1.runPromptCommand)(args.slice(1));
            process.exit(0);
        }
        console.log(`Unknown command: ${command}`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
    catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map