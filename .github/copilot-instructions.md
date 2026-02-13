# GitHub Copilot Instructions for git-reflect

## Project Overview

**git-reflect** is a Node.js/TypeScript CLI tool that integrates structured reflection into the git commit workflow. It prompts developers with thoughtful questions before each commit and stores responses in `.git/git-reflect/log.json` to build a personal reflection dataset. The project embodies the philosophy of counteracting AI cognitive offloading through deliberate reflection.

## Build, Test, and Lint Commands

```bash
# Build TypeScript to dist/
npm run build

# Development: watch mode for continuous compilation
npm run dev

# Run all tests
npm test

# Run single test file
npm test -- tests/storage.test.ts

# Run tests in watch mode
npm test -- --watch

# Lint TypeScript files
npm run lint

# Format code with Prettier
npm run format

# Local installation (for testing)
npm link
git-reflect install
```

## Architecture Overview

### High-Level Flow

1. **User commits** → Git triggers pre-commit hook
2. **Hook prompts** → User answers 7 reflection questions via interactive CLI
3. **Responses captured** → Stored in `.git/git-reflect/log.json` with metadata
4. **Commit completes** → Only if user finishes reflection (or uses `--no-verify`)

### Core Modules

- **`index.ts`** — CLI entry point, command parsing (install, help)
- **`setup.ts`** — Installs/configures the pre-commit hook into `.git/hooks/`
- **`hook.ts`** — The executable pre-commit hook that prompts questions and stores responses
- **`questions.ts`** — Defines the 7 reflection questions and their metadata
- **`storage.ts`** — Handles reading/writing to `.git/git-reflect/log.json`
- **`types.ts`** — TypeScript interfaces for ReflectionEntry, AnswersMap, LogFile, etc.

### Data Flow

```
.git/git-reflect/
├── log.json          # Persistent reflection log (auto-created)
└── hook-script.sh    # Pre-commit hook (symlinked or copied)

Log Structure:
{
  version: "1.0",
  entries: [{ timestamp, branchName, commitMessage, answers }],
  stats: { totalCommits, projectStartDate }
}
```

## Key Conventions

- **Paths**: Use `path.join()` and `path.resolve()` to handle cross-platform paths safely
- **Git Info**: Pre-commit hook has no commit hash yet; capture branch name via `git rev-parse --abbrev-ref HEAD` and commit message from `$GIT_PARAMS` or user input
- **Hook Invocation**: Pre-commit hook is shell script that spawns Node process to run hook logic
- **Error Handling**: All file I/O wrapped with try-catch; graceful degradation if log is corrupted
- **Inquirer Integration**: Use inquirer for all user prompts; validate non-empty answers before storing
- **Exit Codes**: Hook exits 0 to allow commit, 1 to block commit if user cancels/errors
- **TypeScript**: Strict mode enabled; all functions typed; use interfaces for data structures

## Testing Strategy

- **Unit Tests**: Test each module independently (storage, questions, prompt logic)
- **Integration Tests**: Test setup flow (install hook, trigger it, verify log written)
- **No Mocking Git**: Use real git for integration tests; create temp git repos in test fixtures
- **Test Structure**: One test file per src module (e.g., `tests/storage.test.ts`)

## Installation & Development

1. Clone: `git clone https://github.com/JulienAvezou/git-reflect.git`
2. Install: `npm install`
3. Build: `npm run build`
4. Link locally: `npm link` to make `git-reflect` command available
5. Test: `git-reflect install` in any test git repo

## Notes

- **Tone**: Emphasize reflection and cognitive awareness; avoid marketing hype
- **UX**: Keep CLI minimal and focused; clear prompts, concise output
- **Privacy**: All data local; never transmit reflections
- **Future**: Post-MVP could add analytics, export, customization, but MVP is hook + storage only
