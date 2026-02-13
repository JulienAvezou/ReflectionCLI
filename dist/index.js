"use strict";
/**
 * Main CLI entry point for git-reflect
 */
Object.defineProperty(exports, "__esModule", { value: true });
const hook_1 = require("./hook");
const setup_1 = require("./setup");
const VERSION = '0.1.0';
const HELP_TEXT = `
git-reflect ${VERSION}
Integrate structured reflection into your git workflow

USAGE
  git-reflect <command> [options]

COMMANDS
  install              Install the pre-commit hook
  uninstall            Remove the pre-commit hook
  --help, -h           Show this help message
  --version, -v        Show version

EXAMPLES
  git-reflect install   # Set up git-reflect
  git-reflect --help    # Show this help

For more information, visit: https://github.com/JulienAvezou/git-reflect
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